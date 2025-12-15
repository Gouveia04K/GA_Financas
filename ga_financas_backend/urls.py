from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
# ADICIONEI ESTA IMPORTAÇÃO PARA SERVIR ARQUIVOS HTML
from django.views.generic import TemplateView
from contas.views import (
    login_view,
    register_view,
    user_me,
    CategoriaViewSet,
    TransacaoViewSet,
    MetaViewSet
)

# ============================================
# REGISTRAR VIEWSETS
# ============================================

router = DefaultRouter()
router.register(r'categorias', CategoriaViewSet, basename='categoria')
router.register(r'transacoes', TransacaoViewSet, basename='transacao')
router.register(r'metas', MetaViewSet, basename='meta')

# ============================================
# URLS
# ============================================

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API - Endpoints de autenticação
    path('api/login/', login_view, name='login'),
    path('api/register/', register_view, name='register'),

    # API - PERFIL
    path('api/users/me/', user_me, name='user_me'),
    
    # API - ViewSets (categorias, transações, metas)
    path('api/', include(router.urls)),
    
    # JWT Token (alternativa)
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # ============================================
    # NOVAS ROTAS DO FRONTEND (HTML)
    # ============================================
    
    # Rota Raiz (Página Inicial -> Login/Cadastro)
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    
    # Mapeamento de todas as outras páginas
    path('dashboard.html', TemplateView.as_view(template_name='dashboard.html'), name='dashboard'),
    path('index.html', TemplateView.as_view(template_name='index.html'), name='login'),
    path('receitas.html', TemplateView.as_view(template_name='receitas.html'), name='receitas'),
    path('despesas.html', TemplateView.as_view(template_name='despesas.html'), name='despesas'),
    path('metas.html', TemplateView.as_view(template_name='metas.html'), name='metas'),
    path('categorias.html', TemplateView.as_view(template_name='categorias.html'), name='categorias'),
    path('meus-dados.html', TemplateView.as_view(template_name='meus-dados.html'), name='meus-dados'),
    path('profile.html', TemplateView.as_view(template_name='profile.html'), name='profile'),
]