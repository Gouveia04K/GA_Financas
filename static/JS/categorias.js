// ============================================
// CONFIGURAÇÕES E CONSTANTES
// ============================================

const API_BASE_URL = 'http://127.0.0.1:8000/api';
const LOGIN_PAGE_URL = 'index.html'; 

// IDs dos elementos de UI
const formTitle = document.getElementById('formTitle');
const submitButton = document.getElementById('submitButton');
const submitButtonText = document.getElementById('submitButtonText');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const categoriaIdInput = document.getElementById('categoria-id');
const iconeBtns = document.querySelectorAll('.icone-btn');

// ============================================
// FUNÇÃO DE PROTEÇÃO DE ROTA E LOGOUT
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
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userId'); 
    window.location.href = LOGIN_PAGE_URL;
}

// ============================================
// FUNÇÃO AUXILIAR PARA EXIBIR MENSAGENS
// ============================================

function displayMessage(element, isSuccess, msg) {
    element.style.display = 'block';
    element.className = 'api-message';
    element.textContent = '';

    if (isSuccess) {
        element.classList.add('success');
    } else {
        element.classList.add('error');
    }
    
    element.textContent = msg;
}

// ============================================
// GESTÃO DE FORMULÁRIO (ÍCONES E RESET)
// ============================================

function setupIconeSelection() {
    const iconeInput = document.getElementById('categoria-icone');

    iconeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            iconeBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            iconeInput.value = btn.dataset.icone;
        });
    });
}

function resetFormulario() {
    document.getElementById('categoriaForm').reset();
    categoriaIdInput.value = '';
    
    // Reseta o estado visual para "Adicionar"
    formTitle.textContent = 'Adicionar Categoria';
    submitButtonText.textContent = 'Adicionar Categoria';
    submitButton.querySelector('i').className = 'bx bx-plus';
    cancelEditBtn.style.display = 'none';

    // Remove seleção de ícones
    iconeBtns.forEach(btn => btn.classList.remove('selected'));
    document.getElementById('categoria-icone').value = '';
    
    // Oculta mensagens
    document.getElementById('categoriaMessage').style.display = 'none';
}


// ============================================
// EDIÇÃO (LOAD E SALVAMENTO)
// ============================================

async function carregarParaEdicao(id) {
    const token = localStorage.getItem('accessToken');
    
    try {
        const response = await fetch(`${API_BASE_URL}/categorias/${id}/`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Erro ao buscar dados da categoria para edição.');
        }

        const categoria = await response.json();
        
        // 1. Preenche o ID oculto e campos
        categoriaIdInput.value = categoria.id;
        document.getElementById('categoria-nome').value = categoria.nome;
        document.getElementById('categoria-tipo').value = categoria.tipo;
        document.getElementById('categoria-cor').value = `#${categoria.cor}`; 
        document.getElementById('categoria-descricao').value = categoria.descricao || '';
        
        // 2. Preenche o Ícone
        iconeBtns.forEach(btn => btn.classList.remove('selected'));
        const selectedIconeBtn = document.querySelector(`.icone-btn[data-icone="${categoria.icone}"]`);
        if (selectedIconeBtn) {
            selectedIconeBtn.classList.add('selected');
            document.getElementById('categoria-icone').value = categoria.icone;
        }
        
        // 3. Muda o estado visual para Edição
        formTitle.textContent = 'Editar Categoria';
        submitButtonText.textContent = 'Salvar Edição';
        submitButton.querySelector('i').className = 'bx bxs-save';
        cancelEditBtn.style.display = 'inline-block';

        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
        alert(error.message);
    }
}

async function salvarCategoria(event) {
    event.preventDefault();

    const token = localStorage.getItem('accessToken');
    const messageElement = document.getElementById('categoriaMessage');
    
    const isEditing = !!categoriaIdInput.value; 
    const categoriaId = categoriaIdInput.value;

    const nome = document.getElementById('categoria-nome').value;
    const tipo = document.getElementById('categoria-tipo').value;
    const icone = document.getElementById('categoria-icone').value;
    let cor = document.getElementById('categoria-cor').value;
    const descricao = document.getElementById('categoria-descricao').value;
    
    if (cor.startsWith('#')) {
        cor = cor.substring(1);
    }
    
    if (!icone || !tipo || !nome) {
        displayMessage(messageElement, false, 'Preencha o nome, tipo e selecione um ícone.');
        return;
    }

    const categoriaData = { nome, tipo, icone, cor, descricao };
    
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `${API_BASE_URL}/categorias/${categoriaId}/` : `${API_BASE_URL}/categorias/`;
    
    displayMessage(messageElement, false, isEditing ? 'Salvando edição...' : 'Adicionando categoria...');
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(categoriaData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            let errorMessage = errorData.detail || 'Erro ao salvar categoria.';
            if (errorData && typeof errorData === 'object') {
                 errorMessage = Object.keys(errorData).map(key => `${key}: ${errorData[key]}`).join('; ');
            }
            throw new Error(errorMessage);
        }

        displayMessage(messageElement, true, isEditing ? 'Categoria atualizada com sucesso!' : 'Categoria adicionada com sucesso!');
        resetFormulario();
        carregarCategorias();
    } catch (error) {
        displayMessage(messageElement, false, `Erro: ${error.message}`);
    }
}


