from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DossierCreditViewSet

router = DefaultRouter()
router.register(r'', DossierCreditViewSet, basename='credits')

urlpatterns = [
    path('', include(router.urls)),
]
