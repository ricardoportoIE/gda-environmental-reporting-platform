import math

from django.contrib.gis.geos import Point
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .models import Attachment, Category, Municipality, Report, StatusTransition


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name")


class MunicipalitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Municipality
        fields = ("ibge_code", "name", "state")


class LocationFieldsMixin:
    def validate(self, attrs):
        latitude = attrs.pop("latitude", None)
        longitude = attrs.pop("longitude", None)
        if (latitude is None) != (longitude is None):
            raise serializers.ValidationError("Latitude and longitude must be provided together.")
        if latitude is not None:
            attrs["location"] = Point(longitude, latitude, srid=4326)
        return attrs


class ReportCreateSerializer(LocationFieldsMixin, serializers.ModelSerializer):
    latitude = serializers.FloatField(min_value=-90, max_value=90, required=False)
    longitude = serializers.FloatField(min_value=-180, max_value=180, required=False)
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.filter(active=True))

    class Meta:
        model = Report
        fields: tuple[str, ...] = (
            "title",
            "description",
            "category",
            "municipality",
            "address",
            "latitude",
            "longitude",
        )


class ReportUpdateSerializer(LocationFieldsMixin, serializers.ModelSerializer):
    latitude = serializers.FloatField(min_value=-90, max_value=90, required=False)
    longitude = serializers.FloatField(min_value=-180, max_value=180, required=False)
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.filter(active=True))

    class Meta:
        model = Report
        fields = (
            "title",
            "description",
            "category",
            "municipality",
            "address",
            "latitude",
            "longitude",
        )


class TransitionSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Report.Status.choices)
    reason = serializers.CharField(max_length=500, required=False, allow_blank=True)


class StatusTransitionSerializer(serializers.ModelSerializer):
    actor = serializers.UUIDField(source="actor_id", read_only=True)

    class Meta:
        model = StatusTransition
        fields = ("from_status", "to_status", "actor", "reason", "created_at")


class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ("id", "original_name", "content_type", "size", "created_at")


class AttachmentUploadSerializer(serializers.Serializer):
    file = serializers.FileField(help_text="PNG, JPEG or PDF evidence, up to 5 MB.")


class ReportSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    municipality = MunicipalitySerializer(read_only=True)
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()
    attachments = AttachmentSerializer(many=True, read_only=True)
    transitions = StatusTransitionSerializer(many=True, read_only=True)

    class Meta:
        model = Report
        fields: tuple[str, ...] = (
            "id",
            "title",
            "description",
            "category",
            "municipality",
            "address",
            "latitude",
            "longitude",
            "reporter",
            "status",
            "priority",
            "assigned_to",
            "created_at",
            "updated_at",
            "attachments",
            "transitions",
        )

    @extend_schema_field(OpenApiTypes.DOUBLE)
    def get_latitude(self, obj):
        return obj.location.y if obj.location else None

    @extend_schema_field(OpenApiTypes.DOUBLE)
    def get_longitude(self, obj):
        return obj.location.x if obj.location else None


class NearbyQuerySerializer(serializers.Serializer):
    latitude = serializers.FloatField(min_value=-90, max_value=90)
    longitude = serializers.FloatField(min_value=-180, max_value=180)
    radius_km = serializers.FloatField(min_value=0.1, max_value=50, default=5)
    exclude_id = serializers.UUIDField(required=False)

    def validate(self, attrs):
        if any(not math.isfinite(attrs[key]) for key in ("latitude", "longitude", "radius_km")):
            raise serializers.ValidationError("Coordinates and radius must be finite numbers.")
        return attrs


class NearbyReportSerializer(serializers.ModelSerializer):
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()
    distance_km = serializers.SerializerMethodField()
    category = serializers.CharField(source="category.name")

    class Meta:
        model = Report
        fields = ("id", "title", "status", "category", "latitude", "longitude", "distance_km")

    @extend_schema_field(OpenApiTypes.DOUBLE)
    def get_latitude(self, obj):
        return obj.location.y

    @extend_schema_field(OpenApiTypes.DOUBLE)
    def get_longitude(self, obj):
        return obj.location.x

    @extend_schema_field(OpenApiTypes.DOUBLE)
    def get_distance_km(self, obj):
        return round(obj.distance.km, 2)


class ReportCreateResponseSerializer(ReportSerializer):
    access_token = serializers.CharField(
        required=False, help_text="Returned once for anonymous reports."
    )

    class Meta(ReportSerializer.Meta):
        fields = (*ReportSerializer.Meta.fields, "access_token")


class ReportPageSerializer(serializers.Serializer):
    count = serializers.IntegerField()
    next = serializers.URLField(allow_null=True)
    previous = serializers.URLField(allow_null=True)
    results = ReportSerializer(many=True)
