// ============================================
// CONFIGURAÇÕES
// ============================================

const API_BASE_URL = 'http://127.0.0.1:8000/api';
const DASHBOARD_URL = '/Html/dashboard.html';

// ============================================
// VARIÁVEIS DE INTERFACE (UI)
// ============================================

// Referências aos elementos de UI
const loginPopup = document.querySelector('.btnLogin-popup');
const wrapper = document.querySelector('.wrapper');
const iconClose = document.querySelector('.icon-close');
const registerLink = document.querySelector('.register-link');
const loginLink = document.querySelector('.login-link');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');


// ============================================
// LÓGICA DE INTERFACE (UI)
// ============================================

function configurarEventosUI() {
    // 1. ABRIR o modal (wrapper) ao clicar no botão 'Login' no header
    if (loginPopup && wrapper) {
        loginPopup.addEventListener('click', () => {
            wrapper.classList.add('active-popup');
        });
    }

    // 2. FECHAR o modal ao clicar no ícone 'X'
    if (iconClose && wrapper) {
        iconClose.addEventListener('click', () => {
            wrapper.classList.remove('active-popup');
            wrapper.classList.remove('active'); // Garante que volta para a aba Login
        });
    }

    // 3. Alternar para a caixa de 'Registrar' (Link dentro do modal)
    if (registerLink && wrapper) {
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            wrapper.classList.add('active');
        });
    }

    // 4. Alternar para a caixa de 'Login' (Link dentro do modal)
    if (loginLink && wrapper) {
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            wrapper.classList.remove('active');
        });
    }
}


// ============================================
// LOGIN
// ============================================

async function fazerLogin(event) {
    event.preventDefault();

    // IDs CORRIGIDOS para corresponderem ao index.html
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const messageElement = document.getElementById('loginMessage');

    if (!username || !password) {
        exibirMensagem(messageElement, false, 'Preencha usuário e senha');
        return;
    }

    exibirMensagem(messageElement, false, 'Fazendo login...');

    try {
        const response = await fetch(`${API_BASE_URL}/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Erro ao fazer login. Verifique suas credenciais.');
        }

        const data = await response.json();

        // Salvar tokens e dados do usuário
        localStorage.setItem('accessToken', data.access);
        localStorage.setItem('refreshToken', data.refresh);
        localStorage.setItem('username', data.username);
        localStorage.setItem('userEmail', data.email);
        localStorage.setItem('userId', data.id);

        exibirMensagem(messageElement, true, 'Login realizado com sucesso!');
        
        // Redirecionar para dashboard após 1 segundo
        setTimeout(() => {
            window.location.href = DASHBOARD_URL;
        }, 1000);

    } catch (error) {
        exibirMensagem(messageElement, false, `Erro: ${error.message}`);
    }
}

// ============================================
// REGISTRO
// ============================================

async function fazerRegistro(event) {
    event.preventDefault();

    // IDs CORRIGIDOS para corresponderem ao index.html
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regPassword2').value;
    const messageElement = document.getElementById('registerMessage');

    if (!username || !email || !password || !confirmPassword) {
        exibirMensagem(messageElement, false, 'Preencha todos os campos');
        return;
    }

    if (password !== confirmPassword) {
        exibirMensagem(messageElement, false, 'As senhas não coincidem');
        return;
    }

    if (password.length < 6) {
        exibirMensagem(messageElement, false, 'A senha deve ter pelo menos 6 caracteres');
        return;
    }

    exibirMensagem(messageElement, false, 'Criando conta...');

    try {
        const response = await fetch(`${API_BASE_URL}/register/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Erro ao criar conta. Usuário ou E-mail já podem existir.');
        }

        exibirMensagem(messageElement, true, 'Conta criada com sucesso! Você será redirecionado para o Login.');
        document.getElementById('registerForm').reset();

        // Limpar formulário de login e mostrar mensagem
        setTimeout(() => {
            // Mudar para a tela de Login e fechar a tela de Registro
            wrapper.classList.remove('active'); 
            
            // Limpar/Preencher o formulário de login 
            document.getElementById('loginForm').reset();
            document.getElementById('loginUsername').value = username;
            document.getElementById('loginMessage').textContent = 'Agora faça login com sua nova conta';
        }, 1500);

    } catch (error) {
        exibirMensagem(messageElement, false, `Erro: ${error.message}`);
    }
}

// ============================================
// EXIBIR MENSAGEM
// ============================================

function exibirMensagem(element, isSuccess, msg) {
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

// O trecho abaixo (alternarFormulario) não é estritamente necessário 
// pois a UI já está sendo controlada pela adição/remoção da classe 'active'
// no wrapper, mas mantive por compatibilidade, caso você use 'loginTab' e 'registerTab'
// em outro lugar.

// ============================================
// ALTERNAR ENTRE LOGIN E REGISTRO (Legacy/Tabs)
// ============================================
/*
function alternarFormulario(tipo) {
    const loginForm = document.querySelector('.form-box.login');
    const registerForm = document.querySelector('.form-box.register');
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');

    if (tipo === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        if (loginTab) loginTab.classList.add('active');
        if (registerTab) registerTab.classList.remove('active');
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        if (loginTab) loginTab.classList.remove('active');
        if (registerTab) registerTab.classList.add('active');
    }
}
*/

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Verificar se já está logado
    const token = localStorage.getItem('accessToken');
    if (token) {
        window.location.href = DASHBOARD_URL;
        return;
    }

    // 1. Configurar eventos de ABERTURA/FECHAMENTO do modal
    configurarEventosUI();

    // 2. Configurar o envio dos formulários
    if (loginForm) {
        loginForm.addEventListener('submit', fazerLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', fazerRegistro);
    }
    
    // 3. Configurar Event Listeners para Tabs (se existirem no HTML)
    /*
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');

    if (loginTab) {
        loginTab.addEventListener('click', () => alternarFormulario('login'));
    }

    if (registerTab) {
        registerTab.addEventListener('click', () => alternarFormulario('register'));
    }
    */
});