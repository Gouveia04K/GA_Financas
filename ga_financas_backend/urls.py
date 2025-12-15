from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from contas.views import (
    login_view,
    register_view,
    user_me,  # <--- 1. ADICIONEI ESTA IMPORTAÇÃO
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

    # API - PERFIL (ESSA ERA A LINHA QUE FALTAVA!)
    path('api/users/me/', user_me, name='user_me'),
    
    # API - ViewSets (categorias, transações, metas)
    path('api/', include(router.urls)),
    
    # JWT Token (alternativa)
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]