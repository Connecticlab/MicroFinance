from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EcritureCompteGlobalViewSet

router = DefaultRouter()
router.register(r'', EcritureCompteGlobalViewSet, basename='caisse')

urlpatterns = [
    path('', include(router.urls)),
]
