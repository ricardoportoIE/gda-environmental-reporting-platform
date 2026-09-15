from rest_framework.permissions import BasePermission

from .models import User


class IsOperator(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user.is_authenticated
            and request.user.role
            in (
                User.Role.OPERATOR,
                User.Role.ADMIN,
            )
        )


class IsGDAAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user.is_authenticated and request.user.role == User.Role.ADMIN)
