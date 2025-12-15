from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Categoria, Transacao, Meta

# ============================================
# USER SERIALIZER (ATUALIZADO)
# ============================================

class UserSerializer(serializers.ModelSerializer):
    # Campos que vêm da tabela Profile (bio e avatar)
    # source='profile.bio' diz ao Django: "Busque o campo bio dentro da relação profile"
    bio = serializers.CharField(source='profile.bio', required=False, allow_blank=True)
    avatar = serializers.CharField(source='profile.avatar', required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined', 'bio', 'avatar']
        read_only_fields = ['id', 'date_joined']

    def update(self, instance, validated_data):
        """
        Sobrescreve o método de atualização padrão para salvar dados 
        tanto na tabela User quanto na tabela UserProfile.
        """
        # 1. Retira os dados do perfil do dicionário (se existirem)
        # O DRF agrupa os campos com source='profile.x' dentro de um dict 'profile'
        profile_data = validated_data.pop('profile', {})

        # 2. Atualiza os campos do Usuário padrão (username, email, etc)
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.save()

        # 3. Atualiza os campos do Perfil (bio, avatar)
        # O profile é criado automaticamente pelos Signals no models.py, então ele sempre existe.
        profile = instance.profile
        
        if 'bio' in profile_data:
            profile.bio = profile_data['bio']
        
        if 'avatar' in profile_data:
            profile.avatar = profile_data['avatar']
            
        profile.save()

        return instance

# ============================================
# CATEGORIA SERIALIZER
# ============================================

class CategoriaSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = Categoria
        fields = ['id', 'nome', 'tipo', 'icone', 'cor', 'descricao', 'user', 'criada_em']
        read_only_fields = ['id', 'user', 'criada_em']

# ============================================
# TRANSACAO SERIALIZER
# ============================================

class TransacaoSerializer(serializers.ModelSerializer):
    categoria_nome = serializers.SerializerMethodField(read_only=True)
    user = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = Transacao
        fields = [
            'id', 'descricao', 'valor', 'tipo', 'categoria', 
            'categoria_nome', 'data', 'observacao', 'user', 'criada_em'
        ]
        read_only_fields = ['id', 'user', 'criada_em']
    
    def get_categoria_nome(self, obj):
        if obj.categoria:
            return obj.categoria.nome
        return None

# ============================================
# META SERIALIZER
# ============================================

class MetaSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = Meta
        fields = [
            'id', 'nome', 'tipo', 'valor_alvo', 'valor_atual', 
            'data_limite', 'descricao', 'user', 'criada_em'
        ]
        read_only_fields = ['id', 'user', 'criada_em']