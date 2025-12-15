// ============================================
// CONFIGURAÇÕES GERAIS
// ============================================
const API_BASE_URL = 'http://127.0.0.1:8000/api';
const LOGIN_PAGE_URL = 'index.html';
const TIPO_TRANSACAO = 'despesa';

// UI Elements
const formTitle = document.getElementById('formTitle');
const submitButton = document.getElementById('submitButton');
const submitButtonText = document.getElementById('submitButtonText');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const despesaIdInput = document.getElementById('despesa-id');
const apiMessage = document.getElementById('apiMessage');

// Cards Totais
const totalReceitasElem = document.getElementById('totalReceitas');
const totalDespesasElem = document.getElementById('totalDespesas');

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
// CARREGAR DADOS
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
    } catch (error) { console.error(error); }
}

async function carregarCategorias() {
    const select = document.getElementById('despesa-categoria');
    const token = localStorage.getItem('accessToken');
    try {
        const response = await fetch(`${API_BASE_URL}/categorias/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const dados = await response.json();
        let lista = Array.isArray(dados) ? dados : (dados.results || []);
        
        lista = lista.filter(cat => cat.tipo === TIPO_TRANSACAO);
        
        select.innerHTML = '<option value="">Selecione uma categoria</option>';
        lista.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.nome;
            select.appendChild(option);
        });
    } catch (error) { console.error(error); }
}

async function carregarDespesas() {
    const tbody = document.getElementById('despesasTableBody');
    const token = localStorage.getItem('accessToken');
    
    try {
        const response = await fetch(`${API_BASE_URL}/transacoes/?tipo=${TIPO_TRANSACAO}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Erro ao buscar dados');
        const dados = await response.json();
        let lista = Array.isArray(dados) ? dados : (dados.results || []);
        
        tbody.innerHTML = '';
        if (lista.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma despesa registrada.</td></tr>';
            return;
        }

        lista.forEach(item => {
            const tr = document.createElement('tr');
            // OBSERVAÇÃO ADICIONADA ABAIXO DA DESCRIÇÃO
            const obsHtml = item.observacao ? `<br><small style="color:#888; font-style:italic;">${item.observacao}</small>` : '';
            
            tr.innerHTML = `
                <td>${formatarData(item.data)}</td>
                <td>
                    <strong>${item.descricao}</strong>
                    ${obsHtml}
                </td>
                <td><span class="badge">${item.categoria_nome || '-'}</span></td>
                <td class="valor-negativo">${formatarMoeda(item.valor)}</td>
                <td style="display: flex; gap: 10px;">
                    <button class="btn-primary" style="padding: 5px 10px; font-size: 12px;" onclick="editarDespesa(${item.id})">
                        <i class='bx bx-edit'></i>
                    </button>
                    <button class="btn-delete" style="padding: 5px 10px;" onclick="deletarDespesa(${item.id})">
                        <i class='bx bx-trash'></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Erro ao carregar despesas.</td></tr>';
    }
}

// ============================================
// SALVAR, EDITAR, DELETAR
// ============================================
async function salvarDespesa(event) {
    event.preventDefault();
    const token = localStorage.getItem('accessToken');
    const id = despesaIdInput.value;
    const isEditing = !!id;

    const payload = {
        descricao: document.getElementById('despesa-descricao').value,
        valor: parseFloat(document.getElementById('despesa-valor').value),
        data: document.getElementById('despesa-data').value,
        categoria: document.getElementById('despesa-categoria').value,
        observacao: document.getElementById('despesa-observacao').value,
        tipo: TIPO_TRANSACAO
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
        if (!response.ok) throw new Error();

        showMessage(isEditing ? 'Despesa atualizada!' : 'Despesa adicionada!', true);
        resetFormulario();
        carregarDespesas();
        carregarEstatisticas();
    } catch (error) {
        showMessage('Erro ao salvar.', false);
    }
}

async function editarDespesa(id) {
    const token = localStorage.getItem('accessToken');
    try {
        const response = await fetch(`${API_BASE_URL}/transacoes/${id}/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const item = await response.json();

        despesaIdInput.value = item.id;
        document.getElementById('despesa-descricao').value = item.descricao;
        document.getElementById('despesa-valor').value = item.valor;
        document.getElementById('despesa-data').value = item.data;
        document.getElementById('despesa-categoria').value = item.categoria;
        document.getElementById('despesa-observacao').value = item.observacao || '';

        formTitle.textContent = 'Editar Despesa';
        submitButtonText.textContent = 'Salvar Alterações';
        submitButton.querySelector('i').className = 'bx bxs-save';
        cancelEditBtn.style.display = 'inline-flex';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) { alert('Erro ao carregar dados.'); }
}

async function deletarDespesa(id) {
    if (!confirm('Excluir esta despesa?')) return;
    const token = localStorage.getItem('accessToken');
    try {
        const response = await fetch(`${API_BASE_URL}/transacoes/${id}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            carregarDespesas();
            carregarEstatisticas();
        } else alert('Erro ao excluir.');
    } catch (error) { console.error(error); }
}

function resetFormulario() {
    document.getElementById('despesaForm').reset();
    despesaIdInput.value = '';
    formTitle.textContent = 'Adicionar Despesa';
    submitButtonText.textContent = 'Adicionar Despesa';
    submitButton.querySelector('i').className = 'bx bx-plus';
    cancelEditBtn.style.display = 'none';
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    if (!checarAutenticacao()) return;

    carregarCategorias();
    carregarDespesas();
    carregarEstatisticas();

    document.getElementById('despesaForm').addEventListener('submit', salvarDespesa);
    document.getElementById('cancelEditBtn').addEventListener('click', resetFormulario);

    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        fazerLogout();
    });

    document.getElementById('menu-toggler')?.addEventListener('click', () => {
        document.body.classList.toggle('sidebar-hide');
    });
});