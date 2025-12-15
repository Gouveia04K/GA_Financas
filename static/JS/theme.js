// JS/theme.js

document.addEventListener('DOMContentLoaded', () => {
    const themeSwitch = document.getElementById('theme-switch');
    const body = document.body;

    // 1. Verifica preferência salva no LocalStorage ao carregar a página
    const savedTheme = localStorage.getItem('ga_theme');
    
    // Aplica o tema escuro se estiver salvo
    if (savedTheme === 'dark') {
        body.classList.add('dark');
        if (themeSwitch) themeSwitch.checked = true;
    }

    // 2. Adiciona o evento de clique no botão (se ele existir na página)
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
});

// (Opcional) Executa imediatamente para evitar "piscar" o tema claro ao carregar
(function() {
    if (localStorage.getItem('ga_theme') === 'dark') {
        document.body.classList.add('dark');
    }
})();