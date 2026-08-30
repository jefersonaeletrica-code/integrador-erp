document.addEventListener('DOMContentLoaded', () => {
    /**
     * =================================================================
     * MÓDULO DE UI: Inicialização e Componentes Visuais
     * =================================================================
     */

    // Elementos principais do DOM
    const pageContent = document.getElementById('page-content');
    const mainTitle = document.getElementById('main-title');
    const mainSubtitle = document.getElementById('main-subtitle');
    const headerActions = document.getElementById('header-actions');
    const modal = document.getElementById('form-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalSubtitle = document.getElementById('modal-subtitle');
    const modalIconBadge = document.getElementById('modal-icon-badge');
    const formFields = document.getElementById('form-fields');
    const modalForm = document.getElementById('modal-form');
    const modalSaveBtn = document.getElementById('modal-save-btn');
    const closeModalBtn = document.querySelector('.modal-close');
    const cancelModalBtn = document.querySelector('.modal-cancel');
    const brandLink = document.getElementById('brand-link');

    /**
     * Inicializa a lógica do seletor de tema (Dark Mode).
     */
    function initializeThemeSwitcher() {
        const themeToggleButton = document.getElementById('theme-toggle-btn');
        if (!themeToggleButton) return;

        const currentTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

        function applyTheme(theme) {
            document.body.style.transition = 'none';
            if (theme === 'dark') {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
            setTimeout(() => {
                document.body.style.transition = '';
            }, 10);
        }

        const initialTheme = currentTheme || (prefersDark ? 'dark' : 'light');
        applyTheme(initialTheme);

        themeToggleButton.addEventListener('click', () => {
            const isDarkMode = document.body.classList.contains('dark-mode');
            const newTheme = isDarkMode ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
            showToast(`Modo ${newTheme === 'dark' ? 'Escuro' : 'Claro'} ativado`, 'info');
        });
    }

    /**
     * Inicializa a barra lateral (Sidebar).
     */
    function initializeSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const content = document.querySelector('.content');
        const toggleBtn = document.querySelector('.toggle-btn');
        const submenuToggles = document.querySelectorAll('.submenu-toggle');

        if (!sidebar || !content || !toggleBtn) return;

        if (localStorage.getItem('sidebarCollapsed') === 'true') {
            sidebar.style.transition = 'none';
            content.style.transition = 'none';
            sidebar.classList.add('collapsed');
            content.classList.add('collapsed');
            setTimeout(() => {
                sidebar.style.transition = '';
                content.style.transition = '';
            }, 10);
        }

        const closeAllSubmenus = () => {
            document.querySelectorAll('.menu-links > li.open').forEach(li => {
                li.classList.remove('open');
            });
        };

        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const isCollapsing = !sidebar.classList.contains('collapsed');
            if (isCollapsing) {
                closeAllSubmenus();
            }
            sidebar.classList.toggle('collapsed');
            content.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        });

        submenuToggles.forEach(toggle => {
            toggle.addEventListener('click', e => {
                e.preventDefault();
                const parentLi = toggle.parentElement;
                const wasOpen = parentLi.classList.contains('open');

                if (sidebar.classList.contains('collapsed')) {
                    sidebar.classList.remove('collapsed');
                    content.classList.remove('collapsed');
                    localStorage.setItem('sidebarCollapsed', 'false');
                    setTimeout(() => {
                        closeAllSubmenus();
                        parentLi.classList.add('open');
                    }, 100);
                    return;
                }

                closeAllSubmenus();
                if (!wasOpen) {
                    parentLi.classList.add('open');
                }
            });
        });
    }

    /**
     * =================================================================
     * MÓDULO DE NOTIFICAÇÕES (TOASTS)
     * =================================================================
     */
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    function showToast(message, type = 'info') {
        const icons = {
            success: '<i class="fas fa-circle-check"></i>',
            error: '<i class="fas fa-triangle-exclamation"></i>',
            warning: '<i class="fas fa-circle-exclamation"></i>',
            info: '<i class="fas fa-circle-info"></i>'
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `${icons[type] || icons.info} <span>${message}</span>`;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 50);

        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => {
                if (toast.parentElement) {
                    toastContainer.removeChild(toast);
                }
            });
        }, 4000);
    }

    /**
     * =================================================================
     * MODAIS E DIÁLOGOS
     * =================================================================
     */
    const openModal = () => {
        if (modal) modal.style.display = 'flex';
    };

    const closeModal = () => {
        if (modal) modal.style.display = 'none';
    };

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);
    
    // Fechar ao clicar no backdrop ou pressionar ESC
    window.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('modal-backdrop')) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
            closeModal();
        }
    });

    /**
     * =================================================================
     * API HELPER
     * =================================================================
     */
    const api = async (endpoint, method = 'GET', body = null) => {
        const options = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) options.body = JSON.stringify(body);
        const response = await fetch(endpoint, options);
        if (!response.ok) {
            let errorMessage;
            try {
                const errorBody = await response.json();
                errorMessage = errorBody.erro || errorBody.mensagem || JSON.stringify(errorBody);
            } catch (e) {
                errorMessage = await response.text();
            }
            throw new Error(errorMessage || `Erro de requisição (${response.status})`);
        }
        return response.json();
    };

    const showLoading = (message = 'Carregando dados...') => {
        pageContent.innerHTML = `
            <div class="loader-container">
                <div class="loader"></div>
                <p>${message}</p>
            </div>
        `;
    };

    const renderError = (error) => {
        const errorMessage = error.message || 'Ocorreu um erro inesperado.';
        pageContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon" style="color: var(--color-danger); background-color: var(--color-danger-light);">
                    <i class="fas fa-triangle-exclamation"></i>
                </div>
                <h3>Falha ao carregar conteúdo</h3>
                <p>${errorMessage}</p>
                <button class="btn btn-primary" onclick="window.location.reload()">
                    <i class="fas fa-rotate"></i> Recarregar Página
                </button>
            </div>
        `;
        showToast(`Erro: ${errorMessage}`, 'error');
    };

    /**
     * Helper para obter caminho do logotipo
     */
    function getLogoPath(type, isSupplier = false) {
        if (!type) return isSupplier ? '/assets/logos/default-supplier.svg' : '/assets/logos/default-erp.svg';
        const cleanType = type.toLowerCase().trim();
        if (cleanType === 'bling') return '/assets/logos/bling.svg';
        if (cleanType === 'cisspoder' || cleanType === 'ciss') return '/assets/logos/cisspoder.jpg';
        if (cleanType.includes('dismatal')) return '/assets/logos/dismatal.jpg';
        return isSupplier ? '/assets/logos/default-supplier.svg' : '/assets/logos/default-erp.svg';
    }

    /**
     * Helper para formatar badge de status
     */
    function formatStatusBadge(status = 'disconnected') {
        const normalized = status.toLowerCase();
        let label = status;
        let className = 'status-disconnected';

        if (normalized === 'connected' || normalized === 'conectado' || normalized === 'ativo') {
            label = 'Conectado';
            className = 'status-connected';
        } else if (normalized === 'requires_auth' || normalized === 'autenticar') {
            label = 'Requer Login';
            className = 'status-requires_auth';
        } else if (normalized === 'pending' || normalized === 'pendente') {
            label = 'Pendente';
            className = 'status-pending';
        } else if (normalized === 'error' || normalized === 'erro') {
            label = 'Erro';
            className = 'status-error';
        } else {
            label = 'Desconectado';
            className = 'status-disconnected';
        }

        return `<span class="status-pill ${className}"><span class="status-dot"></span> ${label}</span>`;
    }

    /**
     * =================================================================
     * GERADORES DE FORMULÁRIOS
     * =================================================================
     */
    function createFormGroup(labelText, inputElement, helperText = '') {
        const group = document.createElement('div');
        group.className = 'form-group';
        
        const label = document.createElement('label');
        label.textContent = labelText;
        group.appendChild(label);
        
        group.appendChild(inputElement);
        
        if (helperText) {
            const helper = document.createElement('small');
            helper.className = 'form-helper';
            helper.style.color = 'var(--color-text-offset)';
            helper.style.fontSize = '0.78rem';
            helper.style.marginTop = '0.25rem';
            helper.textContent = helperText;
            group.appendChild(helper);
        }
        return group;
    }

    const generateErpForm = (conn = {}) => {
        const creds = conn.credentials || {};
        const fragment = document.createDocumentFragment();

        // ID Oculto
        const idInput = document.createElement('input');
        idInput.type = 'hidden';
        idInput.name = 'id';
        idInput.value = conn.id || '';
        fragment.appendChild(idInput);

        // Campo Nome
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.id = 'name';
        nameInput.name = 'name';
        nameInput.className = 'form-control';
        nameInput.placeholder = 'Ex: Minha Loja Bling Matriz';
        nameInput.value = conn.name || '';
        nameInput.required = true;
        fragment.appendChild(createFormGroup('Nome da Conexão', nameInput));

        // Campo Tipo
        const typeSelect = document.createElement('select');
        typeSelect.id = 'type';
        typeSelect.name = 'type';
        typeSelect.className = 'form-control';
        typeSelect.required = true;
        typeSelect.innerHTML = `
            <option value="" ${!conn.type ? 'selected' : ''}>Selecione o sistema ERP...</option>
            <option value="bling" ${conn.type === 'bling' ? 'selected' : ''}>Bling ERP (OAuth 2.0)</option>
            <option value="cisspoder" ${conn.type === 'cisspoder' ? 'selected' : ''}>CissPoder ERP</option>
        `;
        fragment.appendChild(createFormGroup('Tipo de ERP', typeSelect));

        // Container dinâmico para credenciais
        const credsContainer = document.createElement('div');
        credsContainer.id = 'erp-credentials-fields';
        credsContainer.style.marginTop = '0.5rem';
        fragment.appendChild(credsContainer);

        const renderCredentialFields = (type) => {
            credsContainer.innerHTML = '';
            if (type === 'bling') {
                const clientIdInput = document.createElement('input');
                clientIdInput.type = 'text';
                clientIdInput.id = 'client_id';
                clientIdInput.name = 'client_id';
                clientIdInput.className = 'form-control';
                clientIdInput.placeholder = 'Client ID da API Bling v3';
                clientIdInput.value = creds.client_id || '';
                clientIdInput.required = true;
                credsContainer.appendChild(createFormGroup('Client ID (Bling)', clientIdInput));

                const clientSecretInput = document.createElement('input');
                clientSecretInput.type = 'password';
                clientSecretInput.id = 'client_secret';
                clientSecretInput.name = 'client_secret';
                clientSecretInput.className = 'form-control';
                clientSecretInput.placeholder = 'Client Secret da API Bling v3';
                clientSecretInput.value = creds.client_secret || '';
                clientSecretInput.required = true;
                credsContainer.appendChild(createFormGroup('Client Secret (Bling)', clientSecretInput));

                const redirectUriInput = document.createElement('input');
                redirectUriInput.type = 'text';
                redirectUriInput.id = 'redirect_uri';
                redirectUriInput.name = 'redirect_uri';
                redirectUriInput.className = 'form-control';
                redirectUriInput.placeholder = 'Ex: http://localhost:3000/api/callback';
                redirectUriInput.value = creds.redirect_uri || (window.location.origin + '/api/callback');
                redirectUriInput.required = true;
                credsContainer.appendChild(createFormGroup('URI de Redirecionamento Callback', redirectUriInput));
            } else if (type === 'cisspoder') {
                const authUrlInput = document.createElement('input');
                authUrlInput.type = 'text';
                authUrlInput.id = 'auth_url';
                authUrlInput.name = 'auth_url';
                authUrlInput.className = 'form-control';
                authUrlInput.placeholder = 'Ex: https://api.ciss.com.br';
                authUrlInput.value = creds.auth_url || '';
                authUrlInput.required = true;
                credsContainer.appendChild(createFormGroup('URL da API / Servidor', authUrlInput));

                const userInput = document.createElement('input');
                userInput.type = 'text';
                userInput.id = 'username';
                userInput.name = 'username';
                userInput.className = 'form-control';
                userInput.placeholder = 'Usuário de acesso';
                userInput.value = creds.username || '';
                userInput.required = true;
                credsContainer.appendChild(createFormGroup('Usuário', userInput));

                const passInput = document.createElement('input');
                passInput.type = 'password';
                passInput.id = 'password';
                passInput.name = 'password';
                passInput.className = 'form-control';
                passInput.placeholder = 'Senha de acesso';
                passInput.value = creds.password || '';
                passInput.required = true;
                credsContainer.appendChild(createFormGroup('Senha', passInput));
            }
        };

        typeSelect.addEventListener('change', () => renderCredentialFields(typeSelect.value));
        if (conn.type) {
            renderCredentialFields(conn.type);
        }

        return fragment;
    };

    const setupJsonValidation = () => {
        const credentialsTextarea = document.getElementById('credentials');
        if (!credentialsTextarea) return;

        const validate = () => {
            const val = credentialsTextarea.value.trim();
            if (!val) {
                credentialsTextarea.classList.remove('valid', 'invalid');
                if (modalSaveBtn) modalSaveBtn.disabled = true;
                return;
            }
            try {
                JSON.parse(val);
                credentialsTextarea.classList.add('valid');
                credentialsTextarea.classList.remove('invalid');
                if (modalSaveBtn) modalSaveBtn.disabled = false;
            } catch (e) {
                credentialsTextarea.classList.add('invalid');
                credentialsTextarea.classList.remove('valid');
                if (modalSaveBtn) modalSaveBtn.disabled = true;
            }
        };

        credentialsTextarea.addEventListener('input', validate);
        validate();
    };

    const generateSupplierForm = (conn = {}) => {
        const creds = conn.credentials || {};
        const fragment = document.createDocumentFragment();

        // ID Oculto
        const idInput = document.createElement('input');
        idInput.type = 'hidden';
        idInput.name = 'id';
        idInput.value = conn.id || '';
        fragment.appendChild(idInput);

        // Campo Nome
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.id = 'name';
        nameInput.name = 'name';
        nameInput.className = 'form-control';
        nameInput.placeholder = 'Ex: Dismatal Distribuidora';
        nameInput.value = conn.name || 'Dismatal';
        nameInput.required = true;
        fragment.appendChild(createFormGroup('Nome do Fornecedor', nameInput));

        // Campo Tipo
        const typeSelect = document.createElement('select');
        typeSelect.id = 'type';
        typeSelect.name = 'type';
        typeSelect.className = 'form-control';
        typeSelect.required = true;
        typeSelect.innerHTML = `
            <option value="dismatal_webscraper" selected>Dismatal (Web Scraper Automatizado)</option>
        `;
        fragment.appendChild(createFormGroup('Tipo de Integração', typeSelect));

        // Campos de Credenciais
        const urlInput = document.createElement('input');
        urlInput.type = 'text';
        urlInput.id = 'supplier_url';
        urlInput.name = 'supplier_url';
        urlInput.className = 'form-control';
        urlInput.placeholder = 'https://www.dismatal.com.br';
        urlInput.value = creds.url || 'https://www.dismatal.com.br';
        urlInput.required = true;
        fragment.appendChild(createFormGroup('URL do Portal', urlInput));

        const userInput = document.createElement('input');
        userInput.type = 'text';
        userInput.id = 'supplier_username';
        userInput.name = 'supplier_username';
        userInput.className = 'form-control';
        userInput.placeholder = 'Seu CNPJ ou usuário de acesso';
        userInput.value = creds.username || '';
        userInput.required = true;
        fragment.appendChild(createFormGroup('Usuário (CNPJ)', userInput));

        const passInput = document.createElement('input');
        passInput.type = 'password';
        passInput.id = 'supplier_password';
        passInput.name = 'supplier_password';
        passInput.className = 'form-control';
        passInput.placeholder = 'Sua senha de acesso';
        passInput.value = creds.password || '';
        passInput.required = true;
        fragment.appendChild(createFormGroup('Senha', passInput));

        return fragment;
    };

    /**
     * =================================================================
     * 1. DASHBOARD / HOME PAGE
     * =================================================================
     */
    const renderWelcomePage = async () => {
        mainTitle.textContent = 'Dashboard Integrador';
        if (mainSubtitle) mainSubtitle.textContent = 'Visão geral das integrações ativas, catálogo de produtos e atalhos rápidos';
        headerActions.innerHTML = `
            <button class="btn btn-primary" data-action="add-erp">
                <i class="fas fa-plus"></i> Novo ERP
            </button>
            <button class="btn btn-secondary" data-action="add-supplier">
                <i class="fas fa-truck-ramp-box"></i> Novo Fornecedor
            </button>
        `;

        showLoading('Carregando métricas e conexões...');

        try {
            const [erpRes, supRes] = await Promise.all([
                api('/api/erp-connections').catch(() => ({ connections: [] })),
                api('/api/supplier-connections').catch(() => ({ connections: [] }))
            ]);

            const erpConnections = erpRes.connections || [];
            const supplierConnections = supRes.connections || [];

            const connectedErps = erpConnections.filter(c => c.status === 'connected').length;
            const connectedSups = supplierConnections.length; // Suppliers with session data or configured

            let html = `
                <!-- Hero Banner -->
                <div class="dashboard-hero">
                    <div class="hero-content">
                        <span class="hero-badge"><i class="fas fa-circle-nodes"></i> Hub Central de Integrações</span>
                        <h2 class="hero-title">Bem-vindo ao Integrador ERP</h2>
                        <p class="hero-description">
                            Conecte e sincronize dados entre sistemas ERP e distribuidores em tempo real.
                        </p>
                        <div class="hero-actions">
                            <button class="btn btn-primary" data-action="nav-goto-products">
                                <i class="fas fa-boxes-stacked"></i> Consultar Catálogo
                            </button>
                            <button class="btn btn-secondary" data-action="nav-goto-erp">
                                <i class="fas fa-server"></i> Gerenciar ERPs
                            </button>
                        </div>
                    </div>
                    <div class="hero-visual">
                        <i class="fas fa-network-wired"></i>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon-wrapper stat-icon-blue">
                            <i class="fas fa-server"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value">${erpConnections.length}</span>
                            <span class="stat-label">Conexões ERP Cadastradas</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon-wrapper stat-icon-green">
                            <i class="fas fa-circle-check"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value">${connectedErps}</span>
                            <span class="stat-label">ERPs Conectados e Ativos</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon-wrapper stat-icon-amber">
                            <i class="fas fa-truck-fast"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value">${supplierConnections.length}</span>
                            <span class="stat-label">Fornecedores Integrados</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon-wrapper stat-icon-purple">
                            <i class="fas fa-bolt"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value">${erpConnections.length + supplierConnections.length}</span>
                            <span class="stat-label">Total de Pontos de Integração</span>
                        </div>
                    </div>
                </div>

                <!-- Seção 1: Conexões ERP -->
                <div class="dashboard-section">
                    <div class="section-header">
                        <h3 class="section-title"><i class="fas fa-server"></i> Sistemas ERP Integrados</h3>
                        <a href="#" class="section-link" data-action="nav-goto-erp">Ver todos <i class="fas fa-arrow-right"></i></a>
                    </div>
            `;

            if (erpConnections.length === 0) {
                html += `
                    <div class="empty-state">
                        <div class="empty-state-icon"><i class="fas fa-server"></i></div>
                        <h3>Nenhum ERP configurado</h3>
                        <p>Adicione sua primeira conexão com Bling ou CissPoder para sincronizar produtos e estoque.</p>
                        <button class="btn btn-primary" data-action="add-erp">
                            <i class="fas fa-plus"></i> Adicionar Conexão ERP
                        </button>
                    </div>
                `;
            } else {
                html += '<div class="connections-grid">';
                erpConnections.slice(0, 3).forEach(conn => {
                    const logoUrl = getLogoPath(conn.type, false);
                    html += `
                        <div class="connection-card">
                            <div class="card-header">
                                <div class="logo-container">
                                    <img src="${logoUrl}" alt="${conn.name}" class="brand-logo-img" onerror="this.src='/assets/logos/default-erp.svg'">
                                </div>
                                ${formatStatusBadge(conn.status)}
                            </div>
                            <div class="card-body">
                                <div class="card-title-row">
                                    <h4 class="card-title">${conn.name}</h4>
                                    <span class="type-tag">${conn.type || 'ERP'}</span>
                                </div>
                                <ul class="card-details-list">
                                    <li class="card-details-item">
                                        <span class="detail-label">ID Conexão:</span>
                                        <span class="detail-val">#${conn.id}</span>
                                    </li>
                                    <li class="card-details-item">
                                        <span class="detail-label">Tipo:</span>
                                        <span class="detail-val">${(conn.type || '').toUpperCase()}</span>
                                    </li>
                                </ul>
                            </div>
                            <div class="card-footer">
                                <div class="card-footer-actions-left">
                                    <button class="btn btn-small btn-primary" data-action="view-erp-products" data-id="${conn.id}">
                                        <i class="fas fa-boxes-stacked"></i> Ver Produtos
                                    </button>
                                </div>
                                <div class="card-footer-actions-right">
                                    <button class="card-action-btn" data-action="edit-erp" data-id="${conn.id}" data-tooltip="Editar">
                                        <i class="fas fa-pencil"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                });
                html += '</div>';
            }

            html += `
                </div>

                <!-- Seção 2: Conexões de Fornecedores -->
                <div class="dashboard-section">
                    <div class="section-header">
                        <h3 class="section-title"><i class="fas fa-truck-fast"></i> Fornecedores e Distribuidores</h3>
                        <a href="#" class="section-link" data-action="nav-goto-supplier">Ver todos <i class="fas fa-arrow-right"></i></a>
                    </div>
            `;

            if (supplierConnections.length === 0) {
                html += `
                    <div class="empty-state">
                        <div class="empty-state-icon" style="color: var(--color-warning); background-color: var(--color-warning-light);">
                            <i class="fas fa-truck-fast"></i>
                        </div>
                        <h3>Nenhum fornecedor cadastrado</h3>
                        <p>Configure a conexão com a Dismatal para buscar preços e estoque de autopeças via scraper automatizado.</p>
                        <button class="btn btn-warning" data-action="add-supplier">
                            <i class="fas fa-plus"></i> Adicionar Fornecedor
                        </button>
                    </div>
                `;
            } else {
                html += '<div class="connections-grid">';
                supplierConnections.slice(0, 3).forEach(conn => {
                    const logoUrl = getLogoPath(conn.type, true);
                    html += `
                        <div class="connection-card">
                            <div class="card-header">
                                <div class="logo-container">
                                    <img src="${logoUrl}" alt="${conn.name}" class="brand-logo-img" onerror="this.src='/assets/logos/default-supplier.svg'">
                                </div>
                                <span class="status-pill status-connected"><span class="status-dot"></span> Ativo</span>
                            </div>
                            <div class="card-body">
                                <div class="card-title-row">
                                    <h4 class="card-title">${conn.name}</h4>
                                    <span class="type-tag">${(conn.type || 'Scraper').replace(/_/g, ' ')}</span>
                                </div>
                                <ul class="card-details-list">
                                    <li class="card-details-item">
                                        <span class="detail-label">ID Fornecedor:</span>
                                        <span class="detail-val">#${conn.id}</span>
                                    </li>
                                    <li class="card-details-item">
                                        <span class="detail-label">Módulo:</span>
                                        <span class="detail-val">Web Scraper</span>
                                    </li>
                                </ul>
                            </div>
                            <div class="card-footer">
                                <div class="card-footer-actions-left">
                                    <button class="btn btn-small btn-info" data-action="test-supplier" data-id="${conn.id}" title="Validar Sessão">
                                        <i class="fas fa-shield-halved"></i> Validar
                                    </button>
                                    <button class="btn btn-small btn-secondary" data-action="test-scraper-link" data-id="${conn.id}" title="Testar busca no Scraper">
                                        <i class="fas fa-vial"></i> Testar Scraper
                                    </button>
                                </div>
                                <div class="card-footer-actions-right">
                                    <button class="card-action-btn" data-action="edit-supplier" data-id="${conn.id}" data-tooltip="Editar">
                                        <i class="fas fa-pencil"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                });
                html += '</div>';
            }

            html += '</div>';

            pageContent.innerHTML = html;
        } catch (error) {
            renderError(error);
        }
    };

    /**
     * =================================================================
     * 2. CONEXÕES ERP (LISTAGEM E CARDS COM LOGOTIPOS)
     * =================================================================
     */
    const renderErpConnections = async () => {
        mainTitle.textContent = 'Conexões ERP';
        if (mainSubtitle) mainSubtitle.textContent = 'Gerencie e monitore suas credenciais e status de autenticação com sistemas ERP';
        headerActions.innerHTML = `
            <button class="btn btn-primary" data-action="add-erp">
                <i class="fas fa-plus"></i> Adicionar Conexão ERP
            </button>
        `;

        showLoading('Buscando conexões ERP...');

        try {
            const { connections } = await api('/api/erp-connections');

            if (!connections || connections.length === 0) {
                pageContent.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon"><i class="fas fa-server"></i></div>
                        <h3>Nenhuma conexão ERP configurada</h3>
                        <p>Integre seu sistema ERP Bling ou CissPoder para realizar consultas de produtos, saldo em estoque e valores em tempo real.</p>
                        <button class="btn btn-primary" data-action="add-erp">
                            <i class="fas fa-plus"></i> Adicionar Conexão ERP
                        </button>
                    </div>
                `;
                return;
            }

            let cardsHtml = '<div class="connections-grid">';
            connections.forEach(conn => {
                const logoUrl = getLogoPath(conn.type, false);
                const isBling = conn.type === 'bling';
                const isConnected = conn.status === 'connected';

                cardsHtml += `
                    <div class="connection-card" data-conn-id="${conn.id}">
                        <div class="card-header">
                            <div class="logo-container" title="Logo ${conn.type}">
                                <img src="${logoUrl}" alt="${conn.name}" class="brand-logo-img" onerror="this.src='/assets/logos/default-erp.svg'">
                            </div>
                            ${formatStatusBadge(conn.status)}
                        </div>
                        <div class="card-body">
                            <div class="card-title-row">
                                <h3 class="card-title">${conn.name}</h3>
                                <span class="type-tag">${(conn.type || 'ERP').toUpperCase()}</span>
                            </div>
                            <ul class="card-details-list">
                                <li class="card-details-item">
                                    <span class="detail-label">Identificador:</span>
                                    <span class="detail-val">#${conn.id}</span>
                                </li>
                                <li class="card-details-item">
                                    <span class="detail-label">Autenticação:</span>
                                    <span class="detail-val">${isBling ? 'OAuth 2.0' : 'Usuário / Senha'}</span>
                                </li>
                                ${conn.credentials?.client_id ? `
                                <li class="card-details-item">
                                    <span class="detail-label">Client ID:</span>
                                    <span class="detail-val">${conn.credentials.client_id.substring(0, 10)}...</span>
                                </li>` : ''}
                                ${conn.credentials?.auth_url ? `
                                <li class="card-details-item">
                                    <span class="detail-label">Servidor:</span>
                                    <span class="detail-val">${conn.credentials.auth_url.replace(/^https?:\/\//, '').substring(0, 18)}...</span>
                                </li>` : ''}
                            </ul>
                        </div>
                        <div class="card-footer">
                            <div class="card-footer-actions-left">
                                ${isBling ? `
                                    <button class="btn btn-small ${isConnected ? 'btn-secondary' : 'btn-success'}" data-action="auth-bling" data-id="${conn.id}" title="Autenticar ou re-autorizar via OAuth Bling">
                                        <i class="fas fa-key"></i> ${isConnected ? 'Reautenticar' : 'Conectar Bling'}
                                    </button>
                                ` : ''}
                                <button class="btn btn-small btn-primary" data-action="view-erp-products" data-id="${conn.id}" title="Buscar produtos neste ERP">
                                    <i class="fas fa-boxes-stacked"></i> Produtos
                                </button>
                            </div>
                            <div class="card-footer-actions-right">
                                <button class="card-action-btn" data-action="edit-erp" data-id="${conn.id}" data-tooltip="Editar Conexão">
                                    <i class="fas fa-pencil"></i>
                                </button>
                                <button class="card-action-btn danger" data-action="remove-erp" data-id="${conn.id}" data-tooltip="Excluir Conexão">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
            cardsHtml += '</div>';

            pageContent.innerHTML = cardsHtml;
        } catch (error) {
            renderError(error);
        }
    };

    /**
     * =================================================================
     * 3. CONEXÕES DE FORNECEDORES (LISTAGEM E CARDS COM LOGOTIPOS)
     * =================================================================
     */
    const renderSupplierConnections = async () => {
        mainTitle.textContent = 'Conexões de Fornecedores';
        if (mainSubtitle) mainSubtitle.textContent = 'Gerencie raspadores e integrações automatizadas para consulta a catálogos e estoques de fornecedores';
        headerActions.innerHTML = `
            <button class="btn btn-primary" data-action="add-supplier">
                <i class="fas fa-plus"></i> Adicionar Fornecedor
            </button>
        `;

        showLoading('Buscando fornecedores...');

        try {
            const { connections } = await api('/api/supplier-connections');

            if (!connections || connections.length === 0) {
                pageContent.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon" style="color: var(--color-warning); background-color: var(--color-warning-light);">
                            <i class="fas fa-truck-ramp-box"></i>
                        </div>
                        <h3>Nenhum fornecedor cadastrado</h3>
                        <p>Adicione fornecedores como a Dismatal para automatizar a consulta de preços e peças de reposição através de robôs de coleta.</p>
                        <button class="btn btn-primary" data-action="add-supplier">
                            <i class="fas fa-plus"></i> Adicionar Fornecedor
                        </button>
                    </div>
                `;
                return;
            }

            let cardsHtml = '<div class="connections-grid">';
            connections.forEach(conn => {
                const logoUrl = getLogoPath(conn.type, true);
                const hasSession = !!conn.cookies || !!conn.session_data;

                cardsHtml += `
                    <div class="connection-card" data-conn-id="${conn.id}">
                        <div class="card-header">
                            <div class="logo-container" title="Logo ${conn.name}">
                                <img src="${logoUrl}" alt="${conn.name}" class="brand-logo-img" onerror="this.src='/assets/logos/default-supplier.svg'">
                            </div>
                            ${hasSession 
                                ? '<span class="status-pill status-connected"><span class="status-dot"></span> Sessão Ativa</span>' 
                                : '<span class="status-pill status-requires_auth"><span class="status-dot"></span> Requer Login</span>'}
                        </div>
                        <div class="card-body">
                            <div class="card-title-row">
                                <h3 class="card-title">${conn.name}</h3>
                                <span class="type-tag">${(conn.type || 'Scraper').replace(/_/g, ' ')}</span>
                            </div>
                            <ul class="card-details-list">
                                <li class="card-details-item">
                                    <span class="detail-label">Identificador:</span>
                                    <span class="detail-val">#${conn.id}</span>
                                </li>
                                <li class="card-details-item">
                                    <span class="detail-label">Mecanismo:</span>
                                    <span class="detail-val">Puppeteer Scraper</span>
                                </li>
                                <li class="card-details-item">
                                    <span class="detail-label">Fila de Tarefas:</span>
                                    <span class="detail-val">Ativa</span>
                                </li>
                            </ul>
                        </div>
                        <div class="card-footer">
                            <div class="card-footer-actions-left">
                                <!-- <button class="btn btn-small btn-info" data-action="test-supplier" data-id="${conn.id}" title="Verificar se a sessão salva ainda é válida">
                                    <i class="fas fa-shield-halved"></i> Validar
                                </button>
                                <button class="btn btn-small btn-warning" data-action="auth-supplier" data-id="${conn.id}" title="Forçar novo login para renovar os cookies de sessão">
                                    <i class="fas fa-rotate"></i> Renovar
                                </button> -->
                                <button class="btn btn-small btn-secondary" data-action="test-scraper-link" data-id="${conn.id}" title="Abrir interface de teste do raspador">
                                    <i class="fas fa-vial"></i> Testar
                                </button>
                            </div>
                            <div class="card-footer-actions-right">
                                <button class="card-action-btn" data-action="edit-supplier" data-id="${conn.id}" data-tooltip="Editar Fornecedor">
                                    <i class="fas fa-pencil"></i>
                                </button>
                                <button class="card-action-btn danger" data-action="remove-supplier" data-id="${conn.id}" data-tooltip="Excluir Fornecedor">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
            cardsHtml += '</div>';

            pageContent.innerHTML = cardsHtml;
        } catch (error) {
            renderError(error);
        }
    };

    /**
     * =================================================================
     * 4. PÁGINA DE PRODUTOS & BUSCA
     * =================================================================
     */
    const renderProductsPage = async (preselectedConnectionId = null) => {
        mainTitle.textContent = 'Catálogo de Produtos';
        if (mainSubtitle) mainSubtitle.textContent = 'Consulte produtos, estoque e preços em tempo real diretamente do ERP selecionado';
        headerActions.innerHTML = '';

        showLoading('Carregando conexões disponíveis...');

        try {
            const { connections } = await api('/api/erp-connections');

            if (!connections || connections.length === 0) {
                pageContent.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon"><i class="fas fa-boxes-stacked"></i></div>
                        <h3>Nenhum ERP conectado</h3>
                        <p>Para pesquisar produtos no catálogo, é necessário cadastrar e conectar pelo menos um sistema ERP.</p>
                        <button class="btn btn-primary" data-action="add-erp">
                            <i class="fas fa-plus"></i> Adicionar Conexão ERP
                        </button>
                    </div>
                `;
                return;
            }

            const optionsHtml = connections
                .map(c => {
                    const isSelected = preselectedConnectionId 
                        ? String(c.id) === String(preselectedConnectionId) 
                        : (c.status === 'connected');
                    return `<option value="${c.id}" ${isSelected ? 'selected' : ''}>${c.name} (${c.type.toUpperCase()}) - ${c.status === 'connected' ? '🟢 Conectado' : '🟠 ' + c.status}</option>`;
                })
                .join('');

            pageContent.innerHTML = `
                <div class="search-filter-card">
                    <form id="erp-product-search">
                        <div class="filter-form-grid">
                            <div class="form-group">
                                <label for="erp-connection-select"><i class="fas fa-server"></i> Selecionar ERP</label>
                                <select id="erp-connection-select" name="erp-connection" class="form-control" required>
                                    ${optionsHtml}
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="product-search-term"><i class="fas fa-magnifying-glass"></i> Termo de Busca (Nome ou SKU)</label>
                                <input type="search" id="product-search-term" name="searchTerm" class="form-control" placeholder="Ex: Cabo, Filtro, 102030..." required>
                            </div>
                            <div class="form-group">
                                <button type="submit" class="btn btn-primary" id="product-search-btn" style="height: 42px;">
                                    <i class="fas fa-search"></i> Buscar Produtos
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                <div id="product-results" class="results-container">
                    <div class="empty-state">
                        <div class="empty-state-icon" style="color: var(--color-primary); background-color: var(--color-primary-light);">
                            <i class="fas fa-barcode"></i>
                        </div>
                        <h3>Pronto para pesquisar</h3>
                        <p>Digite o nome ou código SKU do produto acima e clique em <strong>Buscar Produtos</strong>.</p>
                    </div>
                </div>
            `;

            const searchForm = document.getElementById('erp-product-search');
            const resultsContainer = document.getElementById('product-results');

            const renderPagination = (pagination, onPageClick) => {
                if (!pagination || pagination.totalPages <= 1) return null;

                const { currentPage, totalPages } = pagination;
                let pagesHtml = '';

                pagesHtml += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                    <a href="#" class="page-link" data-page="${currentPage - 1}" title="Página Anterior"><i class="fas fa-chevron-left"></i></a>
                </li>`;

                const pagesToShow = [];
                pagesToShow.push(1);
                if (currentPage > 3) pagesToShow.push('...');
                for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                    pagesToShow.push(i);
                }
                if (currentPage < totalPages - 2) pagesToShow.push('...');
                if (totalPages > 1) pagesToShow.push(totalPages);

                const uniquePages = [...new Set(pagesToShow)];
                uniquePages.forEach(page => {
                    if (page === '...') {
                        pagesHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
                    } else {
                        pagesHtml += `<li class="page-item ${page === currentPage ? 'active' : ''}">
                            <a href="#" class="page-link" data-page="${page}">${page}</a>
                        </li>`;
                    }
                });

                pagesHtml += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                    <a href="#" class="page-link" data-page="${currentPage + 1}" title="Próxima Página"><i class="fas fa-chevron-right"></i></a>
                </li>`;

                const paginationContainer = document.createElement('div');
                paginationContainer.className = 'pagination-container';
                paginationContainer.innerHTML = `<ul class="pagination">${pagesHtml}</ul>`;

                paginationContainer.querySelectorAll('a.page-link').forEach(link => {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        if (link.parentElement.classList.contains('disabled')) return;
                        const pageNum = parseInt(link.dataset.page, 10);
                        onPageClick(pageNum);
                    });
                });

                return paginationContainer;
            };

            const executeProductSearch = async (page = 1) => {
                const searchButton = document.getElementById('product-search-btn');
                const connectionId = document.getElementById('erp-connection-select').value;
                const searchTerm = document.getElementById('product-search-term').value.trim();

                if (!searchTerm) {
                    showToast('Por favor, informe um termo para buscar.', 'warning');
                    return;
                }

                if (searchButton) {
                    searchButton.classList.add('loading');
                    searchButton.disabled = true;
                }

                resultsContainer.innerHTML = `
                    <div class="loader-container">
                        <div class="loader"></div>
                        <p>Consultando produtos no ERP...</p>
                    </div>
                `;

                try {
                    const { products, pagination } = await api(`/api/erp-connections/${connectionId}/products`, 'POST', { searchTerm, page });

                    if (!products || products.length === 0) {
                        resultsContainer.innerHTML = `
                            <div class="empty-state">
                                <div class="empty-state-icon" style="color: var(--color-warning); background-color: var(--color-warning-light);">
                                    <i class="fas fa-box-open"></i>
                                </div>
                                <h3>Nenhum produto localizado</h3>
                                <p>Não encontramos produtos com o termo "<strong>${searchTerm}</strong>" nesta conexão.</p>
                            </div>
                        `;
                        return;
                    }

                    const rowsHtml = products.map(p => {
                        const price = (typeof p.price === 'number') ? `R$ ${p.price.toFixed(2)}` : (p.price || 'N/D');
                        const stock = p.stock !== null && p.stock !== undefined ? p.stock : 'N/D';
                        const inStock = typeof stock === 'number' ? stock > 0 : true;

                        return `
                            <tr>
                                <td><span class="sku-badge">${p.sku || 'N/A'}</span></td>
                                <td><strong>${p.name || 'Sem nome'}</strong></td>
                                <td>
                                    <span class="stock-badge ${inStock ? 'in-stock' : 'out-of-stock'}">
                                        <i class="fas ${inStock ? 'fa-check' : 'fa-xmark'}"></i> ${stock} un.
                                    </span>
                                </td>
                                <td><span class="price-text">${price}</span></td>
                            </tr>
                        `;
                    }).join('');

                    resultsContainer.innerHTML = `
                        <div class="results-card">
                            <div class="table-responsive">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>SKU / Código</th>
                                            <th>Descrição do Produto</th>
                                            <th>Estoque Atual</th>
                                            <th>Preço de Venda</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${rowsHtml}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `;

                    const paginationControls = renderPagination(pagination, executeProductSearch);
                    if (paginationControls) {
                        resultsContainer.querySelector('.results-card').appendChild(paginationControls);
                    }

                    showToast(`${products.length} produtos carregados com sucesso!`, 'success');
                } catch (err) {
                    resultsContainer.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon" style="color: var(--color-danger); background-color: var(--color-danger-light);">
                                <i class="fas fa-triangle-exclamation"></i>
                            </div>
                            <h3>Erro na busca de produtos</h3>
                            <p>${err.message}</p>
                        </div>
                    `;
                    showToast(`Erro na busca: ${err.message}`, 'error');
                } finally {
                    if (searchButton) {
                        searchButton.classList.remove('loading');
                        searchButton.disabled = false;
                    }
                }
            };

            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                executeProductSearch(1);
            });

        } catch (error) {
            renderError(error);
        }
    };

    /**
     * =================================================================
     * DISPATCHER DE AÇÕES E BOTÕES (DELEGAÇÃO DE EVENTOS CENTRALIZADA)
     * =================================================================
     */
    document.addEventListener('click', async (e) => {
        const actionButton = e.target.closest('[data-action]');
        if (!actionButton) return;

        const { action, id } = actionButton.dataset;

        // 1. Navegação de atalhos rápidos
        if (action === 'nav-goto-products') {
            setActiveNavLink('nav-produtos');
            renderProductsPage();
            return;
        }
        if (action === 'nav-goto-erp') {
            setActiveNavLink('nav-conexoes-erp');
            renderErpConnections();
            return;
        }
        if (action === 'nav-goto-supplier') {
            setActiveNavLink('nav-conexoes-fornecedores');
            renderSupplierConnections();
            return;
        }

        // 2. Ver produtos de um ERP específico
        if (action === 'view-erp-products') {
            setActiveNavLink('nav-produtos');
            renderProductsPage(id);
            return;
        }

        // 3. Autenticação OAuth do Bling
        if (action === 'auth-bling') {
            actionButton.classList.add('loading');
            actionButton.disabled = true;
            try {
                const res = await api(`/api/auth/${id}/bling`);
                if (res.url) {
                    showToast('Redirecionando para o Bling para autorização...', 'info');
                    window.location.href = res.url;
                } else {
                    showToast('URL de autorização não retornada pelo servidor.', 'error');
                }
            } catch (authError) {
                showToast(`Falha ao iniciar OAuth: ${authError.message}`, 'error');
            } finally {
                actionButton.classList.remove('loading');
                actionButton.disabled = false;
            }
            return;
        }

        // 4. Ações de Fornecedor: Testar e Autenticar
        if (action === 'test-supplier' || action === 'auth-supplier') {
            actionButton.classList.add('loading');
            actionButton.disabled = true;

            const endpointAction = action === 'test-supplier' ? 'validate-authentication' : 'authenticate';
            try {
                const result = await api(`/api/supplier-connections/${id}/${endpointAction}`, 'POST');
                showToast(result.mensagem || 'Tarefa iniciada com sucesso!', 'success');
            } catch (error) {
                showToast(`Erro: ${error.message}`, 'error');
            } finally {
                actionButton.classList.remove('loading');
                actionButton.disabled = false;
            }
            return;
        }

        // 5. Testar Scraper em Nova Janela
        if (action === 'test-scraper-link') {
            window.open(`/api/supplier-connections/${id}/test-scraper`, '_blank');
            return;
        }

        // 6. Ações de CRUD (Adicionar, Editar, Remover)
        const isErp = action.includes('erp');
        const type = isErp ? 'erp' : 'supplier';
        const typeTitle = isErp ? 'ERP' : 'Fornecedor';
        const endpoint = isErp ? '/api/erp-connections' : '/api/supplier-connections';
        const renderFn = isErp ? renderErpConnections : renderSupplierConnections;

        try {
            // ADICIONAR
            if (action.startsWith('add')) {
                modalTitle.textContent = `Adicionar Conexão de ${typeTitle}`;
                modalSubtitle.textContent = `Configure os parâmetros de integração com o novo ${typeTitle}`;
                modalIconBadge.innerHTML = `<i class="fas ${isErp ? 'fa-server' : 'fa-truck-fast'}"></i>`;
                
                formFields.innerHTML = '';
                formFields.appendChild(isErp ? generateErpForm() : generateSupplierForm());
                openModal();

                modalForm.onsubmit = async (ev) => {
                    ev.preventDefault();
                    if (modalSaveBtn) {
                        modalSaveBtn.classList.add('loading');
                        modalSaveBtn.disabled = true;
                    }

                    try {
                        const formData = new FormData(modalForm);
                        const body = { name: formData.get('name'), type: formData.get('type'), credentials: {} };

                        if (isErp) {
                            const erpType = formData.get('type');
                            if (erpType === 'bling') {
                                body.credentials.client_id = formData.get('client_id');
                                body.credentials.client_secret = formData.get('client_secret');
                                body.credentials.redirect_uri = formData.get('redirect_uri');
                            } else if (erpType === 'cisspoder') {
                                body.credentials.auth_url = formData.get('auth_url');
                                body.credentials.username = formData.get('username');
                                body.credentials.password = formData.get('password');
                            }
                        } else {
                            // Monta o objeto de credenciais a partir dos campos individuais
                            body.credentials.url = formData.get('supplier_url');
                            body.credentials.username = formData.get('supplier_username');
                            body.credentials.password = formData.get('supplier_password');
                        }

                        await api(endpoint, 'POST', body);
                        showToast(`Conexão de ${typeTitle} adicionada com sucesso!`, 'success');
                        closeModal();
                        await renderFn();
                    } catch (formErr) {
                        showToast(`Erro ao salvar: ${formErr.message}`, 'error');
                    } finally {
                        if (modalSaveBtn) {
                            modalSaveBtn.classList.remove('loading');
                            modalSaveBtn.disabled = false;
                        }
                    }
                };
            }
            // EDITAR
            else if (action.startsWith('edit')) {
                const res = await api(`${endpoint}/${id}`);
                const connection = res.connection;
                if (!connection) throw new Error('Conexão não localizada no servidor.');

                modalTitle.textContent = `Editar Conexão de ${typeTitle}`;
                modalSubtitle.textContent = `Atualize os dados e credenciais para "${connection.name}"`;
                modalIconBadge.innerHTML = `<i class="fas fa-sliders"></i>`;

                formFields.innerHTML = '';
                formFields.appendChild(isErp ? generateErpForm(connection) : generateSupplierForm(connection));
                openModal();

                modalForm.onsubmit = async (ev) => {
                    ev.preventDefault();
                    if (modalSaveBtn) {
                        modalSaveBtn.classList.add('loading');
                        modalSaveBtn.disabled = true;
                    }

                    try {
                        const formData = new FormData(modalForm);
                        const body = { name: formData.get('name'), type: formData.get('type'), credentials: {} };

                        if (isErp) {
                            const erpType = formData.get('type');
                            if (erpType === 'bling') {
                                body.credentials.client_id = formData.get('client_id');
                                body.credentials.client_secret = formData.get('client_secret');
                                body.credentials.redirect_uri = formData.get('redirect_uri');
                            } else if (erpType === 'cisspoder') {
                                body.credentials.auth_url = formData.get('auth_url');
                                body.credentials.username = formData.get('username');
                                body.credentials.password = formData.get('password');
                            }
                        } else {
                            // Monta o objeto de credenciais a partir dos campos individuais
                            body.credentials.url = formData.get('supplier_url');
                            body.credentials.username = formData.get('supplier_username');
                            body.credentials.password = formData.get('supplier_password');
                        }

                        await api(`${endpoint}/${id}`, 'PUT', body);
                        showToast(`Conexão de ${typeTitle} atualizada com sucesso!`, 'success');
                        closeModal();
                        await renderFn();
                    } catch (formErr) {
                        showToast(`Erro ao atualizar: ${formErr.message}`, 'error');
                    } finally {
                        if (modalSaveBtn) {
                            modalSaveBtn.classList.remove('loading');
                            modalSaveBtn.disabled = false;
                        }
                    }
                };
            }
            // REMOVER
            else if (action.startsWith('remove')) {
                if (confirm(`Tem certeza que deseja remover esta conexão de ${typeTitle}?`)) {
                    await api(`${endpoint}/${id}`, 'DELETE');
                    showToast(`Conexão de ${typeTitle} removida com sucesso.`, 'info');
                    await renderFn();
                }
            }
        } catch (error) {
            showToast(`Erro: ${error.message}`, 'error');
        }
    });

    /**
     * =================================================================
     * ROTEAMENTO E CONTROLE DE NAVEGAÇÃO
     * =================================================================
     */
    function setActiveNavLink(navId) {
        document.querySelectorAll('.menu-links a').forEach(a => a.classList.remove('active'));
        const activeLink = document.getElementById(navId);
        if (activeLink) {
            activeLink.classList.add('active');
            const parentLi = activeLink.closest('.submenu')?.parentElement;
            if (parentLi) {
                parentLi.classList.add('open');
            }
        }
    }

    const routes = {
        'nav-dashboard': renderWelcomePage,
        'nav-produtos': renderProductsPage,
        'nav-conexoes-erp': renderErpConnections,
        'nav-conexoes-fornecedores': renderSupplierConnections,
    };

    document.querySelector('.menu-links').addEventListener('click', (e) => {
        const link = e.target.closest('a:not(.submenu-toggle)');
        if (!link || !link.id) return;

        e.preventDefault();
        setActiveNavLink(link.id);

        const routeHandler = routes[link.id];
        if (routeHandler) {
            routeHandler();
        } else {
            renderWelcomePage();
        }
    });

    if (brandLink) {
        brandLink.addEventListener('click', (e) => {
            e.preventDefault();
            setActiveNavLink('nav-dashboard');
            renderWelcomePage();
        });
    }

    // Inicialização da interface
    initializeThemeSwitcher();
    initializeSidebar();

    // Checar se veio de retorno OAuth do Bling
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autorizado') === 'true') {
        showToast('Bling autenticado com sucesso via OAuth!', 'success');
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Carregar tela inicial (Dashboard)
    renderWelcomePage();
});