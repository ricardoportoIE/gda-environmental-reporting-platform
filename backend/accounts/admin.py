from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class GDAUserAdmin(UserAdmin):
    fieldsets = (
        (*UserAdmin.fieldsets, ("GDA", {"fields": ("role",)})) if UserAdmin.fieldsets else ()
    )
    add_fieldsets = (
        (*UserAdmin.add_fieldsets, ("GDA", {"fields": ("email", "role")}))
        if UserAdmin.add_fieldsets
        else ()
    )
    list_display = ("email", "role", "is_staff", "is_active")
