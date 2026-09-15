from django.contrib.auth import authenticate, login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User
from .permissions import IsGDAAdmin
from .serializers import (
    AdminUserSerializer,
    LoginSerializer,
    PublicUserSerializer,
    RegisterSerializer,
)
from .throttles import AuthThrottle


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CSRFView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"detail": "CSRF cookie set"})


@method_decorator(csrf_protect, name="dispatch")
class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthThrottle]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        login(request, user)
        return Response(PublicUserSerializer(user).data, status=status.HTTP_201_CREATED)


@method_decorator(csrf_protect, name="dispatch")
class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=serializer.validated_data["email"].strip().lower(),
            password=serializer.validated_data["password"],
        )
        if user is None:
            return Response({"detail": "Invalid credentials."}, status=status.HTTP_400_BAD_REQUEST)
        login(request, user)
        return Response(PublicUserSerializer(user).data)


@method_decorator(csrf_protect, name="dispatch")
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PublicUserSerializer

    def get_object(self):
        return self.request.user


class AdminUsersView(generics.ListAPIView):
    permission_classes = [IsGDAAdmin]
    serializer_class = AdminUserSerializer
    queryset = User.objects.order_by("email")


class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsGDAAdmin]
    serializer_class = AdminUserSerializer
    queryset = User.objects.all()

    def perform_update(self, serializer):
        if serializer.instance == self.request.user:
            from rest_framework.exceptions import ValidationError

            if serializer.validated_data.get("role") not in (None, User.Role.ADMIN):
                raise ValidationError({"role": "You cannot remove your own administrator role."})
            if serializer.validated_data.get("is_active") is False:
                raise ValidationError({"is_active": "You cannot deactivate your own account."})
        serializer.save()
