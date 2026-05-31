from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DossierRecouvrementViewSet, ActionRecouvrementViewSet

router = DefaultRouter()
router.register(r'dossiers', DossierRecouvrementViewSet, basename='recouvrement')
router.register(r'actions', ActionRecouvrementViewSet, basename='actions-recouvrement')

urlpatterns = [
    path('', include(router.urls)),
]
