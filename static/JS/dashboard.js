// ============================================
// CONFIGURAÇÕES GERAIS
// ============================================

const API_BASE_URL = 'http://127.0.0.1:8000/api';
const LOGIN_PAGE_URL = 'index.html'; 
let chartInstance = null; 

// VARIÁVEIS GLOBAIS PARA O RELATÓRIO PDF
let globalTransacoes = [];
let globalMetas = [];

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

function fazerLogout(event) {
    if (event) event.preventDefault();
    localStorage.clear();
    window.location.href = LOGIN_PAGE_URL;
}

const formatarMoeda = (valor) => (parseFloat(valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatarData = (dataIso) => {
    if(!dataIso) return '-';
    // Espera formato YYYY-MM-DD
    const [ano, mes, dia] = dataIso.split('-');
    return `${dia}/${mes}/${ano}`;
};

// ============================================
// DARK MODE
// ============================================

function setupDarkMode() {
    const themeSwitch = document.getElementById('theme-switch');
    const body = document.body;

    const savedTheme = localStorage.getItem('ga_theme');
    
    if (savedTheme === 'dark') {
        body.classList.add('dark');
        if(themeSwitch) themeSwitch.checked = true;
    }

    if (themeSwitch) {
        themeSwitch.addEventListener('change', () => {
            if (themeSwitch.checked) {
                body.classList.add('dark');
                localStorage.setItem('ga_theme', 'dark');
            } else {
                body.classList.remove('dark');
                localStorage.setItem('ga_theme', 'light');
            }
        });
    }
}

// ============================================
// 1. PRIMEIROS PASSOS
// ============================================

function verificarPassosConcluidos() {
    if (localStorage.getItem('ga_primeiros_passos_concluidos') === 'true') {
        const card = document.querySelector('.steps-card');
        const container = document.querySelector('.recent-data');
        
        if (card) card.style.display = 'none';
        if (container) container.style.gridTemplateColumns = '1fr'; 
        return true;
    }
    return false;
}

function atualizarPassos(temReceita, temDespesa, temMeta, temBio) {
    const steps = [
        { id: 'step-receita', done: temReceita },
        { id: 'step-despesa', done: temDespesa },
        { id: 'step-meta', done: temMeta },
        { id: 'step-bio', done: !!temBio && temBio.length > 0 }
    ];

    let concluidos = 0;

    steps.forEach(step => {
        const el = document.getElementById(step.id);
        if(!el) return;

        if (step.done) {
            concluidos++;
            el.classList.add('completed');
            const icon = el.querySelector('i');
            if(icon) icon.className = 'bx bxs-check-circle';
        } else {
            el.classList.remove('completed');
            const icon = el.querySelector('i');
            if(icon) icon.className = 'bx bx-circle';
        }
    });

    const porcentagem = (concluidos / steps.length) * 100;
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    if(progressBar) progressBar.style.width = `${porcentagem}%`;
    if(progressText) progressText.textContent = `${Math.round(porcentagem)}%`;

    if (concluidos === steps.length) {
        const card = document.querySelector('.steps-card');
        if (card && !card.classList.contains('hide-animation') && card.style.display !== 'none') {
            setTimeout(() => {
                card.classList.add('hide-animation');
                card.addEventListener('animationend', () => {
                    card.style.display = 'none';
                    const container = document.querySelector('.recent-data');
                    if(container) container.style.gridTemplateColumns = '1fr';
                    localStorage.setItem('ga_primeiros_passos_concluidos', 'true');
                }, { once: true });
            }, 1500);
        }
    }
}

// ============================================
// 2. SEQUÊNCIA (STREAK)
// ============================================

function gerenciarSequencia() {
    const hoje = new Date().toLocaleDateString('pt-BR'); 
    const lastLogin = localStorage.getItem('ga_streak_last_login');
    let count = parseInt(localStorage.getItem('ga_streak_count') || '0');

    if (lastLogin !== hoje) {
        if (lastLogin) {
            const partesHoje = hoje.split('/');
            const partesLast = lastLogin.split('/');
            const dataHojeObj = new Date(partesHoje[2], partesHoje[1] - 1, partesHoje[0]);
            const dataLastObj = new Date(partesLast[2], partesLast[1] - 1, partesLast[0]);
            const diffTime = Math.abs(dataHojeObj - dataLastObj);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

            if (diffDays === 1) count++; 
            else count = 1; 
        } else {
            count = 1; 
        }
        localStorage.setItem('ga_streak_last_login', hoje);
        localStorage.setItem('ga_streak_count', count);
    }

    const countEl = document.getElementById('streak-count');
    if(countEl) countEl.textContent = count;
    
    renderizarCalendarioSemana();
}

function renderizarCalendarioSemana() {
    const container = document.getElementById('day-numbers-container');
    if(!container) return;
    container.innerHTML = '';
    
    const hoje = new Date();
    const diaSemana = hoje.getDay(); 
    const dataIteracao = new Date(hoje);
    dataIteracao.setDate(hoje.getDate() - diaSemana);

    for (let i = 0; i < 7; i++) {
        const div = document.createElement('div');
        div.className = 'day-circle';
        div.textContent = dataIteracao.getDate();
        
        if (i === diaSemana) div.classList.add('active');
        
        const streak = parseInt(localStorage.getItem('ga_streak_count') || '1');
        if (i <= diaSemana && i >= (diaSemana - (streak - 1))) {
             div.classList.add('complete');
        }

        container.appendChild(div);
        dataIteracao.setDate(dataIteracao.getDate() + 1);
    }
}

// ============================================
// 3. BARRA DE VIDA (HP)
// ============================================

function definirLimiteGastos() {
    const modal = document.getElementById('hpModal');
    const input = document.getElementById('newLimitInput');
    const atual = localStorage.getItem('ga_limite_gastos') || '2000';
    
    if(input) {
        input.value = atual;
        setTimeout(() => input.focus(), 100);
    }
    if(modal) modal.style.display = 'flex';
}

function fecharModalHP() {
    const modal = document.getElementById('hpModal');
    if(modal) modal.style.display = 'none';
}

function salvarNovoLimite() {
    const input = document.getElementById('newLimitInput');
    const novoLimite = parseFloat(input.value);

    if (!isNaN(novoLimite) && novoLimite > 0) {
        localStorage.setItem('ga_limite_gastos', novoLimite);
        carregarDadosDashboard(); 
        fecharModalHP();
    } else {
        alert("Por favor, insira um valor válido.");
    }
}

function calcularVidaFinanceira(totalDespesas) {
    const limite = parseFloat(localStorage.getItem('ga_limite_gastos') || '2000');
    
    const elLimit = document.getElementById('limitValue');
    if(elLimit) elLimit.textContent = formatarMoeda(limite);
    
    let vidaRestante = limite - totalDespesas;
    let porcentagemVida = (vidaRestante / limite) * 100;

    if (porcentagemVida > 100) porcentagemVida = 100;
    if (porcentagemVida < 0) porcentagemVida = 0;

    const bar = document.getElementById('hpBar');
    const text = document.getElementById('hpText');
    const status = document.getElementById('hpStatus');
    const icon = document.getElementById('heartIcon');

    if (bar && text && status && icon) {
        bar.style.width = `${porcentagemVida}%`;
        text.textContent = `${Math.round(porcentagemVida)}%`;

        bar.className = 'hp-bar-fill'; 
        icon.className = 'bx bxs-heart'; 

        if (porcentagemVida > 50) {
            status.textContent = "Saudável! Continue assim.";
            status.style.color = "var(--green-icon)";
        } else if (porcentagemVida > 20) {
            bar.classList.add('warning');
            status.textContent = "Cuidado! Orçamento apertando.";
            status.style.color = "var(--orange)";
        } else {
            bar.classList.add('danger');
            status.textContent = "Crítico! Limite estourado.";
            status.style.color = "var(--red)";
            icon.className = 'bx bxs-skull'; 
        }
    }
}

// ============================================
// 4. TROFÉUS E NÍVEL
// ============================================

function calcularNivelUsuario(totalTransacoes) {
    const XP_POR_TRANSACAO = 10;
    const XP_PARA_UPAR = 100;

    const xpTotal = totalTransacoes * XP_POR_TRANSACAO;
    const nivelAtual = Math.floor(xpTotal / XP_PARA_UPAR) + 1;
    const xpNesteNivel = xpTotal % XP_PARA_UPAR;
    const porcentagemBarra = (xpNesteNivel / XP_PARA_UPAR) * 100;
    const transacoesFaltantes = (XP_PARA_UPAR - xpNesteNivel) / XP_POR_TRANSACAO;

    let titulo = "Iniciante Financeiro";
    if (nivelAtual >= 5) titulo = "Poupador Aprendiz";
    if (nivelAtual >= 10) titulo = "Gerente do Próprio Bolso";
    if (nivelAtual >= 20) titulo = "Investidor Focado";
    if (nivelAtual >= 50) titulo = "Magnata das Finanças";

    const elNivel = document.getElementById('currentLevel');
    const elTitulo = document.getElementById('userTitle');
    const elXpCurrent = document.getElementById('xpCurrent');
    const elXpNext = document.getElementById('xpNext');
    const elBar = document.getElementById('xpBar');
    const elFaltam = document.getElementById('transacoesRestantes');

    if(elNivel) elNivel.textContent = `Nvl ${nivelAtual}`;
    if(elTitulo) elTitulo.textContent = titulo;
    if(elXpCurrent) elXpCurrent.textContent = `${xpNesteNivel} XP`;
    if(elXpNext) elXpNext.textContent = `Próx: ${XP_PARA_UPAR} XP`;
    if(elBar) elBar.style.width = `${porcentagemBarra}%`;
    if(elFaltam) elFaltam.textContent = Math.ceil(transacoesFaltantes);
}

function renderizarTrofeusDashboard(stats) {
    const shelf = document.getElementById('trophyShelf');
    if (!shelf) return;
    shelf.innerHTML = '';

    const trofeusPossiveis = [
        { id: 'primeiro_passo', titulo: 'Primeiros Passos', icon: 'bx-walk', cor: 'trophy-bronze', check: (s) => s.totalTransacoes > 0 },
        { id: 'poupador', titulo: 'Poupador', icon: 'bx-wallet-alt', cor: 'trophy-green', check: (s) => s.saldo > 0 },
        { id: 'nivel_5', titulo: 'Subindo Nível', icon: 'bx-up-arrow-circle', cor: 'trophy-blue', check: (s) => s.totalTransacoes >= 50 }, 
        { id: 'magnata', titulo: 'Magnata', icon: 'bx-diamond', cor: 'trophy-gold', check: (s) => s.saldo >= 1000 },
        { id: 'veterano', titulo: 'Veterano', icon: 'bx-medal', cor: 'trophy-silver', check: (s) => s.totalTransacoes >= 100 }
    ];

    const desbloqueados = trofeusPossiveis.filter(t => t.check(stats));
    const ultimos = desbloqueados.slice(0, 3); 

    if (ultimos.length === 0) {
        shelf.innerHTML = '<p style="font-size: 13px; color: #aaa; margin-top:10px;">Jogue para desbloquear!</p>';
        return;
    }

    ultimos.forEach(t => {
        const html = `
            <div class="trophy-item-mini" title="${t.titulo}">
                <div class="trophy-circle ${t.cor}">
                    <i class='bx ${t.icon}'></i>
                </div>
                <p>${t.titulo}</p>
            </div>
        `;
        shelf.insertAdjacentHTML('beforeend', html);
    });
}

// ============================================
// 5. GRÁFICO (Canvas)
// ============================================

function processarGraficoReceitas(transacoes) {
    const receitas = transacoes.filter(t => t.tipo === 'receita');
    const containerChart = document.getElementById('chartContainer');
    const containerEmpty = document.getElementById('chartPlaceholder');

    if (receitas.length === 0) {
        if(containerChart) containerChart.style.display = 'none';
        if(containerEmpty) containerEmpty.style.display = 'block';
        return;
    }

    if(containerChart) containerChart.style.display = 'block';
    if(containerEmpty) containerEmpty.style.display = 'none';

    const dadosAgrupados = {};
    receitas.forEach(t => {
        const catNome = t.categoria_nome || t.categoria?.nome || 'Sem Categoria';
        const valor = parseFloat(t.valor);
        dadosAgrupados[catNome] = (dadosAgrupados[catNome] || 0) + valor;
    });

    const ctx = document.getElementById('receitasChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(dadosAgrupados),
            datasets: [{
                data: Object.values(dadosAgrupados),
                backgroundColor: ['#3c91e6', '#38C172', '#FFCE26', '#9966FF', '#FD7238', '#4BC0C0', '#FF9F40'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { usePointStyle: true, font: { family: "'Poppins', sans-serif" } } } }
        }
    });
}

// ============================================
// 6. GERAÇÃO DE PDF (DETALHADO)
// ============================================

document.querySelector('.btn-download').addEventListener('click', async (e) => {
    e.preventDefault();
    const btn = document.querySelector('.btn-download');
    
    // Feedback visual
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Gerando...`;
    
    // Preencher o Template Oculto
    preencherRelatorioPDF();

    const element = document.getElementById('report-template');
    
    // Torna visível para a captura, mas sem quebrar o layout da página
    element.style.display = 'block'; 

    const opt = {
        margin:       10,
        filename:     `Relatorio_Detalhado_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' } 
    };

    try {
        await html2pdf().set(opt).from(element).save();
    } catch (err) {
        console.error("Erro ao gerar PDF", err);
        alert("Erro ao gerar PDF.");
    } finally {
        element.style.display = 'none';
        btn.innerHTML = textoOriginal;
    }
});

