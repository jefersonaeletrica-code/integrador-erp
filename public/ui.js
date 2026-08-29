document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.querySelector('.toggle-btn');
    const submenuToggles = document.querySelectorAll('.submenu-toggle');

    // Função para alternar a barra lateral
    const toggleSidebar = () => {
        sidebar.classList.toggle('collapsed');
    };

    // Função para alternar submenus
    const toggleSubmenu = (e) => {
        e.preventDefault();
        const toggle = e.currentTarget;
        const submenu = toggle.nextElementSibling;

        // Fecha outros submenus abertos
        document.querySelectorAll('.submenu.open').forEach(openSubmenu => {
            if (openSubmenu !== submenu) {
                openSubmenu.classList.remove('open');
                openSubmenu.previousElementSibling.classList.remove('open');
            }
        });

        if (submenu && submenu.classList.contains('submenu')) {
            submenu.classList.toggle('open');
            toggle.classList.toggle('open');
        }
    };

    // Adiciona os event listeners
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleSidebar);
    }

    submenuToggles.forEach(toggle => {
        toggle.addEventListener('click', toggleSubmenu);
    });

    // Lógica de navegação (exemplo para carregar conteúdo)
    const pageContent = document.getElementById('page-content');
    const mainTitle = document.getElementById('main-title');
    document.querySelectorAll('.menu-links a:not(.submenu-toggle)').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageTitle = link.querySelector('.link-text').textContent;
            mainTitle.textContent = pageTitle;
            pageContent.innerHTML = `<p>Conteúdo da página de ${pageTitle.toLowerCase()}...</p>`;
        });
    });
});