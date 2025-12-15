// ============================================
// CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
// ============================================
const API_BASE_URL = 'http://127.0.0.1:8000/api';
const LOGIN_PAGE_URL = 'index.html';

let todasTransacoes = []; // Armazena os dados brutos
let chartInstances = {}; // Armazena as instâncias dos gráficos para atualizar depois

// Elementos UI
const filtroMes = document.getElementById('filtro-mes');
const filtroAno = document.getElementById('filtro-ano');
const btnLimpar = document.getElementById('btnLimparFiltros');

const cardReceitas = document.getElementById('totalReceitas');
const cardDespesas = document.getElementById('totalDespesas');
const cardSaldo = document.getElementById('saldoTotal');

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

// ============================================
// LÓGICA DE DADOS
// ============================================

async function carregarDados() {
    const token = localStorage.getItem('accessToken');
    try {
        // Buscamos TODAS as transações para processar no front-end
        // Isso permite filtrar por mês/ano dinamicamente sem chamar a API toda hora
        const response = await fetch(`${API_BASE_URL}/transacoes/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Erro ao buscar dados');

        const dados = await response.json();
        // Garante que é um array (caso a API use paginação no futuro, teria que ajustar aqui)
        todasTransacoes = Array.isArray(dados) ? dados : (dados.results || []);

        preencherFiltroAnos();
        atualizarDashboard();

    } catch (error) {
        console.error("Erro:", error);
        alert("Erro ao carregar dados.");
    }
}

function preencherFiltroAnos() {
    // Extrai anos únicos das transações
    const anos = new Set();
    todasTransacoes.forEach(t => {
        const ano = t.data.split('-')[0];
        anos.add(ano);
    });

    // Ordena e preenche o select
    const anosOrdenados = Array.from(anos).sort().reverse();
    filtroAno.innerHTML = '<option value="">Todos os anos</option>';
    
    anosOrdenados.forEach(ano => {
        const option = document.createElement('option');
        option.value = ano;
        option.textContent = ano;
        filtroAno.appendChild(option);
    });
}

function filtrarDados() {
    const mesSelecionado = filtroMes.value;
    const anoSelecionado = filtroAno.value;

    return todasTransacoes.filter(t => {
        const [ano, mes, dia] = t.data.split('-');
        
        const matchMes = mesSelecionado ? mes === mesSelecionado : true;
        const matchAno = anoSelecionado ? ano === anoSelecionado : true;

        return matchMes && matchAno;
    });
}

function atualizarDashboard() {
    const dadosFiltrados = filtrarDados();
    
    atualizarCards(dadosFiltrados);
    renderizarGraficos(dadosFiltrados);
}

function atualizarCards(dados) {
    let totalRec = 0;
    let totalDesp = 0;

    dados.forEach(t => {
        const valor = parseFloat(t.valor);
        if (t.tipo === 'receita') totalRec += valor;
        else if (t.tipo === 'despesa') totalDesp += valor;
    });

    cardReceitas.textContent = formatarMoeda(totalRec);
    cardDespesas.textContent = formatarMoeda(totalDesp);
    
    const saldo = totalRec - totalDesp;
    cardSaldo.textContent = formatarMoeda(saldo);
    
    // Cor do saldo
    cardSaldo.parentElement.parentElement.querySelector('i').style.color = saldo >= 0 ? '#28a745' : '#DB504A';
    cardSaldo.parentElement.parentElement.querySelector('i').style.background = saldo >= 0 ? '#d4edda' : '#FFE0D3';
}

// ============================================
// GRÁFICOS (CHART.JS)
// ============================================

function destruirGrafico(id) {
    if (chartInstances[id]) {
        chartInstances[id].destroy();
    }
}

function renderizarGraficos(dados) {
    // 1. Receitas vs Despesas
    renderChartReceitasDespesas(dados);
    
    // 2. Receitas por Categoria
    renderChartCategoria(dados, 'receita', 'chartReceitasCategoria', '#28a745');
    
    // 3. Despesas por Categoria
    renderChartCategoria(dados, 'despesa', 'chartDespesasCategoria', '#DB504A');
    
    // 4. Evolução Mensal
    renderChartEvolucao(dados);
}

function renderChartReceitasDespesas(dados) {
    const ctx = document.getElementById('chartReceitasDespesas').getContext('2d');
    
    let totalRec = 0;
    let totalDesp = 0;
    dados.forEach(t => {
        if (t.tipo === 'receita') totalRec += parseFloat(t.valor);
        else totalDesp += parseFloat(t.valor);
    });

    destruirGrafico('receitasDespesas');

    chartInstances['receitasDespesas'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Receitas', 'Despesas'],
            datasets: [{
                data: [totalRec, totalDesp],
                backgroundColor: ['#28a745', '#DB504A'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function renderChartCategoria(dados, tipo, canvasId, corBase) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Agrupar por categoria
    const categorias = {};
    dados.filter(t => t.tipo === tipo).forEach(t => {
        const catNome = t.categoria_nome || 'Sem Categoria';
        if (!categorias[catNome]) categorias[catNome] = 0;
        categorias[catNome] += parseFloat(t.valor);
    });

    const labels = Object.keys(categorias);
    const valores = Object.values(categorias);

    destruirGrafico(canvasId);

    // Gerar cores com opacidade
    const backgroundColors = labels.map(() => corBase + '80'); // hex + alpha
    const borderColors = labels.map(() => corBase);

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `Total em R$`,
                data: valores,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function renderChartEvolucao(dados) {
    const ctx = document.getElementById('chartEvolucaoMensal').getContext('2d');
    
    // Agrupar por Mês (Ano-Mês)
    // Formato da chave: "2025-01", "2025-02"
    const timeline = {};
    
    dados.forEach(t => {
        const mesAno = t.data.substring(0, 7); // Pega YYYY-MM
        if (!timeline[mesAno]) timeline[mesAno] = { receita: 0, despesa: 0 };
        
        if (t.tipo === 'receita') timeline[mesAno].receita += parseFloat(t.valor);
        else timeline[mesAno].despesa += parseFloat(t.valor);
    });

    // Ordenar chaves
    const labels = Object.keys(timeline).sort();
    const dataReceitas = labels.map(k => timeline[k].receita);
    const dataDespesas = labels.map(k => timeline[k].despesa);

    // Formatar labels para PT-BR (ex: 2025-01 -> Jan/2025)
    const labelsFormatados = labels.map(l => {
        const [ano, mes] = l.split('-');
        return `${mes}/${ano}`;
    });

    destruirGrafico('evolucao');

    chartInstances['evolucao'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labelsFormatados,
            datasets: [
                {
                    label: 'Receitas',
                    data: dataReceitas,
                    borderColor: '#28a745',
                    backgroundColor: '#28a745',
                    tension: 0.3
                },
                {
                    label: 'Despesas',
                    data: dataDespesas,
                    borderColor: '#DB504A',
                    backgroundColor: '#DB504A',
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// ============================================
// INICIALIZAÇÃO E EVENTOS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    if (!checarAutenticacao()) return;

    carregarDados();

    // Eventos de Filtro
    filtroMes.addEventListener('change', atualizarDashboard);
    filtroAno.addEventListener('change', atualizarDashboard);

    btnLimpar.addEventListener('click', () => {
        filtroMes.value = "";
        filtroAno.value = "";
        atualizarDashboard();
    });

    // Logout e Menu
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        fazerLogout();
    });

    document.getElementById('menu-toggler')?.addEventListener('click', () => {
        document.body.classList.toggle('sidebar-hide');
    });
});