// ============================================
// CONFIGURAÇÕES
// ============================================
const API_BASE_URL = 'http://127.0.0.1:8000/api';
const LOGIN_PAGE_URL = 'index.html';

// UI Elements
const usernameInput = document.getElementById('username-input');
const emailInput = document.getElementById('email-input');
const bioInput = document.getElementById('bio-input');
const memberSinceInput = document.getElementById('member-since-input');
const displayUsername = document.getElementById('displayUsername');
const apiMessage = document.getElementById('profileMessage');
const navProfileImg = document.getElementById('navProfileImg');
const mainAvatar = document.getElementById('mainAvatar');
const trophyGrid = document.getElementById('trophyGrid');

// Stats Elements
const statReceitas = document.getElementById('stat-receitas');
const statDespesas = document.getElementById('stat-despesas');
const statSaldo = document.getElementById('stat-saldo');
const statMetas = document.getElementById('stat-metas');
const statTransacoes = document.getElementById('stat-transacoes');

// Gamification Elements
const gamerTitle = document.getElementById('gamerTitle');
const currentLevel = document.getElementById('currentLevel');
const xpText = document.getElementById('xpText');
const xpBar = document.getElementById('xpBar');
const avatarModal = document.getElementById('avatarModal');
const avatarGrid = document.getElementById('avatarGrid');

const avatarSeeds = ['Felix', 'Aneka', 'Bob', 'Jack', 'Milo', 'Bandit', 'Tinkerbell', 'Gizmo', 'Sheba'];

// ============================================
// DEFINIÇÃO DOS TROFÉUS (CONQUISTAS)
// ============================================
const listaTrofeus = [
    {
        id: 'primeiro_passo',
        titulo: 'Primeiros Passos',
        descricao: 'Realizou a primeira transação.',
        icon: 'bx-walk',
        cor: 'trophy-bronze',
        check: (stats) => stats.totalTransacoes > 0
    },
    {
        id: 'poupador',
        titulo: 'Poupador',
        descricao: 'Tem saldo positivo na conta.',
        icon: 'bx-wallet-alt',
        cor: 'trophy-green',
        check: (stats) => stats.saldo > 0
    },
    {
        id: 'nivel_5',
        titulo: 'Subindo Nível',
        descricao: 'Alcançou o Nível 5.',
        icon: 'bx-up-arrow-circle',
        cor: 'trophy-blue',
        check: (stats) => stats.nivel >= 5
    },
    {
        id: 'focado',
        titulo: 'Focado',
        descricao: 'Criou pelo menos 1 meta.',
        icon: 'bx-target-lock',
        cor: 'trophy-purple',
        check: (stats) => stats.metas > 0
    },
    {
        id: 'magnata',
        titulo: 'Magnata',
        descricao: 'Acumulou mais de R$ 1.000,00.',
        icon: 'bx-diamond',
        cor: 'trophy-gold',
        check: (stats) => stats.saldo >= 1000
    },
    {
        id: 'veterano',
        titulo: 'Veterano',
        descricao: 'Fez mais de 50 transações.',
        icon: 'bx-medal',
        cor: 'trophy-silver',
        check: (stats) => stats.totalTransacoes >= 50
    }
];

// ============================================
// UTILS
// ============================================
function checarAutenticacao() {
    if (!localStorage.getItem('accessToken')) {
        window.location.href = LOGIN_PAGE_URL;
        return false;
    }
    return true;
}

