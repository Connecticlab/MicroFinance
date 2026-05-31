from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # Authentification JWT
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Apps
    path('api/core/', include('core.urls')),
    path('api/membres/', include('membres.urls')),
    path('api/credits/', include('credits.urls')),
    path('api/remboursements/', include('remboursements.urls')),
    path('api/caisse/', include('caisse.urls')),
    path('api/recouvrement/', include('recouvrement.urls')),
    path('api/rapports/', include('rapports.urls')),
]
