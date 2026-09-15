from django.contrib.gis.geos import Point
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
        fields = (
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


class ReportSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    municipality = MunicipalitySerializer(read_only=True)
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()
    attachments = AttachmentSerializer(many=True, read_only=True)
    transitions = StatusTransitionSerializer(many=True, read_only=True)

    class Meta:
        model = Report
        fields = (
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

    def get_latitude(self, obj):
        return obj.location.y if obj.location else None

    def get_longitude(self, obj):
        return obj.location.x if obj.location else None