function fazerLogout() {
    localStorage.clear();
    window.location.href = LOGIN_PAGE_URL;
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function exibirMensagem(element, isSuccess, msg) {
    element.style.display = 'block';
    element.textContent = msg;
    element.className = `api-message ${isSuccess ? 'success' : 'error'}`;
    setTimeout(() => { element.style.display = 'none'; }, 3000);
}

function formatarData(dataString) {
    try {
        const date = new Date(dataString);
        return date.toLocaleDateString('pt-BR');
    } catch (e) { return '-'; }
}

// ============================================
// CARREGAR DADOS DO USUÁRIO (BACKEND REAL)
// ============================================
async function carregarInfoUsuario() {
    const token = localStorage.getItem('accessToken');
    
    try {
        // [CORREÇÃO] Chamada ao endpoint real com barra no final
        const response = await fetch(`${API_BASE_URL}/users/me/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const user = await response.json();
            console.log("Usuário carregado:", user); // Debug

            // Preenche inputs com dados REAIS do banco
            usernameInput.value = user.username;
            emailInput.value = user.email;
            bioInput.value = user.bio || ''; 
            memberSinceInput.value = formatarData(user.date_joined || user.created_at);
            
            // Atualiza visual
            displayUsername.textContent = user.username;
            
            // Avatar
            const currentAvatar = user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeeds[0]}`;
            atualizarImagensAvatar(currentAvatar);
            
        } else {
            console.error("Erro ao carregar usuário:", response.status);
            if(response.status === 401) fazerLogout();
        }

    } catch (error) {
        console.error("Erro de conexão:", error);
    }
}

// ============================================
// LÓGICA DE GAMIFICAÇÃO & ESTATÍSTICAS
// ============================================
function calcularNivel(totalTransacoes) {
    const xpPorNivel = 10;
    const nivelAtual = Math.floor(totalTransacoes / xpPorNivel) + 1;
    const xpAtual = totalTransacoes % xpPorNivel;
    const progressoPorcentagem = (xpAtual / xpPorNivel) * 100;

    let titulo = "Iniciante";
    if (nivelAtual >= 5) titulo = "Poupador Júnior";
    if (nivelAtual >= 10) titulo = "Analista Financeiro";
    if (nivelAtual >= 20) titulo = "Mestre das Finanças";

    return { nivel: nivelAtual, xp: xpAtual, maxXp: xpPorNivel, porcentagem: progressoPorcentagem, titulo: titulo };
}

function atualizarGamificacao(totalTransacoes) {
    const dados = calcularNivel(totalTransacoes);
    gamerTitle.textContent = dados.titulo;
    currentLevel.textContent = `Nvl ${dados.nivel}`;
    xpText.textContent = `${dados.xp} / ${dados.maxXp} XP`;
    xpBar.style.width = `${dados.porcentagem}%`;
    return dados.nivel;
}

async function carregarEstatisticas() {
    const token = localStorage.getItem('accessToken');
    try {
        const response = await fetch(`${API_BASE_URL}/transacoes/estatisticas/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        let saldo = 0;
        let totalTransacoes = 0;
        let qtdMetas = 0;

        if (response.ok) {
            const dados = await response.json();
            const receitas = dados.total_receitas || 0;
            const despesas = dados.total_despesas || 0;
            saldo = receitas - despesas;
            
            statReceitas.textContent = formatarMoeda(receitas);
            statDespesas.textContent = formatarMoeda(despesas);
            statSaldo.textContent = formatarMoeda(saldo);
            statSaldo.style.color = saldo >= 0 ? 'var(--green-icon)' : 'var(--red)';
        }
        
        const resLista = await fetch(`${API_BASE_URL}/transacoes/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if(resLista.ok) {
            const lista = await resLista.json();
            const itens = Array.isArray(lista) ? lista : (lista.results || []);
            totalTransacoes = itens.length;
            statTransacoes.textContent = totalTransacoes;
        }

        const resMetas = await fetch(`${API_BASE_URL}/metas/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resMetas.ok) {
            const metas = await resMetas.json();
            qtdMetas = Array.isArray(metas) ? metas.length : (metas.results?.length || 0);
            statMetas.textContent = qtdMetas;
        }

        const nivelAtual = atualizarGamificacao(totalTransacoes);
        renderizarTrofeus({
            saldo: saldo,
            totalTransacoes: totalTransacoes,
            nivel: nivelAtual,
            metas: qtdMetas
        });

    } catch (error) {
        console.error('Erro stats:', error);
    }
}

// ============================================
// RENDERIZAR TROFÉUS
// ============================================
function renderizarTrofeus(stats) {
    trophyGrid.innerHTML = '';
    listaTrofeus.forEach(trofeu => {
        const desbloqueado = trofeu.check(stats);
        const div = document.createElement('div');
        div.className = `trophy-item ${desbloqueado ? 'unlocked' : 'locked'}`;
        div.innerHTML = `
            <i class='bx ${trofeu.icon} trophy-icon ${desbloqueado ? trofeu.cor : ''}'></i>
            <p>${trofeu.titulo}</p>
            <span class="tooltip">${trofeu.descricao}</span>
        `;
        trophyGrid.appendChild(div);
    });
}

// ============================================
// AVATAR & MODAL (SALVAR NO BACKEND)
// ============================================
function abrirModalAvatar() {
    avatarGrid.innerHTML = '';
    avatarSeeds.forEach(seed => {
        const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
        const img = document.createElement('img');
        img.src = url;
        img.className = 'avatar-option';
        img.onclick = () => selecionarAvatar(url);
        avatarGrid.appendChild(img);
    });
    avatarModal.style.display = 'flex';
}

function fecharModalAvatar() {
    avatarModal.style.display = 'none';
}

async function selecionarAvatar(url) {
    const token = localStorage.getItem('accessToken');
    
    // Atualiza visualmente na hora
    atualizarImagensAvatar(url);
    fecharModalAvatar();

    try {
        // [CORREÇÃO] Envia para o backend salvar
        await fetch(`${API_BASE_URL}/users/me/`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ avatar: url })
        });
    } catch (error) {
        console.error("Erro ao salvar avatar no banco", error);
    }
}

function atualizarImagensAvatar(url) {
    if(mainAvatar) mainAvatar.src = url;
    if(navProfileImg) navProfileImg.src = url;
}

window.onclick = function(event) {
    if (event.target == avatarModal) fecharModalAvatar();
}

// ============================================
// SALVAR PERFIL (Bio, User, Email) - BACKEND REAL
// ============================================
document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');

    const payload = {
        username: usernameInput.value,
        email: emailInput.value,
        bio: bioInput.value,
    };

    console.log("Enviando atualização:", payload);

    try {
        // [CORREÇÃO] Envia PUT para o backend
        const response = await fetch(`${API_BASE_URL}/users/me/`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const userAtualizado = await response.json();
            
            // Atualiza UI
            displayUsername.textContent = userAtualizado.username;
            
            // Atualiza localStorage (opcional, para consistência rápida)
            localStorage.setItem('username', userAtualizado.username);
            
            exibirMensagem(apiMessage, true, 'Perfil salvo no banco de dados!');
        } else {
            const err = await response.json();
            console.error("Erro no backend:", err);
            exibirMensagem(apiMessage, false, err.detail || 'Erro ao salvar.');
        }
    } catch (error) {
        console.error(error);
        exibirMensagem(apiMessage, false, 'Erro de conexão.');
    }
});

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    if (!checarAutenticacao()) return;

    carregarInfoUsuario();
    carregarEstatisticas();

    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        fazerLogout();
    });

    document.getElementById('menu-toggler')?.addEventListener('click', () => {
        document.body.classList.toggle('sidebar-hide');
    });
});