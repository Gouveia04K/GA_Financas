from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.db.models import Sum
from django.contrib.auth import authenticate
from .models import Categoria, Transacao, Meta
from .serializers import (
    CategoriaSerializer, 
    TransacaoSerializer, 
    MetaSerializer,
    UserSerializer
)

# ============================================
# LOGIN E REGISTRO - ENDPOINTS
# ============================================

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Endpoint de login
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'detail': 'Username e password são obrigatórios'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = authenticate(username=username, password=password)
    
    if user is None:
        return Response(
            {'detail': 'Credenciais inválidas'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Gerar tokens JWT
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'username': user.username,
        'email': user.email,
        'id': user.id
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Endpoint de registro
    """
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email', '')
    
    if not username or not password:
        return Response(
            {'detail': 'Username e password são obrigatórios'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(username=username).exists():
        return Response(
            {'detail': 'Username já existe'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if email and User.objects.filter(email=email).exists():
        return Response(
            {'detail': 'Email já existe'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # O Signal no models.py vai criar o UserProfile automaticamente aqui
    user = User.objects.create_user(
        username=username,
        password=password,
        email=email
    )
    
    serializer = UserSerializer(user)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


# ============================================
# PERFIL DO USUÁRIO (NOVO)
# ============================================

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_me(request):
    """
    Rota para pegar (GET) ou atualizar (PUT) os dados do usuário logado (Bio, Avatar, etc).
    ENDPOINT: /api/users/me/
    """
    user = request.user

    # SE FOR LEITURA (Carregar dados no perfil)
    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response(serializer.data)

    # SE FOR ATUALIZAÇÃO (Salvar bio, avatar, email, etc)
    elif request.method == 'PUT':
        # partial=True permite enviar só o que mudou
        serializer = UserSerializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save() # Chama o update() customizado no serializer
            return Response(serializer.data)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================
# CATEGORIAS
# ============================================

class CategoriaViewSet(viewsets.ModelViewSet):
    serializer_class = CategoriaSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Categoria.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(user=self.request.user)


# ============================================
# TRANSAÇÕES (RECEITAS E DESPESAS)
# ============================================

class TransacaoViewSet(viewsets.ModelViewSet):
    serializer_class = TransacaoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Transacao.objects.filter(user=self.request.user)
        
        tipo = self.request.query_params.get('tipo')
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        
        return queryset.order_by('-data')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def estatisticas(self, request):
        user = request.user
        
        stats = Transacao.objects.filter(user=user).values('categoria__nome', 'tipo').annotate(
            total=Sum('valor')
        ).order_by('tipo', 'categoria__nome')
        
        data = {
            'receitas': [],
            'despesas': [],
            'total_receitas': 0,
            'total_despesas': 0,
        }
        
        for item in stats:
            if item['tipo'] == 'receita':
                data['receitas'].append({
                    'categoria': item['categoria__nome'],
                    'total': item['total']
                })
                data['total_receitas'] += item['total']
            elif item['tipo'] == 'despesa':
                data['despesas'].append({
                    'categoria': item['categoria__nome'],
                    'total': item['total']
                })
                data['total_despesas'] += item['total']
                
        return Response(data, status=status.HTTP_200_OK)


# ============================================
# METAS
# ============================================

class MetaViewSet(viewsets.ModelViewSet):
    serializer_class = MetaSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Meta.objects.filter(user=self.request.user).order_by('-criada_em')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(user=self.request.user)