from django.urls import path

from .views import (
    AttachmentDownloadView,
    AttachmentUploadView,
    CategoryListView,
    MunicipalityListView,
    ReportDetailView,
    ReportListCreateView,
    ReportTransitionView,
)

urlpatterns = [
    path("categories/", CategoryListView.as_view()),
    path("municipalities/", MunicipalityListView.as_view()),
    path("reports/", ReportListCreateView.as_view()),
    path("reports/<uuid:pk>/", ReportDetailView.as_view()),
    path("reports/<uuid:pk>/transition/", ReportTransitionView.as_view()),
    path("reports/<uuid:pk>/attachments/", AttachmentUploadView.as_view()),
    path("reports/<uuid:pk>/attachments/<uuid:attachment_id>/", AttachmentDownloadView.as_view()),
]
