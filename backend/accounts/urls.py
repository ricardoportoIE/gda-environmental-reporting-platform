from django.urls import path

from .views import (
    AdminUserDetailView,
    AdminUsersView,
    CSRFView,
    LoginView,
    LogoutView,
    MeView,
    RegisterView,
)

urlpatterns = [
    path("csrf/", CSRFView.as_view()),
    path("register/", RegisterView.as_view()),
    path("login/", LoginView.as_view()),
    path("logout/", LogoutView.as_view()),
    path("me/", MeView.as_view()),
    path("users/", AdminUsersView.as_view()),
    path("users/<uuid:pk>/", AdminUserDetailView.as_view()),
]
