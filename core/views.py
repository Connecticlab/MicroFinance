from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .models import Utilisateur
from .serializers import (
    UtilisateurSerializer,
    UtilisateurListSerializer,
    ProfilSerializer
)

class UtilisateurViewSet(viewsets.ModelViewSet):
    queryset = Utilisateur.objects.all().order_by('username')
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'first_name', 'last_name', 'email']
    ordering_fields = ['username', 'role']

    def get_serializer_class(self):
        if self.action == 'list':
            return UtilisateurListSerializer
        return UtilisateurSerializer

    @action(detail=False, methods=['get', 'put', 'patch'],
            permission_classes=[IsAuthenticated])
    def profil(self, request):
        if request.method == 'GET':
            serializer = ProfilSerializer(request.user)
            return Response(serializer.data)
        serializer = ProfilSerializer(
            request.user,
            data=request.data,
            partial=request.method == 'PATCH'
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'],
            permission_classes=[IsAuthenticated])
    def changer_mot_de_passe(self, request):
        user = request.user
        ancien = request.data.get('ancien_mot_de_passe')
        nouveau = request.data.get('nouveau_mot_de_passe')
        if not user.check_password(ancien):
            return Response(
                {'error': 'Ancien mot de passe incorrect.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        user.set_password(nouveau)
        user.save()
        return Response({'message': 'Mot de passe modifié avec succès.'})
