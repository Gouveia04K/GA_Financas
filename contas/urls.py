from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Configuração automática das rotas para as tabelas (Categorias, Transações, Metas)
router = DefaultRouter()
router.register(r'categorias', views.CategoriaViewSet, basename='categoria')
router.register(r'transacoes', views.TransacaoViewSet, basename='transacao')
router.register(r'metas', views.MetaViewSet, basename='meta')

urlpatterns = [
    # Rotas de Autenticação (Apontando para as funções do seu views.py)
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),

    # === A ROTA DO PERFIL (ESSENCIAL PARA SALVAR) ===
    # O JavaScript chama /api/users/me/, então aqui definimos users/me/
    path('users/me/', views.user_me, name='user_me'),

    # Inclui todas as rotas automáticas do router
    path('', include(router.urls)),
]