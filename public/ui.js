document.addEventListener('DOMContentLoaded', () => {
    // --- Lógica do Sidebar (Expandir/Recolher e Submenus) ---
    // Esta seção foi completamente reescrita para uma solução definitiva e robusta.
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.querySelector('.toggle-btn');
    const submenuToggles = document.querySelectorAll('.submenu-toggle');

    /**
     * Manipulador para o botão principal que recolhe/expande a barra lateral.
     */
    toggleBtn.addEventListener('click', () => {
        // REGRA 1: Se o menu está expandido e prestes a ser recolhido...
        if (!sidebar.classList.contains('collapsed')) {
            // ...primeiro, fecha todos os submenus abertos.
            submenuToggles.forEach(toggle => {
                toggle.classList.remove('open');
                if (toggle.nextElementSibling) {
                    toggle.nextElementSibling.classList.remove('open');
                }
            });
        }
        // Por fim, alterna o estado principal da barra lateral.
        sidebar.classList.toggle('collapsed');
    });

    /**
     * Manipulador para os itens de menu que possuem um submenu (ex: Integrações).
     */
    submenuToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();

            // CASO 1: A barra lateral está recolhida.
            if (sidebar.classList.contains('collapsed')) {
                // Ação: Expandir a barra lateral e abrir o submenu clicado.
                sidebar.classList.remove('collapsed');
                toggle.classList.add('open');
                toggle.nextElementSibling.classList.add('open');
                return; // Ação concluída para este clique.
            }

            // CASO 2: A barra lateral está expandida.
            // Ação: Funcionar como um menu "acordeão".
            const wasThisOpen = toggle.classList.contains('open');

            // Primeiro, fecha todos os submenus.
            submenuToggles.forEach(t => {
                t.classList.remove('open');
                if (t.nextElementSibling) t.nextElementSibling.classList.remove('open');
            });

            // Se o submenu que foi clicado não estava aberto, ele é aberto agora.
            // (Se já estava aberto, a ação acima já o fechou, criando o efeito de toggle).
            if (!wasThisOpen) {
                toggle.classList.add('open');
                toggle.nextElementSibling.classList.add('open');
            }
        });
    });

    // --- Lógica do Modal ---
    const modal = document.getElementById('form-modal');
    const modalTitle = document.getElementById('modal-title');
    const formFields = document.getElementById('form-fields');
    const modalForm = document.getElementById('modal-form');
    const closeModalBtn = document.querySelector('.modal-close');
    const cancelModalBtn = document.querySelector('.modal-cancel');

    const openModal = () => modal.style.display = 'flex';
    const closeModal = () => modal.style.display = 'none';

    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // --- Lógica de Carregamento Dinâmico e CRUD ---
    const pageContent = document.getElementById('page-content');
    const mainTitle = document.getElementById('main-title');

    const api = async (endpoint, method = 'GET', body = null) => {
        const options = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) options.body = JSON.stringify(body);
        const response = await fetch(endpoint, options);
        if (!response.ok) throw new Error((await response.json()).erro || `Erro de HTTP: ${response.status}`);
        return response.json();
    };

    const showLoading = () => {
        pageContent.innerHTML = '<p>Carregando...</p>';
    };

    const renderError = (error) => {
        pageContent.innerHTML = `<p style="color: red;">Erro ao carregar conteúdo: ${error.message}</p>`;
    };

    // --- Funções de Geração de Formulário ---
    const generateErpForm = (conn = {}) => {
        const creds = conn.credentials ? JSON.stringify(conn.credentials, null, 2) : '';
        return `
            <input type="hidden" name="id" value="${conn.id || ''}">
            <div class="form-group">
                <label for="name">Nome</label>
                <input type="text" id="name" name="name" value="${conn.name || ''}" required>
            </div>
            <div class="form-group">
                <label for="type">Tipo</label>
                <select id="type" name="type" required>
                    <option value="bling" ${conn.type === 'bling' ? 'selected' : ''}>Bling</option>
                    <option value="cisspoder" ${conn.type === 'cisspoder' ? 'selected' : ''}>CissPoder</option>
                </select>
            </div>
            <div class="form-group">
                <label for="credentials">Credenciais (JSON)</label>
                <textarea id="credentials" name="credentials" rows="6" required>${creds}</textarea>
            </div>
        `;
    };

    const generateSupplierForm = (conn = {}) => {
        const creds = conn.credentials ? JSON.stringify(conn.credentials, null, 2) : '';
        return `
            <input type="hidden" name="id" value="${conn.id || ''}">
            <div class="form-group">
                <label for="name">Nome</label>
                <input type="text" id="name" name="name" value="${conn.name || ''}" required>
            </div>
            <div class="form-group">
                <label for="type">Tipo</label>
                <select id="type" name="type" required>
                    <option value="dismatal_webscraper" ${conn.type === 'dismatal_webscraper' ? 'selected' : ''}>Dismatal Web Scraper</option>
                </select>
            </div>
            <div class="form-group">
                <label for="credentials">Credenciais (JSON)</label>
                <textarea id="credentials" name="credentials" rows="6" required>${creds}</textarea>
            </div>
        `;
    };

    const renderErpConnections = async () => {
        mainTitle.textContent = 'Conexões ERP';
        showLoading();
        try {
            const { connections } = await api('/api/erp-connections');

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
                        <button class="btn-small" data-action="edit-erp" data-id="${conn.id}">Editar</button>
                        <button class="btn-small btn-danger" data-action="remove-erp" data-id="${conn.id}">Remover</button>
                    </td>
                </tr>
            `).join('');

            pageContent.innerHTML = `
                <button class="btn-primary" data-action="add-erp">Adicionar Conexão ERP</button>
                <br>
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
            const { connections } = await api('/api/supplier-connections');

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
                        <button class="btn-small btn-info" data-action="test-supplier" data-id="${conn.id}" title="Testar Conexão">Testar</button>
                        <button class="btn-small btn-warning" data-action="auth-supplier" data-id="${conn.id}" title="Forçar nova autenticação">Autenticar</button>
                        <button class="btn-small" data-action="edit-supplier" data-id="${conn.id}">Editar</button>
                        <button class="btn-small btn-danger" data-action="remove-supplier" data-id="${conn.id}">Remover</button>
                    </td>
                </tr>
            `).join('');

            pageContent.innerHTML = `
                <button class="btn-primary" data-action="add-supplier">Adicionar Conexão de Fornecedor</button>
                <br>
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

    const renderProductsPage = async () => {
        mainTitle.textContent = 'Produtos';
        pageContent.innerHTML = `
            <div id="product-search-form"></div>
            <div id="product-results" class="results-container">
                <p>Selecione uma conexão ERP e digite um termo de busca para começar.</p>
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

                if (!products || products.length === 0) {
                    resultsContainer.innerHTML = '<p>Nenhum produto encontrado com o termo informado.</p>';
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

            if (!connections || connections.length === 0) {
                searchFormContainer.innerHTML = '<p>Nenhuma conexão ERP ativa encontrada. Adicione uma em "Integrações" para buscar produtos.</p>';
                return;
            }

            // 2. Build the form
            const options = connections
                .filter(c => c.status === 'connected') // Only show connected ERPs
                .map(c => `<option value="${c.id}">${c.name} (${c.type})</option>`)
                .join('');

            if (options.length === 0) {
                searchFormContainer.innerHTML = '<p>Nenhuma conexão ERP com status "Conectado" foi encontrada. Verifique o status das suas conexões.</p>';
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
        pageContent.innerHTML = '<p>Selecione uma opção no menu ao lado para começar.</p>';
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

    // --- Manipulador de Eventos Principal ---
    pageContent.addEventListener('click', async (e) => {
        const action = e.target.dataset.action;
        const id = e.target.dataset.id;
        if (!action) return;

        // Ações que não abrem o modal (Testar, Autenticar)
        if (action === 'test-supplier' || action === 'auth-supplier') {
            const button = e.target;
            button.classList.add('loading');
            button.disabled = true;

            const endpointAction = action === 'test-supplier' ? 'validate-authentication' : 'authenticate';
            try {
                const result = await api(`/api/supplier-connections/${id}/${endpointAction}`, 'POST');
                alert(result.mensagem || 'Ação enviada com sucesso. O resultado aparecerá no console do servidor.');
            } catch (error) {
                alert(`Erro ao executar ação: ${error.message}`);
            } finally {
                button.classList.remove('loading');
                button.disabled = false;
            }
            return; // Finaliza o evento aqui
        }

        const type = action.includes('erp') ? 'erp' : 'supplier';
        const endpoint = type === 'erp' ? '/api/erp-connections' : '/api/supplier-connections';
        const renderFn = type === 'erp' ? renderErpConnections : renderSupplierConnections;

        try {
            if (action.startsWith('add')) {
                modalTitle.textContent = `Adicionar Conexão de ${type.toUpperCase()}`;
                formFields.innerHTML = type === 'erp' ? generateErpForm() : generateSupplierForm();
                openModal();
                setupJsonValidation();

                modalForm.onsubmit = async (ev) => {
                    ev.preventDefault();
                    const saveButton = modalForm.querySelector('button[type="submit"]');
                    saveButton.classList.add('loading');
                    saveButton.disabled = true;

                    try {
                        const formData = new FormData(modalForm);
                        const body = {
                            name: formData.get('name'),
                            type: formData.get('type'),
                            credentials: JSON.parse(formData.get('credentials'))
                        };
                        await api(endpoint, 'POST', body);
                        closeModal();
                        await renderFn();
                    } catch (formError) {
                        alert(`Erro ao salvar: ${formError.message}`);
                    } finally {
                        saveButton.classList.remove('loading');
                        validateJsonInModal(); // Re-valida para resetar o estado do botão
                    }
                };
            } else if (action.startsWith('edit')) {
                const { connection } = await api(`${endpoint}/${id}`);
                modalTitle.textContent = `Editar Conexão de ${type.toUpperCase()}`;
                formFields.innerHTML = type === 'erp' ? generateErpForm(connection) : generateSupplierForm(connection);
                openModal();
                setupJsonValidation();

                modalForm.onsubmit = async (ev) => {
                    ev.preventDefault();
                    const saveButton = modalForm.querySelector('button[type="submit"]');
                    saveButton.classList.add('loading');
                    saveButton.disabled = true;

                    try {
                        const formData = new FormData(modalForm);
                        const body = {
                            name: formData.get('name'),
                            type: formData.get('type'),
                            credentials: JSON.parse(formData.get('credentials'))
                        };
                        await api(`${endpoint}/${id}`, 'PUT', body);
                        closeModal();
                        await renderFn();
                    } catch (formError) {
                        alert(`Erro ao salvar: ${formError.message}`);
                    } finally {
                        saveButton.classList.remove('loading');
                        validateJsonInModal(); // Re-valida para resetar o estado do botão
                    }
                };
            } else if (action.startsWith('remove')) {
                if (confirm('Tem certeza que deseja remover esta conexão?')) {
                    await api(`${endpoint}/${id}`, 'DELETE');
                    await renderFn();
                }
            }
        } catch (error) {
            // Tenta analisar o erro para exibir uma mensagem mais amigável
            try {
                const errorJson = JSON.parse(error.message);
                if (errorJson.erro) {
                    alert(`Erro: ${errorJson.erro}`);
                } else {
                    alert(`Erro: ${error.message}`);
                }
            } catch (e) {
                // Se o erro não for um JSON, exibe a mensagem de erro original
                alert(`Erro: ${error.message}`);
            }
            // Se o erro foi ao abrir o modal (ex: buscar dados para editar), fecha o modal.
            closeModal();
        }
    });

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