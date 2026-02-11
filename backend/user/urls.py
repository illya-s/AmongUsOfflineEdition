"""
# user/urls.py
"""

from django.urls import path
from . import views


urlpatterns = [
    path("auth/request/", views.RequestCodeView.as_view()),
    path("auth/enter/", views.EnterCodeView.as_view()),
    path("auth/refresh/", views.RefreshView.as_view()),
    path("auth/session/", views.SessionView.as_view()),

    path("devices/", views.DeviceListView.as_view()),
    path("devices/<int:pk>/", views.DeviceDeleteView.as_view()),
    path("devices/logout_others/", views.DeviceLogoutOthersView.as_view()),
]
