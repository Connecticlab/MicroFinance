from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UtilisateurViewSet, get_configuration

router = DefaultRouter()
router.register(r'utilisateurs', UtilisateurViewSet, basename='utilisateurs')

urlpatterns = [
    path('', include(router.urls)),
    path('configuration/', get_configuration, name='configuration'),
]
