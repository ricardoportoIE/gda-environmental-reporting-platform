import uuid
import warnings

from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.db import transaction
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from drf_spectacular.utils import extend_schema
from PIL import Image, UnidentifiedImageError
from rest_framework import status
from rest_framework.exceptions import NotAuthenticated, PermissionDenied, ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.views import APIView

from accounts.models import User
from accounts.permissions import IsOperator

from .models import Attachment, Category, Municipality, Report, StatusTransition
from .security import issue_anonymous_token, require_report_access
from .serializers import (
    AttachmentSerializer,
    CategorySerializer,
    MunicipalitySerializer,
    NearbyQuerySerializer,
    NearbyReportSerializer,
    ReportCreateSerializer,
    ReportSerializer,
    ReportUpdateSerializer,
    TransitionSerializer,
)
from .services import transition_report
from .throttles import ReportCreateThrottle


class CategoryListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            CategorySerializer(
                Category.objects.filter(active=True).order_by("name"), many=True
            ).data
        )


class MunicipalityListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        query = request.query_params.get("q", "")[:100]
        qs = Municipality.objects.all()
        if query:
            qs = qs.filter(name__icontains=query)
        return Response(MunicipalitySerializer(qs[:50], many=True).data)


class ReportNearbyView(APIView):
    permission_classes = [IsOperator]

    @extend_schema(parameters=[NearbyQuerySerializer], responses=NearbyReportSerializer(many=True))
    def get(self, request):
        query = NearbyQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        values = query.validated_data
        centre = Point(values["longitude"], values["latitude"], srid=4326)
        nearby = (
            Report.objects.filter(
                location__isnull=False,
                location__distance_lte=(centre, D(km=values["radius_km"])),
            )
            .select_related("category")
            .annotate(distance=Distance("location", centre))
            .order_by("distance", "id")
        )
        if excluded := values.get("exclude_id"):
            nearby = nearby.exclude(pk=excluded)
        return Response(NearbyReportSerializer(nearby[:50], many=True).data)


@method_decorator(csrf_protect, name="dispatch")
class ReportListCreateView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle, UserRateThrottle]

    def get_throttles(self):
        throttles = super().get_throttles()
        if self.request.method == "POST":
            throttles.append(ReportCreateThrottle())
        return throttles

    def get(self, request):
        if not request.user.is_authenticated:
            raise NotAuthenticated()
        qs = Report.objects.select_related("category", "municipality").prefetch_related(
            "attachments",
            "transitions",
        )
        if request.user.role == User.Role.CITIZEN:
            qs = qs.filter(reporter=request.user)
        if status_filter := request.query_params.get("status"):
            if status_filter not in Report.Status.values:
                raise ValidationError({"status": "Unknown status."})
            qs = qs.filter(status=status_filter)
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        return paginator.get_paginated_response(ReportSerializer(page, many=True).data)

    def post(self, request):
        serializer = ReportCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report = serializer.save(reporter=request.user if request.user.is_authenticated else None)
        access_token = ""
        if report.reporter_id is None:
            access_token = issue_anonymous_token(report)
            report.save(update_fields=["anonymous_token_hash"])
        StatusTransition.objects.create(
            report=report, to_status=report.status, actor=report.reporter
        )
        data = ReportSerializer(report).data
        if access_token:
            data["access_token"] = access_token
        return Response(data, status=status.HTTP_201_CREATED)


@method_decorator(csrf_protect, name="dispatch")
class ReportDetailView(APIView):
    permission_classes = [AllowAny]

    def get_object(self, request, pk):
        report = get_object_or_404(
            Report.objects.select_related("category", "municipality").prefetch_related(
                "attachments",
                "transitions",
            ),
            pk=pk,
        )
        require_report_access(request, report)
        return report

    def get(self, request, pk):
        return Response(ReportSerializer(self.get_object(request, pk)).data)

    def patch(self, request, pk):
        report = self.get_object(request, pk)
        if report.status != Report.Status.ANALYSIS:
            raise PermissionDenied("Only reports in analysis can be edited.")
        if report.reporter_id != request.user.pk and request.user.role == User.Role.CITIZEN:
            raise PermissionDenied()
        serializer = ReportUpdateSerializer(report, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ReportSerializer(report).data)


@method_decorator(csrf_protect, name="dispatch")
class ReportTransitionView(APIView):
    permission_classes = [IsOperator]

    def post(self, request, pk):
        serializer = TransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report = transition_report(
            pk,
            to_status=serializer.validated_data["status"],
            actor=request.user,
            reason=serializer.validated_data.get("reason", ""),
        )
        return Response(ReportSerializer(report).data)


ALLOWED_SIGNATURES = {
    "image/png": (b"\x89PNG\r\n\x1a\n", ".png"),
    "image/jpeg": (b"\xff\xd8\xff", ".jpg"),
    "application/pdf": (b"%PDF-", ".pdf"),
}


@method_decorator(csrf_protect, name="dispatch")
class AttachmentUploadView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, pk):
        upload = request.FILES.get("file")
        if upload is None:
            raise ValidationError({"file": "A file is required."})
        if upload.size > 5 * 1024 * 1024:
            raise ValidationError({"file": "Maximum file size is 5 MB."})
        signature = ALLOWED_SIGNATURES.get(upload.content_type)
        if signature is None or not upload.read(16).startswith(signature[0]):
            raise ValidationError({"file": "Only PNG, JPEG and PDF files are accepted."})
        upload.seek(0)
        if upload.content_type.startswith("image/"):
            try:
                with warnings.catch_warnings():
                    warnings.simplefilter("error", Image.DecompressionBombWarning)
                    with Image.open(upload) as image:
                        image.verify()
            except (OSError, ValueError, UnidentifiedImageError, Image.DecompressionBombWarning):
                raise ValidationError({"file": "The image is invalid."}) from None
            upload.seek(0)
        with transaction.atomic():
            report = get_object_or_404(Report.objects.select_for_update(), pk=pk)
            require_report_access(request, report)
            if report.status != Report.Status.ANALYSIS:
                raise PermissionDenied("Attachments are closed after analysis.")
            if report.attachments.count() >= 4:
                raise ValidationError({"file": "At most four files are allowed."})
            attachment = Attachment(
                report=report,
                original_name=upload.name[:200],
                content_type=upload.content_type,
                size=upload.size,
                uploaded_by=request.user if request.user.is_authenticated else None,
            )
            attachment.file.save(f"{uuid.uuid4().hex}{signature[1]}", upload, save=False)
            attachment.save()
        return Response(AttachmentSerializer(attachment).data, status=status.HTTP_201_CREATED)


class AttachmentDownloadView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk, attachment_id):
        attachment = get_object_or_404(
            Attachment.objects.select_related("report"), pk=attachment_id, report_id=pk
        )
        require_report_access(request, attachment.report)
        response = FileResponse(
            attachment.file.open("rb"), as_attachment=True, filename=attachment.original_name
        )
        response["Cache-Control"] = "private, no-store"
        response["X-Content-Type-Options"] = "nosniff"
        return response
