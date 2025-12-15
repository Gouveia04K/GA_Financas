// ============================================
// CONFIGURAÇÕES GERAIS
// ============================================
const API_BASE_URL = 'http://127.0.0.1:8000/api';
const LOGIN_PAGE_URL = 'index.html';
const TIPO_TRANSACAO = 'receita'; // Define o tipo desta página

// Elementos de UI
const formTitle = document.getElementById('formTitle');
const submitButton = document.getElementById('submitButton');
const submitButtonText = document.getElementById('submitButtonText');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const receitaIdInput = document.getElementById('receita-id');
const apiMessage = document.getElementById('apiMessage');

// Elementos dos Cards de Totais
const totalReceitasElem = document.getElementById('totalReceitas');
const totalDespesasElem = document.getElementById('totalDespesas');

// ============================================
// AUTENTICAÇÃO E UTILS
// ============================================
function checarAutenticacao() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
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

function formatarData(dataString) {
    if (!dataString) return '-';
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
}

function showMessage(msg, isSuccess) {
    apiMessage.style.display = 'block';
    apiMessage.textContent = msg;
    apiMessage.className = `api-message ${isSuccess ? 'success' : 'error'}`;
    setTimeout(() => { apiMessage.style.display = 'none'; }, 5000);
}

// ============================================
// CARREGAR ESTATÍSTICAS (CARDS)
// ============================================
async function carregarEstatisticas() {
    const token = localStorage.getItem('accessToken');
    try {
        const response = await fetch(`${API_BASE_URL}/transacoes/estatisticas/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const dados = await response.json();
            if (totalReceitasElem) totalReceitasElem.textContent = formatarMoeda(dados.total_receitas || 0);
            if (totalDespesasElem) totalDespesasElem.textContent = formatarMoeda(dados.total_despesas || 0);
        }
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// ============================================
// CARREGAR CATEGORIAS (SELECT)
// ============================================
async function carregarCategorias() {
    const select = document.getElementById('receita-categoria');
    const token = localStorage.getItem('accessToken');

    try {
        const response = await fetch(`${API_BASE_URL}/categorias/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const dados = await response.json();
        let lista = Array.isArray(dados) ? dados : (dados.results || []);

        // Filtra apenas categorias de RECEITA
        lista = lista.filter(cat => cat.tipo === TIPO_TRANSACAO);

        select.innerHTML = '<option value="">Selecione uma categoria</option>';
        
        if (lista.length === 0) {
            select.innerHTML = '<option value="">Nenhuma categoria encontrada</option>';
            return;
        }

        lista.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.nome;
            select.appendChild(option);
        });

    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        select.innerHTML = '<option value="">Erro ao carregar</option>';
    }
}

// ============================================
// CARREGAR LISTA DE RECEITAS
// ============================================
async function carregarReceitas() {
    const tbody = document.getElementById('receitasTableBody');
    const token = localStorage.getItem('accessToken');

    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Carregando...</td></tr>';

    try {
        const response = await fetch(`${API_BASE_URL}/transacoes/?tipo=${TIPO_TRANSACAO}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Erro ao buscar dados');

        const dados = await response.json();
        let lista = Array.isArray(dados) ? dados : (dados.results || []);

        tbody.innerHTML = '';

        if (lista.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma receita registrada.</td></tr>';
            return;
        }

        lista.forEach(item => {
            const tr = document.createElement('tr');
            
            // Lógica para mostrar observação se existir
            const obsHtml = item.observacao ? `<br><small style="color:#888; font-style:italic;">${item.observacao}</small>` : '';

            tr.innerHTML = `
                <td>${formatarData(item.data)}</td>
                <td>
                    <strong>${item.descricao}</strong>
                    ${obsHtml}
                </td>
                <td><span class="badge">${item.categoria_nome || '-'}</span></td>
                <td class="valor-positivo">${formatarMoeda(item.valor)}</td>
                <td style="display: flex; gap: 10px;">
                    <button class="btn-primary" style="padding: 5px 10px; font-size: 12px;" onclick="editarReceita(${item.id})">
                        <i class='bx bx-edit'></i>
                    </button>
                    <button class="btn-delete" style="padding: 5px 10px;" onclick="deletarReceita(${item.id})">
                        <i class='bx bx-trash'></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Erro ao carregar receitas.</td></tr>';
    }
}

// ============================================
// SALVAR RECEITA (CRIAR OU EDITAR)
// ============================================
async function salvarReceita(event) {
    event.preventDefault();
    const token = localStorage.getItem('accessToken');
    
    const id = receitaIdInput.value;
    const isEditing = !!id;

    const payload = {
        descricao: document.getElementById('receita-descricao').value,
        valor: parseFloat(document.getElementById('receita-valor').value),
        data: document.getElementById('receita-data').value,
        categoria: document.getElementById('receita-categoria').value,
        observacao: document.getElementById('receita-observacao').value,
        tipo: TIPO_TRANSACAO // 'receita'
    };

    const url = isEditing ? `${API_BASE_URL}/transacoes/${id}/` : `${API_BASE_URL}/transacoes/`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(JSON.stringify(err));
        }

        showMessage(isEditing ? 'Receita atualizada!' : 'Receita adicionada!', true);
        resetFormulario();
        carregarReceitas();
        carregarEstatisticas(); // Atualiza os totais no topo

    } catch (error) {
        console.error(error);
        showMessage('Erro ao salvar. Verifique os campos.', false);
    }
}

// ============================================
// EDITAR E DELETAR
// ============================================
async function editarReceita(id) {
    const token = localStorage.getItem('accessToken');
    try {
        const response = await fetch(`${API_BASE_URL}/transacoes/${id}/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const item = await response.json();

        // Preenche o formulário
        receitaIdInput.value = item.id;
        document.getElementById('receita-descricao').value = item.descricao;
        document.getElementById('receita-valor').value = item.valor;
        document.getElementById('receita-data').value = item.data;
        document.getElementById('receita-categoria').value = item.categoria;
        document.getElementById('receita-observacao').value = item.observacao || '';

        // Ajusta UI para modo edição
        formTitle.textContent = 'Editar Receita';
        submitButtonText.textContent = 'Salvar Alterações';
        submitButton.querySelector('i').className = 'bx bxs-save';
        cancelEditBtn.style.display = 'inline-flex';
        
        // Rola para o topo
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
        console.error(error);
        alert('Erro ao carregar dados para edição.');
    }
}

async function deletarReceita(id) {
    if (!confirm('Tem certeza que deseja excluir esta receita?')) return;
    const token = localStorage.getItem('accessToken');

    try {
        const response = await fetch(`${API_BASE_URL}/transacoes/${id}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            carregarReceitas();
            carregarEstatisticas(); // Atualiza totais
        } else {
            alert('Erro ao excluir.');
        }
    } catch (error) {
        console.error(error);
    }
}

function resetFormulario() {
    document.getElementById('receitaForm').reset();
    receitaIdInput.value = '';
    formTitle.textContent = 'Adicionar Receita';
    submitButtonText.textContent = 'Adicionar Receita';
    submitButton.querySelector('i').className = 'bx bx-plus';
    cancelEditBtn.style.display = 'none';
}

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    if (!checarAutenticacao()) return;

    carregarCategorias();
    carregarReceitas();
    carregarEstatisticas(); 

    document.getElementById('receitaForm').addEventListener('submit', salvarReceita);
    document.getElementById('cancelEditBtn').addEventListener('click', resetFormulario);

    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        fazerLogout();
    });

    document.getElementById('menu-toggler')?.addEventListener('click', () => {
        document.body.classList.toggle('sidebar-hide');
    });
});