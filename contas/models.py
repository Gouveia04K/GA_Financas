from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from datetime import date, timedelta # Importação nova para calcular datas

# ============================================
# 1. PERFIL DE USUÁRIO
# ============================================

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True, null=True)
    avatar = models.CharField(max_length=500, blank=True, null=True)
    
    def __str__(self):
        return f"Perfil de {self.user.username}"

# ============================================
# 2. CATEGORIA
# ============================================

class Categoria(models.Model):
    TIPO_CHOICES = [
        ('receita', 'Receita'),
        ('despesa', 'Despesa'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='categorias')
    nome = models.CharField(max_length=100)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    icone = models.CharField(max_length=50, default='bx-folder')
    cor = models.CharField(max_length=7, default='#3c91e6')
    descricao = models.TextField(blank=True, null=True)
    criada_em = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-criada_em']
        unique_together = ('user', 'nome')
    
    def __str__(self):
        return f"{self.nome} ({self.tipo})"

# ============================================
# 3. TRANSACAO
# ============================================

class Transacao(models.Model):
    TIPO_CHOICES = [
        ('receita', 'Receita'),
        ('despesa', 'Despesa'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transacoes')
    descricao = models.CharField(max_length=200)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    categoria = models.ForeignKey(Categoria, on_delete=models.SET_NULL, null=True, blank=True)
    data = models.DateField()
    observacao = models.TextField(blank=True, null=True)
    criada_em = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-data', '-criada_em']
    
    def __str__(self):
        return f"{self.descricao} - {self.valor} ({self.tipo})"

# ============================================
# 4. META
# ============================================

class Meta(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='metas')
    nome = models.CharField(max_length=100)
    tipo = models.CharField(max_length=50)
    valor_alvo = models.DecimalField(max_digits=10, decimal_places=2)
    valor_atual = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    data_limite = models.DateField()
    descricao = models.TextField(blank=True, null=True)
    criada_em = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-criada_em']
    
    def __str__(self):
        return f"{self.nome} - {self.tipo}"
    
    @property
    def percentual(self):
        if self.valor_alvo == 0:
            return 0
        return (self.valor_atual / self.valor_alvo) * 100

# ============================================
# 5. SIGNALS (AUTOMAÇÃO AO CRIAR USUÁRIO)
# ============================================

@receiver(post_save, sender=User)
def create_user_data(sender, instance, created, **kwargs):
    """
    Quando um usuário é criado, cria automaticamente:
    1. O Perfil
    2. As Categorias Padrão
    3. As Metas Padrão
    """
    if created:
        # 1. Cria o Perfil
        UserProfile.objects.create(user=instance)

        # 2. Cria Categorias Padrão
        categorias_padrao = [
            # RECEITAS
            {'nome': 'Salário', 'tipo': 'receita', 'icone': 'bx-money', 'cor': '#28a745'},
            {'nome': 'Investimentos', 'tipo': 'receita', 'icone': 'bx-line-chart', 'cor': '#17a2b8'},
            {'nome': 'Freelance', 'tipo': 'receita', 'icone': 'bx-laptop', 'cor': '#ffc107'},
            # DESPESAS
            {'nome': 'Alimentação', 'tipo': 'despesa', 'icone': 'bx-restaurant', 'cor': '#dc3545'},
            {'nome': 'Moradia', 'tipo': 'despesa', 'icone': 'bx-home', 'cor': '#fd7e14'},
            {'nome': 'Transporte', 'tipo': 'despesa', 'icone': 'bx-car', 'cor': '#6c757d'},
            {'nome': 'Lazer', 'tipo': 'despesa', 'icone': 'bx-joystick', 'cor': '#6f42c1'},
            {'nome': 'Saúde', 'tipo': 'despesa', 'icone': 'bx-pulse', 'cor': '#e83e8c'},
            {'nome': 'Educação', 'tipo': 'despesa', 'icone': 'bx-book', 'cor': '#20c997'},
        ]

        for cat in categorias_padrao:
            Categoria.objects.create(
                user=instance, 
                nome=cat['nome'], 
                tipo=cat['tipo'], 
                icone=cat['icone'], 
                cor=cat['cor']
            )

        # 3. Cria Metas Padrão (NOVO)
        hoje = date.today()
        metas_padrao = [
            {
                'nome': 'Reserva de Emergência',
                'tipo': 'Economia',
                'valor_alvo': 5000.00,
                'data_limite': hoje + timedelta(days=365), # Daqui a 1 ano
                'descricao': 'Guardar dinheiro para imprevistos.'
            },
            {
                'nome': 'Viagem de Férias',
                'tipo': 'Lazer',
                'valor_alvo': 3000.00,
                'data_limite': hoje + timedelta(days=180), # Daqui a 6 meses
                'descricao': 'Juntar dinheiro para a viagem de fim de ano.'
            },
            {
                'nome': 'Trocar de Celular',
                'tipo': 'Bens Materiais',
                'valor_alvo': 2500.00,
                'data_limite': hoje + timedelta(days=90), # Daqui a 3 meses
                'descricao': 'Economia para o novo modelo.'
            }
        ]

        for m in metas_padrao:
            Meta.objects.create(
                user=instance,
                nome=m['nome'],
                tipo=m['tipo'],
                valor_alvo=m['valor_alvo'],
                data_limite=m['data_limite'],
                descricao=m['descricao']
            )

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()