function preencherRelatorioPDF() {
    // A. Data
    document.getElementById('reportDate').textContent = new Date().toLocaleString('pt-BR');

    // B. Separar Dados
    let totalRec = 0;
    let totalDesp = 0;
    let htmlReceitas = '';
    let htmlDespesas = '';

    globalTransacoes.forEach(t => {
        const valor = parseFloat(t.valor);
        const linha = `
            <tr>
                <td>${formatarData(t.data)}</td>
                <td>${t.descricao}</td>
                <td>${t.categoria_nome || t.categoria?.nome || 'Geral'}</td>
                <td>${formatarMoeda(valor)}</td>
            </tr>
        `;

        if (t.tipo === 'receita') {
            totalRec += valor;
            htmlReceitas += linha;
        } else {
            totalDesp += valor;
            htmlDespesas += linha;
        }
    });

    // C. Totais
    document.getElementById('repTotalReceitas').textContent = formatarMoeda(totalRec);
    document.getElementById('repTotalDespesas').textContent = formatarMoeda(totalDesp);
    
    const saldo = totalRec - totalDesp;
    const elSaldo = document.getElementById('repSaldo');
    elSaldo.textContent = formatarMoeda(saldo);
    elSaldo.style.color = saldo >= 0 ? '#1565c0' : '#c62828'; 

    // D. Tabelas
    document.getElementById('repTableReceitas').innerHTML = htmlReceitas || '<tr><td colspan="4" style="text-align:center">Nenhuma receita registrada.</td></tr>';
    document.getElementById('repTableDespesas').innerHTML = htmlDespesas || '<tr><td colspan="4" style="text-align:center">Nenhuma despesa registrada.</td></tr>';

    // E. Metas
    const containerMetas = document.getElementById('repGoalsList');
    containerMetas.innerHTML = '';
    
    if (globalMetas.length === 0) {
        containerMetas.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#777;">Nenhuma meta cadastrada.</p>';
    } else {
        globalMetas.forEach(m => {
            const atual = parseFloat(m.valor_atual);
            const alvo = parseFloat(m.valor_alvo);
            const pct = alvo > 0 ? (atual / alvo) * 100 : 0;
            const pctLimitado = Math.min(pct, 100);

            containerMetas.innerHTML += `
                <div class="goal-item-pdf">
                    <div class="goal-header">
                        <span>${m.nome}</span>
                        <span>${Math.round(pct)}%</span>
                    </div>
                    <div style="font-size:11px; color:#555; margin-bottom:5px;">
                        ${formatarMoeda(atual)} de ${formatarMoeda(alvo)}
                    </div>
                    <div class="goal-bar-bg">
                        <div class="goal-bar-fill" style="width: ${pctLimitado}%"></div>
                    </div>
                </div>
            `;
        });
    }

    // F. Gráfico (Converter Canvas para Imagem)
    const canvas = document.getElementById('receitasChart');
    const imgContainer = document.getElementById('reportChartContainer');
    
    if (canvas) {
        const imgData = canvas.toDataURL('image/png');
        imgContainer.innerHTML = `<img src="${imgData}" style="max-height: 250px;">`;
    } else {
        imgContainer.innerHTML = '<p>Gráfico indisponível.</p>';
    }
}