// ============================================
// CARREGAR CATEGORIAS
// ============================================

async function carregarCategorias() {
    const token = localStorage.getItem('accessToken');
    const grid = document.getElementById('categoriasGrid');
    
    grid.innerHTML = '<div class="categoria-item-placeholder"><p>Carregando categorias...</p></div>';

    try {
        const response = await fetch(`${API_BASE_URL}/categorias/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
             if (response.status === 401 || response.status === 403) {
                checarAutenticacao();
                return;
             }
            throw new Error(`Erro na API: ${response.status}`);
        }

        const dados = await response.json();
        
        let listaCategorias = [];
        if (Array.isArray(dados)) {
            listaCategorias = dados;
        } else if (dados.results && Array.isArray(dados.results)) {
            listaCategorias = dados.results;
        }

        grid.innerHTML = '';

        if (listaCategorias.length === 0) {
            grid.innerHTML = '<div class="categoria-item-placeholder"><p>Nenhuma categoria encontrada.</p></div>';
            return;
        }

        listaCategorias.forEach(cat => {
            const corDisplay = cat.cor && cat.cor.startsWith('#') ? cat.cor : `#${cat.cor}`;
            
            // Adicionado 'categoria-item' aqui para a busca funcionar
            const card = `
                <div class="categoria-item" style="border-left: 4px solid ${corDisplay};">
                    <div class="categoria-header">
                        <i class='bx ${cat.icone}' style="color: ${corDisplay};"></i>
                        <div class="categoria-info">
                            <h3>${cat.nome}</h3>
                            <span class="categoria-tipo ${cat.tipo}">${cat.tipo}</span>
                        </div>
                    </div>
                    
                    <p class="categoria-descricao">${cat.descricao || 'Sem descrição'}</p>
                    
                    <div class="categoria-actions">
                        <button class="btn-edit" onclick="carregarParaEdicao(${cat.id})">
                            <i class='bx bx-edit'></i> Editar
                        </button>
                        <button class="btn-delete" onclick="deletarCategoria(${cat.id})">
                            <i class='bx bx-trash'></i> Deletar
                        </button>
                    </div>
                </div>
            `;
            grid.insertAdjacentHTML('beforeend', card);
        });
    } catch (error) {
        console.error('Erro detalhado ao carregar categorias:', error);
        grid.innerHTML = `<div class="categoria-item-placeholder"><p>Erro: ${error.message}</p></div>`;
    }
}

// ============================================
// LÓGICA DE PESQUISA EM TEMPO REAL
// ============================================

document.getElementById('searchCategoria')?.addEventListener('keyup', (e) => {
    const termo = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.categoria-item'); 

    cards.forEach(card => {
        // Busca tanto no Nome (h3) quanto na Descrição (p)
        const texto = card.innerText.toLowerCase();
        
        if(texto.includes(termo)) {
            card.style.display = ''; // Mostra
        } else {
            card.style.display = 'none'; // Oculta
        }
    });
});

// ============================================
// DELETAR CATEGORIA
// ============================================

async function deletarCategoria(id) {
    if (!confirm('Tem certeza que deseja deletar esta categoria? Todas as transações relacionadas serão afetadas.')) {
        return;
    }

    const token = localStorage.getItem('accessToken');

    try {
        const response = await fetch(`${API_BASE_URL}/categorias/${id}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao deletar categoria');
        }
        
        carregarCategorias();
    } catch (error) {
        console.error('Erro ao deletar:', error);
        alert('Erro ao deletar categoria');
    }
}

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    if (!checarAutenticacao()) return;

    setupIconeSelection();
    carregarCategorias();

    const categoriaForm = document.getElementById('categoriaForm');
    if (categoriaForm) {
        categoriaForm.addEventListener('submit', salvarCategoria);
    }
    
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', resetFormulario);
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            fazerLogout();
        });
    }

    const menuToggler = document.getElementById('menu-toggler');
    if (menuToggler) {
        menuToggler.addEventListener('click', () => {
            document.body.classList.toggle('sidebar-hide');
        });
    }
});