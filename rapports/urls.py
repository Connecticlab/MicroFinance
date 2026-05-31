from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ParametresMicrofinanceViewSet, DashboardViewSet

router = DefaultRouter()
router.register(r'parametres', ParametresMicrofinanceViewSet, basename='parametres')
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    path('', include(router.urls)),
]
