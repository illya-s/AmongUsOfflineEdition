"""
# game/urls.py
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("locations", views.LocationView, basename="location")
router.register("tasks", views.TasksView, basename="task")
router.register("games", views.GameRoomView, basename="root")


urlpatterns = [
    path("", include(router.urls)),
    path("game/<str:code>/toggle/", view=views.GameStartToggle.as_view()),

    path("game/<str:code>/players/", view=views.GamePlayersView.as_view()),
    path("game/<str:code>/player/", view=views.GamePlayerView.as_view()),
   
    path("game/<str:code>/game-task/", view=views.GameTaskView.as_view()),

    path("players/", view=views.PlayersView.as_view()),
    path("players/<int:pk>/", view=views.PlayerView.as_view()),
]
