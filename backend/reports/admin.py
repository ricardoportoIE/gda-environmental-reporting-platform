from django.contrib import admin

from .models import Attachment, Category, Municipality, Report, StatusTransition

admin.site.register(Category)
admin.site.register(Municipality)
admin.site.register(Report)
admin.site.register(StatusTransition)
admin.site.register(Attachment)
