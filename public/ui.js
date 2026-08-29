document.addEventListener('DOMContentLoaded', () => {
    // --- Lógica do Sidebar (Expandir/Recolher e Submenus) ---
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.querySelector('.toggle-btn');
    const submenuToggles = document.querySelectorAll('.submenu-toggle');

    const toggleSidebar = () => sidebar.classList.toggle('collapsed');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleSidebar);
    }

    submenuToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const self = e.currentTarget;
            const submenu = self.nextElementSibling;

            // Fecha outros submenus abertos
            document.querySelectorAll('.submenu.open').forEach(openSubmenu => {
                if (openSubmenu !== submenu) {
                    openSubmenu.classList.remove('open');
                    openSubmenu.previousElementSibling.classList.remove('open');
                }
            });

            if (submenu && submenu.classList.contains('submenu')) {
                submenu.classList.toggle('open');
                self.classList.toggle('open');
            }
        });
    });

    // --- Lógica de Carregamento Dinâmico de Conteúdo ---
    const pageContent = document.getElementById('page-content');
    const mainTitle = document.getElementById('main-title');

    const showLoading = () => {
        pageContent.innerHTML = '<p>Carregando...</p>';
    };

    const renderError = (error) => {
        pageContent.innerHTML = `<p style="color: red;">Erro ao carregar conteúdo: ${error.message}</p>`;
    };

    // --- Funções para Renderizar cada Página ---

    const renderErpConnections = async () => {
        mainTitle.textContent = 'Conexões ERP';
        showLoading();
        try {
            const response = await fetch('/api/erp-connections');
            if (!response.ok) throw new Error(`Erro de HTTP: ${response.status}`);
            const { connections } = await response.json();

            if (!connections || connections.length === 0) {
                pageContent.innerHTML = '<p>Nenhuma conexão ERP encontrada. Adicione uma para começar.</p>';
                return;
            }

            const tableRows = connections.map(conn => `
                <tr>
                    <td>${conn.id}</td>
                    <td>${conn.name}</td>
                    <td>${conn.type}</td>
                    <td><span class="status status-${conn.status}">${conn.status.replace('_', ' ')}</span></td>
                    <td>
                        <button class="btn-small">Editar</button>
                        <button class="btn-small btn-danger">Remover</button>
                    </td>
                </tr>
            `).join('');

            pageContent.innerHTML = `
                <button class="btn-primary">Adicionar Conexão ERP</button>
                <br><br>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nome</th>
                            <th>Tipo</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            `;
        } catch (error) {
            renderError(error);
        }
    };

    const renderSupplierConnections = async () => {
        mainTitle.textContent = 'Conexões Fornecedores';
        showLoading();
        try {
            const response = await fetch('/api/supplier-connections');
            if (!response.ok) throw new Error(`Erro de HTTP: ${response.status}`);
            const { connections } = await response.json();

            if (!connections || connections.length === 0) {
                pageContent.innerHTML = '<p>Nenhuma conexão de fornecedor encontrada. Adicione uma para começar.</p>';
                return;
            }

            const tableRows = connections.map(conn => `
                <tr>
                    <td>${conn.id}</td>
                    <td>${conn.name}</td>
                    <td>${conn.type.replace('_', ' ')}</td>
                    <td>
                        <button class="btn-small">Testar</button>
                        <button class="btn-small">Autenticar</button>
                        <button class="btn-small btn-danger">Remover</button>
                    </td>
                </tr>
            `).join('');

            pageContent.innerHTML = `
                <button class="btn-primary">Adicionar Conexão de Fornecedor</button>
                <br><br>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nome</th>
                            <th>Tipo</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            `;
        } catch (error) {
            renderError(error);
        }
    };

    const renderProductsPage = () => {
        mainTitle.textContent = 'Produtos';
        pageContent.innerHTML = `
            <h2>Visualizador de Produtos do ERP</h2>
            <p>Esta área permitirá a busca e visualização de produtos cadastrados no seu ERP.</p>
            <p>Funcionalidade em desenvolvimento.</p>
        `;
    };

    const renderWelcomePage = () => {
        mainTitle.textContent = 'Bem-vindo ao Integrador ERP';
        pageContent.innerHTML = '<p>Selecione uma opção no menu ao lado para começar.</p>';
    };

    // --- Roteador Simples para Navegação ---
    const routes = {
        'nav-produtos': renderProductsPage,
        'nav-conexoes-erp': renderErpConnections,
        'nav-conexoes-fornecedores': renderSupplierConnections,
    };

    document.querySelectorAll('.menu-links a:not(.submenu-toggle)').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const routeHandler = routes[link.id];
            if (routeHandler) {
                routeHandler();
            } else {
                renderWelcomePage();
            }
        });
    });

    // Carrega a página inicial padrão
    renderWelcomePage();
});