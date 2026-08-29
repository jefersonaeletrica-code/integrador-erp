document.addEventListener('DOMContentLoaded', () => {
    /**
     * =================================================================
     * MÓDULO DE UI: Inicialização e Componentes Visuais
     * =================================================================
     */

    /**
     * Inicializa a lógica do seletor de tema (Dark Mode).
     * É seguro e só executa se o seletor existir na página.
     */
    function initializeThemeSwitcher() {
        const themeToggleButton = document.getElementById('theme-toggle-btn');
        if (!themeToggleButton) return;

        const sunIcon = themeToggleButton.querySelector('.sun-icon');
        const moonIcon = themeToggleButton.querySelector('.moon-icon');
        if (!sunIcon || !moonIcon) return;

        const currentTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

        function applyTheme(theme) {
            // Desativa transições para evitar "flash" no carregamento da página
            document.body.style.transition = 'none';

            if (theme === 'dark') {
                document.body.classList.add('dark-mode');
                sunIcon.style.display = 'block';
                moonIcon.style.display = 'none';
            } else {
                document.body.classList.remove('dark-mode');
                sunIcon.style.display = 'none';
                moonIcon.style.display = 'block';
            }

            // Reativa as transições após a aplicação do tema
            setTimeout(() => {
                document.body.style.transition = '';
            }, 10);
        }

        // Define o tema inicial
        const initialTheme = currentTheme || (prefersDark ? 'dark' : 'light');
        applyTheme(initialTheme);

        // Listener para o interruptor de tema
        themeToggleButton.addEventListener('click', () => {
            const isDarkMode = document.body.classList.contains('dark-mode');
            const newTheme = isDarkMode ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
    }

    /**
     * Inicializa a lógica da barra lateral (sidebar).
     * É seguro e só executa se os elementos da barra lateral existirem.
     */
    function initializeSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const content = document.querySelector('.content'); // Seleciona a área de conteúdo principal
        const toggleBtn = document.querySelector('.toggle-btn');
        const submenuToggles = document.querySelectorAll('.submenu-toggle');

        // Validação de segurança para garantir que os elementos essenciais existem.
        if (!sidebar || !content || !toggleBtn || !submenuToggles.length) return;

        // Restaura o estado do menu salvo no localStorage ao carregar a página.
        if (localStorage.getItem('sidebarCollapsed') === 'true') {
            sidebar.style.transition = 'none';
            sidebar.classList.add('collapsed');
            setTimeout(() => {
                sidebar.style.transition = '';
            }, 0);
            content.classList.add('collapsed'); // Sincroniza o estado do conteúdo
        }

        const closeAllSubmenus = () => {
            document.querySelectorAll('.menu-links > li.open').forEach(li => {
                li.classList.remove('open');
            });
        };

        // Evento para colapsar/expandir a barra lateral inteira.
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const isCollapsing = !sidebar.classList.contains('collapsed');
            // Se estiver colapsando, fecha todos os submenus para um estado limpo.
            if (isCollapsing) {
                closeAllSubmenus();
            }
            sidebar.classList.toggle('collapsed');
            content.classList.toggle('collapsed'); // Alterna a classe no conteúdo também
            // Salva o estado no localStorage para persistência.
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        });

        // Evento para abrir/fechar os submenus (comportamento de acordeão).
        submenuToggles.forEach(toggle => {
            toggle.addEventListener('click', e => {
                e.preventDefault();
                const parentLi = toggle.parentElement;
                const wasOpen = parentLi.classList.contains('open');

                // Se a barra lateral estiver colapsada, a primeira ação é expandi-la.
                if (sidebar.classList.contains('collapsed')) {
                    sidebar.classList.remove('collapsed');
                    content.classList.remove('collapsed'); // Sincroniza o conteúdo principal
                    localStorage.setItem('sidebarCollapsed', 'false'); // Atualiza o estado salvo
                    setTimeout(() => {
                        closeAllSubmenus();
                        parentLi.classList.add('open');
                    }, 100);
                    return;
                }
                
                // Comportamento de Acordeão: Fecha todos os outros...
                closeAllSubmenus();

                if (!wasOpen) { // ...e abre o atual se ele estava fechado.
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
    function showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            console.error('Toast container not found!');
            return;
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        toastContainer.appendChild(toast);

        // Anima a entrada
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Define um tempo para remover o toast
        setTimeout(() => {
            toast.classList.remove('show');
            // Remove o elemento do DOM após a animação de saída
            toast.addEventListener('transitionend', () => {
                if (toast.parentElement) {
                    toastContainer.removeChild(toast);
                }
            });
        }, 5000); // O toast fica visível por 5 segundos
    }

    initializeThemeSwitcher();
    initializeSidebar();
    
    // Adiciona o container de toasts ao corpo do documento
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);

    /**
     * =================================================================
     * MÓDULO DE MODAL E FORMULÁRIOS
     * =================================================================
     */
    const modal = document.getElementById('form-modal');
    const modalTitle = document.getElementById('modal-title');
    const formFields = document.getElementById('form-fields');
    const modalForm = document.getElementById('modal-form');
    const closeModalBtn = document.querySelector('.modal-close');
    const cancelModalBtn = document.querySelector('.modal-cancel');

    if (modal) {
        const openModal = () => modal.style.display = 'flex';
        const closeModal = () => modal.style.display = 'none';

        closeModalBtn.addEventListener('click', closeModal);
        cancelModalBtn.addEventListener('click', closeModal);
        window.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    } else {
        console.warn("Modal elements not found. CRUD operations will be affected.");
    }

    /**
     * =================================================================
     * MÓDULO DE API E RENDERIZAÇÃO DE CONTEÚDO
     * =================================================================
     */
    const pageContent = document.getElementById('page-content');
    const mainTitle = document.getElementById('main-title');

    // Wrapper de API centralizado com tratamento de erro aprimorado.
    const api = async (endpoint, method = 'GET', body = null) => {
        const options = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) options.body = JSON.stringify(body);
        const response = await fetch(endpoint, options);
        if (!response.ok) {
            // Tenta ler a resposta como JSON, mas se falhar, lê como texto.
            // Isso garante que a mensagem de erro real seja capturada, mesmo que não seja um JSON válido.
            let errorMessage;
            try {
                const errorBody = await response.json();
                errorMessage = errorBody.erro || JSON.stringify(errorBody);
            } catch (e) {
                errorMessage = await response.text();
            }
            throw new Error(errorMessage || `Erro de HTTP: ${response.status}`);
        }
        return response.json();
    };

    // Funções de feedback visual para o usuário.
    const showLoading = () => {
        pageContent.innerHTML = '<div class="loader"></div>';
    };

    const renderError = (error) => {
        const errorMessage = error.message || 'Ocorreu um erro desconhecido.';
        pageContent.innerHTML = `<div class="error-message">Erro ao carregar conteúdo: ${errorMessage}</div>`;
        showToast(`Erro: ${errorMessage}`, 'error');
    };

    /**
     * =================================================================
     * MÓDULO DE GERAÇÃO DE FORMULÁRIOS DINÂMICOS (SEGURO)
     * =================================================================
     */

    // Função auxiliar para criar um elemento com atributos e texto
    function createElement(tag, attributes = {}, textContent = '') {
        const el = document.createElement(tag);
        Object.entries(attributes).forEach(([key, value]) => {
            if (value !== null && value !== undefined) el.setAttribute(key, value);
        });
        if (textContent) el.textContent = textContent;
        return el;
    }

    // Função auxiliar para criar um campo de formulário completo (label + input)
    function createFormGroup(label, input) {
        const group = createElement('div', { class: 'form-group' });
        group.appendChild(label);
        group.appendChild(input);
        return group;
    }

    const generateErpForm = (conn = {}) => {
        const creds = conn.credentials || {};
        const fragment = document.createDocumentFragment();

        // Campo oculto de ID
        fragment.appendChild(createElement('input', { type: 'hidden', name: 'id', value: conn.id || '' }));

        // Campo Nome
        const nameLabel = createElement('label', { for: 'name' }, 'Nome');
        const nameInput = createElement('input', { type: 'text', id: 'name', name: 'name', value: conn.name || '', required: true });
        fragment.appendChild(createFormGroup(nameLabel, nameInput));

        // Campo Tipo (Select)
        const typeLabel = createElement('label', { for: 'type' }, 'Tipo');
        const typeSelect = createElement('select', { id: 'type', name: 'type', required: true });
        const options = [
            { value: '', text: 'Selecione um tipo...' },
            { value: 'bling', text: 'Bling' },
            { value: 'cisspoder', text: 'CissPoder' }
        ];
        options.forEach(opt => {
            const optionEl = createElement('option', { value: opt.value }, opt.text);
            if (conn.type === opt.value) optionEl.selected = true;
            if (!conn.type && opt.value === '') optionEl.selected = true;
            typeSelect.appendChild(optionEl);
        });
        fragment.appendChild(createFormGroup(typeLabel, typeSelect));

        // Container para os campos de credenciais
        const credsContainer = createElement('div', { id: 'erp-credentials-fields' });
        fragment.appendChild(credsContainer);

        // Função para renderizar os campos de credenciais específicos do tipo
        const renderCredentialFields = (type) => {
            credsContainer.innerHTML = ''; // Limpa os campos antigos
            const credsFragment = document.createDocumentFragment();

            if (type === 'bling') {
                credsFragment.appendChild(createFormGroup(
                    createElement('label', { for: 'client_id' }, 'ID do Cliente (Client ID)'),
                    createElement('input', { type: 'text', id: 'client_id', name: 'client_id', value: creds.client_id || '', required: true })
                ));
                credsFragment.appendChild(createFormGroup(
                    createElement('label', { for: 'client_secret' }, 'Segredo do Cliente (Client Secret)'),
                    createElement('input', { type: 'password', id: 'client_secret', name: 'client_secret', value: creds.client_secret || '', required: true })
                ));
                credsFragment.appendChild(createFormGroup(
                    createElement('label', { for: 'redirect_uri' }, 'URI de Redirecionamento'),
                    createElement('input', { type: 'text', id: 'redirect_uri', name: 'redirect_uri', value: creds.redirect_uri || '', placeholder: 'Ex: https://seu-dominio.com/api/callback', required: true })
                ));
            } else if (type === 'cisspoder') {
                credsFragment.appendChild(createFormGroup(
                    createElement('label', { for: 'auth_url' }, 'URL de Autenticação'),
                    createElement('input', { type: 'text', id: 'auth_url', name: 'auth_url', value: creds.auth_url || '', placeholder: 'Ex: https://api.servidor.com.br', required: true })
                ));
                credsFragment.appendChild(createFormGroup(
                    createElement('label', { for: 'username' }, 'Usuário'),
                    createElement('input', { type: 'text', id: 'username', name: 'username', value: creds.username || '', required: true })
                ));
                credsFragment.appendChild(createFormGroup(
                    createElement('label', { for: 'password' }, 'Senha'),
                    createElement('input', { type: 'password', id: 'password', name: 'password', value: creds.password || '', required: true })
                ));
            }
            credsContainer.appendChild(credsFragment);
        };

        // Adiciona o listener e renderiza os campos iniciais
        typeSelect.addEventListener('change', () => renderCredentialFields(typeSelect.value));
        if (conn.type) {
            renderCredentialFields(conn.type);
        }

        return fragment;
    };

    const generateSupplierForm = (conn = {}) => {
        const creds = conn.credentials ? JSON.stringify(conn.credentials, null, 2) : '';
        const fragment = document.createDocumentFragment();

        fragment.appendChild(createElement('input', { type: 'hidden', name: 'id', value: conn.id || '' }));

        const nameLabel = createElement('label', { for: 'name' }, 'Nome');
        const nameInput = createElement('input', { type: 'text', id: 'name', name: 'name', value: conn.name || '', required: true });
        fragment.appendChild(createFormGroup(nameLabel, nameInput));

        const typeLabel = createElement('label', { for: 'type' }, 'Tipo');
        const typeSelect = createElement('select', { id: 'type', name: 'type', required: true });
        const typeOption = createElement('option', { value: 'dismatal_webscraper' }, 'Dismatal Web Scraper');
        typeOption.selected = true; // Única opção
        typeSelect.appendChild(typeOption);
        fragment.appendChild(createFormGroup(typeLabel, typeSelect));

        const credsLabel = createElement('label', { for: 'credentials' }, 'Credenciais (JSON)');
        const credsTextarea = createElement('textarea', { id: 'credentials', name: 'credentials', rows: '6', required: true }, creds);
        fragment.appendChild(createFormGroup(credsLabel, credsTextarea));

        return fragment;
    };

    const renderErpConnections = async () => {
        mainTitle.textContent = 'Conexões ERP';
        showLoading();
        try {
            const { connections } = await api('/api/erp-connections');
    
            // Explicitly handle the case where the API returns an empty array.
            if (!connections || connections.length === 0) {
                pageContent.innerHTML = '<div class="empty-state"><p>Nenhuma conexão ERP encontrada.</p><button class="btn-primary" data-action="add-erp">Adicionar Conexão ERP</button></div>';
                return;
            }

            const getLogoUrl = (type) => `/assets/logos/${type.toLowerCase()}.png`;

            const fragment = document.createDocumentFragment();
            const pageHeader = createElement('div', { class: 'page-header' });
            pageHeader.appendChild(createElement('button', { class: 'btn-primary', 'data-action': 'add-erp' }, 'Adicionar Conexão ERP'));
            fragment.appendChild(pageHeader);

            const grid = createElement('div', { class: 'connections-grid' });
            connections.forEach(conn => {
                const card = createElement('div', { class: 'connection-card' });

                const cardHeader = createElement('div', { class: 'card-header' });
                const logo = createElement('img', {
                    src: getLogoUrl(conn.type),
                    alt: `Logo ${conn.type}`,
                    class: `erp-logo logo-${conn.type}`
                });
                cardHeader.appendChild(logo);

                const cardBody = createElement('div', { class: 'card-body' });
                cardBody.appendChild(createElement('h3', { class: 'card-title' }, conn.name));
                const statusP = createElement('p', { class: 'card-status' }, 'Status: ');
                statusP.appendChild(createElement('span', { class: `status status-${conn.status}` }, conn.status.replace(/_/g, ' ')));
                cardBody.appendChild(statusP);

                const cardFooter = createElement('div', { class: 'card-footer' });
                const editBtn = (() => {
                    const btn = createElement('button', { class: 'card-action-btn', 'data-action': 'edit-erp', 'data-id': conn.id, 'data-tooltip': 'Editar' });
                    btn.appendChild(createElement('i', { class: 'fas fa-pencil-alt' }));
                    return btn;
                })();
                const removeBtn = (() => {
                    const btn = createElement('button', { class: 'card-action-btn danger', 'data-action': 'remove-erp', 'data-id': conn.id, 'data-tooltip': 'Remover' });
                    btn.appendChild(createElement('i', { class: 'fas fa-trash-alt' }));
                    return btn;
                })();
                cardFooter.append(editBtn, removeBtn);

                card.append(cardHeader, cardBody, cardFooter);
                grid.appendChild(card);
            });

            fragment.appendChild(grid);

            // Limpa o conteúdo e adiciona os novos elementos de forma segura
            pageContent.innerHTML = '';
            pageContent.appendChild(fragment);
        } catch (error) {
            renderError(error);
        }
    };

    const renderSupplierConnections = async () => {
        mainTitle.textContent = 'Conexões Fornecedores';
        showLoading();
        try {
            const { connections } = await api('/api/supplier-connections');
    
            // Explicitly handle the case where the API returns an empty array.
            if (!connections || connections.length === 0) {
                pageContent.innerHTML = '<div class="empty-state"><p>Nenhuma conexão de fornecedor encontrada.</p><button class="btn-primary" data-action="add-supplier">Adicionar Conexão de Fornecedor</button></div>';
                return;
            }

            const fragment = document.createDocumentFragment();
            const pageHeader = createElement('div', { class: 'page-header' });
            pageHeader.appendChild(createElement('button', { class: 'btn-primary', 'data-action': 'add-supplier' }, 'Adicionar Conexão de Fornecedor'));
            fragment.appendChild(pageHeader);

            const grid = createElement('div', { class: 'connections-grid' });
            connections.forEach(conn => {
                const card = createElement('div', { class: 'connection-card supplier-card' });

                const cardHeader = createElement('div', { class: 'card-header' });
                cardHeader.appendChild(createElement('i', { class: 'fas fa-truck card-icon' }));

                const cardBody = createElement('div', { class: 'card-body' });
                cardBody.appendChild(createElement('h3', { class: 'card-title' }, conn.name));
                cardBody.appendChild(createElement('p', { class: 'card-subtitle' }, conn.type.replace(/_/g, ' ')));

                const cardFooter = createElement('div', { class: 'card-footer' });
                const actionGroup1 = createElement('div', { class: 'action-group' });
                actionGroup1.append(
                    createElement('button', { class: 'btn-small btn-info', 'data-action': 'test-supplier', 'data-id': conn.id, title: 'Verificar se a sessão salva ainda é válida' }, 'Validar'),
                    createElement('button', { class: 'btn-small btn-warning', 'data-action': 'auth-supplier', 'data-id': conn.id, title: 'Forçar um novo login para renovar a sessão' }, 'Renovar')
                );
                const actionGroup2 = createElement('div', { class: 'action-group' });
                const editBtn = (() => {
                    const btn = createElement('button', { class: 'card-action-btn', 'data-action': 'edit-supplier', 'data-id': conn.id, 'data-tooltip': 'Editar' });
                    btn.appendChild(createElement('i', { class: 'fas fa-pencil-alt' }));
                    return btn;
                })();
                const removeBtn = (() => {
                    const btn = createElement('button', { class: 'card-action-btn danger', 'data-action': 'remove-supplier', 'data-id': conn.id, 'data-tooltip': 'Remover' });
                    btn.appendChild(createElement('i', { class: 'fas fa-trash-alt' }));
                    return btn;
                })();
                actionGroup2.append(editBtn, removeBtn);
                cardFooter.append(actionGroup1, actionGroup2);

                card.append(cardHeader, cardBody, cardFooter);
                grid.appendChild(card);
            });
            fragment.appendChild(grid);

            pageContent.innerHTML = '';
            pageContent.appendChild(fragment);
        } catch (error) {
            renderError(error);
        }
    };

    const renderProductsPage = async () => {
        mainTitle.textContent = 'Produtos';
        pageContent.innerHTML = `
            <div id="product-search-form"></div>
            <div id="product-results" class="results-container">
                <div class="empty-state"><p>Selecione uma conexão ERP e digite um termo de busca para começar.</p></div>
            </div>
        `;

        const searchFormContainer = document.getElementById('product-search-form');
        const resultsContainer = document.getElementById('product-results');

        // Helper function to render pagination controls
        const renderPagination = (pagination, onPageClick) => {
            if (!pagination || pagination.totalPages <= 1) {
                return null;
            }

            const { currentPage, totalPages } = pagination;
            let pagesHtml = '';

            // Previous button
            pagesHtml += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a href="#" class="page-link" data-page="${currentPage - 1}">&laquo;</a>
            </li>`;

            // Page numbers logic
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

            // Next button
            pagesHtml += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a href="#" class="page-link" data-page="${currentPage + 1}">&raquo;</a>
            </li>`;

            const paginationContainer = document.createElement('nav');
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

        // Main search execution function
        const executeProductSearch = async (page = 1) => {
            const productSearchForm = document.getElementById('erp-product-search');
            const button = productSearchForm.querySelector('button[type="submit"]');
            button.classList.add('loading');
            button.disabled = true;

            const connectionId = document.getElementById('erp-connection-select').value;
            const searchTerm = document.getElementById('product-search-term').value;
            
            resultsContainer.innerHTML = '<p>Buscando produtos...</p>';

            try {
                const { products, pagination } = await api(`/api/erp-connections/${connectionId}/products`, 'POST', { searchTerm, page });

                // Explicitly handle the case where the search returns no products.
                if (!products || products.length === 0) {
                    resultsContainer.innerHTML = '<div class="empty-state"><p>Nenhum produto encontrado com o termo informado.</p></div>';
                    return;
                }

                const tableRows = products.map(p => `
                    <tr>
                        <td>${p.sku || 'N/A'}</td>
                        <td>${p.name || 'N/A'}</td>
                        <td>${p.stock ?? 'N/A'}</td>
                        <td>${p.price ? `R$ ${p.price.toFixed(2)}` : 'N/A'}</td>
                    </tr>
                `).join('');

                resultsContainer.innerHTML = `
                    <table>
                        <thead><tr><th>SKU</th><th>Nome</th><th>Estoque</th><th>Preço</th></tr></thead>
                        <tbody>${tableRows}</tbody>
                    </table>
                `;

                const paginationControls = renderPagination(pagination, executeProductSearch);
                if (paginationControls) {
                    resultsContainer.appendChild(paginationControls);
                }

            } catch (error) {
                resultsContainer.innerHTML = `<p style="color: red;">Erro ao buscar produtos: ${error.message}</p>`;
            } finally {
                button.classList.remove('loading');
                button.disabled = false;
            }
        };

        try {
            // 1. Fetch ERP connections to populate the selector
            const { connections } = await api('/api/erp-connections');

            // Explicitly handle the case where there are no connections to search from.
            if (!connections || connections.length === 0) {
                searchFormContainer.innerHTML = '<div class="empty-state"><p>Nenhuma conexão ERP ativa encontrada. Adicione uma em "Integrações" para buscar produtos.</p></div>';
                return;
            }

            // 2. Build the form
            const options = connections
                .filter(c => c.status === 'connected') // Only show connected ERPs in the dropdown
                .map(c => `<option value="${c.id}">${c.name} (${c.type})</option>`)
                .join('');

            if (options.length === 0) {
                searchFormContainer.innerHTML = '<div class="empty-state"><p>Nenhuma conexão ERP com status "Conectado" foi encontrada. Verifique o status das suas conexões.</p></div>';
                return;
            }

            searchFormContainer.innerHTML = `
                <form id="erp-product-search">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="erp-connection-select">Conexão ERP</label>
                            <select id="erp-connection-select" name="erp-connection" required>
                                ${options}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="product-search-term">Buscar Produto (Nome ou SKU)</label>
                            <input type="search" id="product-search-term" name="searchTerm" placeholder="Ex: Parafuso Allen" required>
                        </div>
                        <div class="form-group">
                            <button type="submit" class="btn-primary">Buscar</button>
                        </div>
                    </div>
                </form>
            `;

            // 3. Add event listener for the form submission
            const productSearchForm = document.getElementById('erp-product-search');
            productSearchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                executeProductSearch(1); // Always start from page 1 on a new search
            });
        } catch (error) {
            renderError(error);
        }
    };

    const renderWelcomePage = () => {
        mainTitle.textContent = 'Bem-vindo ao Integrador ERP';
        pageContent.innerHTML = '<div class="empty-state"><p>Selecione uma opção no menu ao lado para começar.</p></div>';
    };

    const validateJsonInModal = () => {
        const credentialsTextarea = document.getElementById('credentials');
        if (!credentialsTextarea) return;

        const saveButton = modalForm.querySelector('button[type="submit"]');

        // Não altera o estado do botão se ele já estiver em modo "loading"
        if (saveButton.classList.contains('loading')) return;

        const value = credentialsTextarea.value;
        if (value.trim() === '') {
            credentialsTextarea.classList.remove('valid', 'invalid');
            saveButton.disabled = true;
            return;
        }
        try {
            JSON.parse(value);
            credentialsTextarea.classList.add('valid');
            credentialsTextarea.classList.remove('invalid');
            saveButton.disabled = false;
        } catch (e) {
            credentialsTextarea.classList.add('invalid');
            credentialsTextarea.classList.remove('valid');
            saveButton.disabled = true;
        }
    };

    const setupJsonValidation = () => {
        const credentialsTextarea = document.getElementById('credentials');
        if (!credentialsTextarea) return;

        // A validação é anexada ao evento de input do campo de texto
        credentialsTextarea.addEventListener('input', validateJsonInModal);
        validateJsonInModal(); // Executa a validação inicial ao abrir o modal
    };

    /**
     * =================================================================
     * MÓDULO DE EVENTOS E AÇÕES DO USUÁRIO
     * =================================================================
     */
    pageContent.addEventListener('click', async (e) => {
        // Usa .closest() para garantir que o evento seja capturado mesmo se o clique for no ícone dentro do botão.
        const actionButton = e.target.closest('[data-action]');
        if (!actionButton) return;

        const { action, id } = actionButton.dataset;

        // Ações que não abrem o modal (Testar, Autenticar)
        if (action === 'test-supplier' || action === 'auth-supplier') {
            actionButton.classList.add('loading');
            actionButton.disabled = true;

            const endpointAction = action === 'test-supplier' ? 'validate-authentication' : 'authenticate';
            try {
                const result = await api(`/api/supplier-connections/${id}/${endpointAction}`, 'POST');
                showToast(result.mensagem || 'Ação concluída com sucesso!', 'success');
            } catch (error) {
                showToast(`Erro: ${error.message}`, 'error');
            } finally {
                actionButton.classList.remove('loading');
                actionButton.disabled = false;
            }
            return; // Finaliza o evento aqui
        }

        const type = action.includes('erp') ? 'erp' : 'supplier';
        const endpoint = type === 'erp' ? '/api/erp-connections' : '/api/supplier-connections';
        const renderFn = type === 'erp' ? renderErpConnections : renderSupplierConnections;

        try {
            if (action.startsWith('add')) {
                modalTitle.textContent = `Adicionar Conexão de ${type.toUpperCase()}`;
                formFields.innerHTML = ''; // Limpa o conteúdo anterior
                formFields.appendChild(type === 'erp' ? generateErpForm() : generateSupplierForm());
                modal.style.display = 'flex';
                setupJsonValidation();

                modalForm.onsubmit = async (ev) => {
                    ev.preventDefault();
                    const saveButton = modalForm.querySelector('button[type="submit"]');
                    saveButton.classList.add('loading');
                    saveButton.disabled = true;

                    try {
                        const formData = new FormData(modalForm);
                        const erpType = formData.get('type');
                        const body = { name: formData.get('name'), type: erpType, credentials: {} };

                        if (type === 'erp') {
                            // O tipo da conexão é 'erp', mas o subtipo (bling/cisspoder) está no campo 'type' do form.
                            if (erpType === 'bling') {
                                body.credentials.client_id = formData.get('client_id');
                                body.credentials.client_secret = formData.get('client_secret');
                                body.credentials.redirect_uri = formData.get('redirect_uri');
                            } else if (erpType === 'cisspoder') {
                                body.credentials.auth_url = formData.get('auth_url');
                                body.credentials.username = formData.get('username');
                                body.credentials.password = formData.get('password');
                            }
                        } else { // Fornecedor
                            body.credentials = JSON.parse(formData.get('credentials'));
                        }

                        await api(endpoint, 'POST', body);
                        showToast(`Conexão de ${type.toUpperCase()} adicionada com sucesso!`, 'success');
                        modal.style.display = 'none';
                        await renderFn();
                    } catch (formError) {
                        showToast(`Erro ao salvar: ${formError.message}`, 'error');
                    } finally {
                        saveButton.classList.remove('loading');
                        validateJsonInModal(); // Re-valida para resetar o estado do botão
                    }
                };
            } else if (action.startsWith('edit')) {
                const { connection } = await api(`${endpoint}/${id}`);
                modalTitle.textContent = `Editar Conexão de ${type.toUpperCase()}`;
                formFields.innerHTML = ''; // Limpa o conteúdo anterior
                formFields.appendChild(type === 'erp' ? generateErpForm(connection) : generateSupplierForm(connection));
                modal.style.display = 'flex';
                setupJsonValidation();

                modalForm.onsubmit = async (ev) => {
                    ev.preventDefault();
                    const saveButton = modalForm.querySelector('button[type="submit"]');
                    saveButton.classList.add('loading');
                    saveButton.disabled = true;

                    try {
                        const formData = new FormData(modalForm);
                        const erpType = formData.get('type');
                        const body = { name: formData.get('name'), type: erpType, credentials: {} };

                        if (type === 'erp') {
                            // O tipo da conexão é 'erp', mas o subtipo (bling/cisspoder) está no campo 'type' do form.
                            if (erpType === 'bling') {
                                body.credentials.client_id = formData.get('client_id');
                                body.credentials.client_secret = formData.get('client_secret');
                                body.credentials.redirect_uri = formData.get('redirect_uri');
                            } else if (erpType === 'cisspoder') {
                                body.credentials.auth_url = formData.get('auth_url');
                                body.credentials.username = formData.get('username');
                                body.credentials.password = formData.get('password');
                            }
                        } else { // Fornecedor
                            body.credentials = JSON.parse(formData.get('credentials'));
                        }

                        await api(`${endpoint}/${id}`, 'PUT', body);
                        showToast(`Conexão de ${type.toUpperCase()} atualizada com sucesso!`, 'success');
                        modal.style.display = 'none';
                        await renderFn();
                    } catch (formError) {
                        showToast(`Erro ao salvar: ${formError.message}`, 'error');
                    } finally {
                        saveButton.classList.remove('loading');
                        validateJsonInModal(); // Re-valida para resetar o estado do botão
                    }
                };
            } else if (action.startsWith('remove')) {
                if (confirm('Tem certeza que deseja remover esta conexão?')) {
                    await api(`${endpoint}/${id}`, 'DELETE');
                    showToast('Conexão removida com sucesso.', 'info');
                    await renderFn();
                }
            }
        } catch (error) {
            showToast(`Erro: ${error.message}`, 'error');
            if (modal) modal.style.display = 'none';
        }
    });

    /**
     * =================================================================
     * MÓDULO DE ROTEAMENTO E ESTADO DA APLICAÇÃO
     * =================================================================
     */
    const routes = {
        'nav-produtos': renderProductsPage,
        'nav-conexoes-erp': renderErpConnections,
        'nav-conexoes-fornecedores': renderSupplierConnections,
    };

    // Listener de navegação principal, usando delegação de eventos.
    document.querySelector('.menu-links').addEventListener('click', (e) => {
        const link = e.target.closest('a:not(.submenu-toggle)');
        if (!link || !link.id) return;

        e.preventDefault();

        // Remove a classe ativa de todos os links
        document.querySelectorAll('.menu-links a').forEach(a => a.classList.remove('active'));
        link.classList.add('active');

        // Se o link clicado estiver dentro de um submenu, marca o item pai como ativo também.
        const parentSubmenuToggle = link.closest('li.open')?.querySelector('.submenu-toggle');
        if (parentSubmenuToggle) {
            parentSubmenuToggle.classList.add('active');
        }

        const routeHandler = routes[link.id];
        routeHandler ? routeHandler() : renderWelcomePage();
    });

    // Carrega a página inicial padrão
    renderWelcomePage();
});