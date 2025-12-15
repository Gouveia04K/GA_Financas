// ============================================
// CONFIGURAÇÕES
// ============================================
const API_BASE_URL = 'http://127.0.0.1:8000/api';
const LOGIN_PAGE_URL = 'index.html';

// Elementos de UI
const formTitle = document.getElementById('formTitle');
const submitButton = document.getElementById('submitButton');
const submitButtonText = document.getElementById('submitButtonText');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const metaIdInput = document.getElementById('meta-id');

// ============================================
// AUTENTICAÇÃO E UTILS
// ============================================
function checarAutenticacao() {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
        window.location.href = LOGIN_PAGE_URL;
        return false;
    }
    return true;
}

function fazerLogout() {
    localStorage.clear();
    window.location.href = LOGIN_PAGE_URL;
}

function displayMessage(element, isSuccess, msg) {
    element.style.display = 'block';
    element.className = isSuccess ? 'api-message success' : 'api-message error';
    element.textContent = msg;
    setTimeout(() => { element.style.display = 'none'; }, 5000);
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function formatarData(dataString) {
    if (!dataString) return '-';
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
}

// ============================================
// RESET E CANCELAR
// ============================================
function resetFormulario() {
    document.getElementById('metaForm').reset();
    metaIdInput.value = '';
    
    // Reseta visual
    formTitle.textContent = 'Criar Nova Meta';
    submitButtonText.textContent = 'Criar Meta';
    submitButton.querySelector('i').className = 'bx bx-plus';
    cancelEditBtn.style.display = 'none';
    
    // Rola suavemente para a lista se quiser, ou mantém topo
}

// ============================================
// CARREGAR PARA EDIÇÃO
// ============================================
async function carregarParaEdicao(id) {
    const token = localStorage.getItem('accessToken');
    
    try {
        const response = await fetch(`${API_BASE_URL}/metas/${id}/`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Erro ao buscar dados da meta.');

        const meta = await response.json();
        
        // Preencher formulário
        metaIdInput.value = meta.id;
        document.getElementById('meta-nome').value = meta.nome;
        document.getElementById('meta-tipo').value = meta.tipo;
        document.getElementById('meta-valor-alvo').value = meta.valor_alvo;
        document.getElementById('meta-data-limite').value = meta.data_limite;
        document.getElementById('meta-descricao').value = meta.descricao || '';

        // Mudar estado visual
        formTitle.textContent = 'Editar Meta';
        submitButtonText.textContent = 'Salvar Edição';
        submitButton.querySelector('i').className = 'bx bxs-save';
        cancelEditBtn.style.display = 'inline-block'; // Exibe botão cancelar

        // Rola para o topo
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
        console.error(error);
        alert('Não foi possível carregar a meta para edição.');
    }
}

// ============================================
// SALVAR META (CRIAR OU EDITAR)
// ============================================
async function salvarMeta(event) {
    event.preventDefault();
    
    const token = localStorage.getItem('accessToken');
    const messageElement = document.getElementById('metaMessage');
    
    // Verifica se é edição
    const isEditing = !!metaIdInput.value;
    const metaId = metaIdInput.value;

    const metaData = {
        nome: document.getElementById('meta-nome').value,
        tipo: document.getElementById('meta-tipo').value,
        valor_alvo: parseFloat(document.getElementById('meta-valor-alvo').value),
        data_limite: document.getElementById('meta-data-limite').value,
        descricao: document.getElementById('meta-descricao').value
    };

    // Se estiver criando, inicia com 0. Se estiver editando (PATCH), não manda valor_atual para não zerar.
    if (!isEditing) {
        metaData.valor_atual = 0;
    }

    const method = isEditing ? 'PATCH' : 'POST'; // PATCH atualiza parcial (preserva valor_atual)
    const url = isEditing ? `${API_BASE_URL}/metas/${metaId}/` : `${API_BASE_URL}/metas/`;

    displayMessage(messageElement, false, 'Salvando...');

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(metaData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(JSON.stringify(errorData));
        }

        displayMessage(messageElement, true, isEditing ? 'Meta atualizada!' : 'Meta criada!');
        resetFormulario();
        carregarMetas(); 

    } catch (error) {
        console.error(error);
        displayMessage(messageElement, false, 'Erro ao salvar. Verifique os dados.');
    }
}

// ============================================
// CARREGAR LISTA DE METAS (COM DESCRIÇÃO)
// ============================================
async function carregarMetas() {
    const token = localStorage.getItem('accessToken');
    const grid = document.getElementById('metasGrid');
    
    grid.innerHTML = '<div class="meta-item-placeholder"><p>Carregando...</p></div>';

    try {
        const response = await fetch(`${API_BASE_URL}/metas/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Erro ao buscar metas');

        const dados = await response.json();
        
        let listaMetas = [];
        if (Array.isArray(dados)) {
            listaMetas = dados;
        } else if (dados.results) {
            listaMetas = dados.results;
        }

        grid.innerHTML = '';

        if (listaMetas.length === 0) {
            grid.innerHTML = '<div class="meta-item-placeholder"><p>Nenhuma meta encontrada.</p></div>';
            return;
        }

        listaMetas.forEach(meta => {
            const percentual = meta.valor_alvo > 0 ? (meta.valor_atual / meta.valor_alvo) * 100 : 0;
            const percentualFormatado = Math.min(percentual, 100).toFixed(1);
            const descricaoHtml = meta.descricao ? `<p class="meta-descricao">${meta.descricao}</p>` : '';

            // Importante: Adicionei a classe "meta-item" para a busca funcionar
            const card = `
                <div class="meta-item">
                    <div class="meta-header">
                        <h3>${meta.nome}</h3>
                        <span class="meta-tag">${meta.tipo}</span>
                    </div>
                    
                    <div class="meta-body">
                        <div class="meta-valores">
                            <span class="valor-atual">${formatarMoeda(meta.valor_atual)}</span>
                            <span class="valor-alvo">de ${formatarMoeda(meta.valor_alvo)}</span>
                        </div>
                        
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${percentualFormatado}%"></div>
                        </div>
                        <p class="meta-percentual">${percentualFormatado}% concluído</p>
                        
                        ${descricaoHtml}
                        
                        <p class="meta-data"><i class='bx bx-calendar'></i> Alvo: ${formatarData(meta.data_limite)}</p>
                    </div>

                    <div class="meta-actions">
                        <button class="btn-edit" onclick="carregarParaEdicao(${meta.id})">
                            <i class='bx bx-edit'></i> Editar
                        </button>
                        <button class="btn-delete" onclick="deletarMeta(${meta.id})">
                            <i class='bx bx-trash'></i> Excluir
                        </button>
                    </div>
                </div>
            `;
            grid.insertAdjacentHTML('beforeend', card);
        });

    } catch (error) {
        console.error(error);
        grid.innerHTML = '<div class="meta-item-placeholder"><p>Erro ao carregar metas.</p></div>';
    }
}

// ============================================
// LÓGICA DE PESQUISA EM TEMPO REAL
// ============================================

document.getElementById('searchMeta')?.addEventListener('keyup', (e) => {
    const termo = e.target.value.toLowerCase();
    
    // Seleciona todos os cards de meta
    const cards = document.querySelectorAll('.meta-item'); 

    cards.forEach(card => {
        // Pega todo o texto do card (Nome, Tipo, Descrição)
        const texto = card.innerText.toLowerCase();
        
        if(texto.includes(termo)) {
            card.style.display = ''; // Mostra
        } else {
            card.style.display = 'none'; // Oculta
        }
    });
});

// ============================================
// DELETAR META
// ============================================
async function deletarMeta(id) {
    if (!confirm('Deseja realmente excluir esta meta?')) return;

    const token = localStorage.getItem('accessToken');
    
    try {
        const response = await fetch(`${API_BASE_URL}/metas/${id}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            carregarMetas();
        } else {
            alert('Erro ao excluir meta');
        }
    } catch (error) {
        console.error(error);
    }
}

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    if (!checarAutenticacao()) return;
    
    carregarMetas();
    
    const metaForm = document.getElementById('metaForm');
    if (metaForm) {
        metaForm.addEventListener('submit', salvarMeta);
    }
    
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', resetFormulario);
    }
    
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        fazerLogout();
    });

    document.getElementById('menu-toggler')?.addEventListener('click', () => {
        document.body.classList.toggle('sidebar-hide');
    });
});