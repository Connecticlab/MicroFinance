from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RemboursementViewSet

router = DefaultRouter()
router.register(r'', RemboursementViewSet, basename='remboursements')

urlpatterns = [
    path('', include(router.urls)),
]