// ============================================
// CARREGAR DADOS DA API
// ============================================

async function carregarDadosDashboard() {
    const token = localStorage.getItem('accessToken');
    
    try {
        const [resTransacoes, resUser, resMetas] = await Promise.all([
            fetch(`${API_BASE_URL}/transacoes/`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_BASE_URL}/users/me/`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_BASE_URL}/metas/`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (!resTransacoes.ok || !resUser.ok) {
            if (resTransacoes.status === 401) fazerLogout();
            return;
        }

        const transacoes = await resTransacoes.json();
        const user = await resUser.json();
        const metasResponse = resMetas.ok ? await resMetas.json() : [];

        // SALVAR EM VARIÁVEIS GLOBAIS PARA O PDF
        globalTransacoes = Array.isArray(transacoes) ? transacoes : (transacoes.results || []);
        
        if (Array.isArray(metasResponse)) globalMetas = metasResponse;
        else if (metasResponse.results) globalMetas = metasResponse.results;
        else globalMetas = [];

        // Tratamento para Dashboard (Visualização na Tela)
        const listaTransacoes = globalTransacoes;

        // CÁLCULO DE TOTAIS
        let receita = 0;
        let despesa = 0;
        let temReceita = false;
        let temDespesa = false;

        listaTransacoes.forEach(t => {
            const valor = parseFloat(t.valor);
            if (t.tipo === 'receita') {
                receita += valor;
                temReceita = true;
            } else {
                despesa += valor;
                temDespesa = true;
            }
        });

        const saldo = receita - despesa;

        // Atualiza Cards de KPI
        document.getElementById('totalReceitas').textContent = formatarMoeda(receita);
        document.getElementById('totalDespesas').textContent = formatarMoeda(despesa);
        
        const cardSaldo = document.getElementById('gastosCartao');
        if(cardSaldo) {
            cardSaldo.textContent = formatarMoeda(saldo);
            cardSaldo.style.color = saldo < 0 ? 'var(--red)' : 'var(--blue)';
        }

        // Atualiza Avatar
        if (user.avatar) {
            const imgAvatar = document.getElementById('headerAvatar');
            if(imgAvatar) {
                imgAvatar.src = user.avatar;
                imgAvatar.style.display = 'block';
            }
        }

        // Funções de Gamificação e Gráfico
        calcularVidaFinanceira(despesa);
        calcularNivelUsuario(listaTransacoes.length);
        renderizarTrofeusDashboard({
            saldo: saldo,
            totalTransacoes: listaTransacoes.length
        });

        processarGraficoReceitas(listaTransacoes);
        
        if (localStorage.getItem('ga_primeiros_passos_concluidos') !== 'true') {
            atualizarPassos(temReceita, temDespesa, globalMetas.length > 0, user.bio);
        }

    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    if (!checarAutenticacao()) return;

    setupDarkMode();

    // Fecha modal se clicar fora
    window.onclick = function(event) {
        const modal = document.getElementById('hpModal');
        if (event.target == modal) fecharModalHP();
    }

    verificarPassosConcluidos();
    gerenciarSequencia();
    carregarDadosDashboard();

    document.getElementById('logoutBtn')?.addEventListener('click', fazerLogout);
    
    // Atualiza a cada 10s
    setInterval(() => {
        if (!document.hidden) carregarDadosDashboard();
    }, 10000);

    const menuToggler = document.getElementById('menu-toggler');
    if (menuToggler) {
        menuToggler.addEventListener('click', () => {
            document.body.classList.toggle('sidebar-hide');
        });
    }
});