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
    
    // Modal de Conexões CRUD
    const modal = document.getElementById('form-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalSubtitle = document.getElementById('modal-subtitle');
    const modalIconBadge = document.getElementById('modal-icon-badge');
    const formFields = document.getElementById('form-fields');
    const modalForm = document.getElementById('modal-form');
    const modalSaveBtn = document.getElementById('modal-save-btn');
    const closeModalBtn = document.querySelector('.modal-close:not(.supplier-test-modal-close)');
    const cancelModalBtn = document.querySelector('.modal-cancel');
    const brandLink = document.getElementById('brand-link');

    // Modal Pop-up de Teste de Fornecedor (Dismatal)
    const supplierTestModal = document.getElementById('supplier-test-modal');
    const supplierTestForm = document.getElementById('supplier-test-form');
    const supplierTestTerm = document.getElementById('supplier-test-term');
    const supplierTestConnectionId = document.getElementById('supplier-test-connection-id');
    const supplierTestResults = document.getElementById('supplier-test-results');
    const supplierTestSubmitBtn = document.getElementById('supplier-test-submit-btn');
    const supplierTestModalCloseBtns = document.querySelectorAll('.supplier-test-modal-close');

    // Modais do Mercado Livre
    const meliCreateModal = document.getElementById('meli-create-modal');
    const meliCreateForm = document.getElementById('meli-create-form');
    const meliCreateTitle = document.getElementById('meli-create-title');
    const meliTitleCounter = document.getElementById('meli-title-counter');
    const meliPredictBtn = document.getElementById('meli-predict-btn');
    const meliCategorySuggestions = document.getElementById('meli-category-suggestions');
    const meliCreateCategoryId = document.getElementById('meli-create-category-id');
    const meliCreateCategoryName = document.getElementById('meli-create-category-name');
    const meliCreateCostPrice = document.getElementById('meli-create-cost-price');
    const meliCreateMarkup = document.getElementById('meli-create-markup');
    const meliCreatePrice = document.getElementById('meli-create-price');
    const meliCreateStock = document.getElementById('meli-create-stock');
    const meliCreateSku = document.getElementById('meli-create-sku');
    const meliCreateCondition = document.getElementById('meli-create-condition');
    const meliCreateListingType = document.getElementById('meli-create-listing-type');
    const meliCreateAccount = document.getElementById('meli-create-account');
    const meliCreateDescription = document.getElementById('meli-create-description');
    const meliImagesPreviewList = document.getElementById('meli-images-preview-list');
    const meliCreateNewImage = document.getElementById('meli-create-new-image');
    const meliAddImageBtn = document.getElementById('meli-add-image-btn');
    const meliCreateSyncStock = document.getElementById('meli-create-sync-stock');
    const meliCreateSyncPrice = document.getElementById('meli-create-sync-price');
    const meliCreateSourceType = document.getElementById('meli-create-source-type');
    const meliCreateSourceId = document.getElementById('meli-create-source-id');
    const meliCreateSourceData = document.getElementById('meli-create-source-data');
    const meliCreateSourceBadge = document.getElementById('meli-create-source-badge');
    const meliCreateSourceText = document.getElementById('meli-create-source-text');
    const meliSubmitPublishBtn = document.getElementById('meli-submit-publish-btn');
    const meliCreateModalCloseBtns = document.querySelectorAll('.meli-create-modal-close');

    // Modal de Edição do Mercado Livre
    const meliEditModal = document.getElementById('meli-edit-modal');
    const meliEditForm = document.getElementById('meli-edit-form');
    const meliEditItemId = document.getElementById('meli-edit-item-id');
    const meliEditConnectionId = document.getElementById('meli-edit-connection-id');
    const meliEditTitle = document.getElementById('meli-edit-title');
    const meliEditPrice = document.getElementById('meli-edit-price');
    const meliEditStock = document.getElementById('meli-edit-stock');
    const meliEditStatus = document.getElementById('meli-edit-status');
    const meliEditSaveBtn = document.getElementById('meli-edit-save-btn');
    const meliEditModalCloseBtns = document.querySelectorAll('.meli-edit-modal-close');

    let meliImagesList = [];

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

    const openSupplierTestModal = (connectionId, connectionName = 'Dismatal') => {
        if (!supplierTestModal) return;
        if (supplierTestConnectionId) supplierTestConnectionId.value = connectionId;
        if (supplierTestTerm) {
            supplierTestTerm.value = '';
            setTimeout(() => supplierTestTerm.focus(), 150);
        }
        const titleEl = document.getElementById('supplier-test-modal-title');
        if (titleEl) titleEl.textContent = `Testar Conexão ${connectionName}`;

        if (supplierTestResults) {
            supplierTestResults.innerHTML = `
                <div class="empty-state" style="padding: 2rem 1rem; margin: 0;">
                    <div class="empty-state-icon" style="color: var(--color-warning); background-color: var(--color-warning-light); width: 48px; height: 48px; font-size: 1.3rem;">
                        <i class="fas fa-barcode"></i>
                    </div>
                    <h4 style="font-size: 1.05rem; font-weight: 600;">Pronto para testar</h4>
                    <p style="font-size: 0.85rem; margin: 0;">Informe o SKU do produto acima para testar a comunicação com a ${connectionName}.</p>
                </div>
            `;
        }
        supplierTestModal.style.display = 'flex';
    };

    const closeSupplierTestModal = () => {
        if (supplierTestModal) supplierTestModal.style.display = 'none';
    };

    /**
     * Controle do Modal de Criação no Mercado Livre
     */
    const renderMeliImagesPreview = () => {
        if (!meliImagesPreviewList) return;
        if (meliImagesList.length === 0) {
            meliImagesPreviewList.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; color: var(--color-text-offset); font-size: 0.82rem; padding: 1.2rem;">
                    <i class="fas fa-image" style="font-size: 1.5rem; margin-bottom: 0.35rem; display: block;"></i>
                    Nenhuma foto adicionada. Cole a URL pública da foto acima e clique em "Adicionar Foto".
                </div>
            `;
            return;
        }

        let html = '';
        meliImagesList.forEach((url, idx) => {
            html += `
                <div class="meli-image-card" data-idx="${idx}">
                    <img src="${url}" alt="Foto ${idx + 1}" onerror="this.src='/assets/logos/default-erp.svg'">
                    ${idx === 0 ? '<span class="meli-image-cover-badge">Capa</span>' : ''}
                    <button type="button" class="meli-image-remove" data-action="remove-meli-image" data-idx="${idx}" title="Remover imagem">&times;</button>
                </div>
            `;
        });
        meliImagesPreviewList.innerHTML = html;
    };

    const openMeliCreateModal = async (initialData = {}) => {
        if (!meliCreateModal) return;
        meliCreateForm.reset();
        meliImagesList = [];

        // Carrega contas do Mercado Livre
        if (meliCreateAccount) {
            meliCreateAccount.innerHTML = '<option value="">Carregando contas cadastradas...</option>';
            try {
                const { connections } = await api('/api/marketplace-connections');
                const meliAccounts = (connections || []).filter(c => c.type === 'mercadolivre');
                if (meliAccounts.length === 0) {
                    meliCreateAccount.innerHTML = '<option value="">Nenhuma conta do Mercado Livre conectada</option>';
                    showToast('Você precisa conectar uma conta do Mercado Livre antes de publicar.', 'warning');
                } else {
                    meliCreateAccount.innerHTML = meliAccounts.map(acc => `
                        <option value="${acc.id}">${acc.name} (${acc.credentials?.nickname ? '@' + acc.credentials.nickname : 'ID #' + acc.id}) - ${acc.status === 'connected' ? '🟢 Conectado' : '🟠 Requer Login'}</option>
                    `).join('');
                }
            } catch (err) {
                meliCreateAccount.innerHTML = '<option value="">Erro ao carregar contas</option>';
            }
        }

        // Preenche dados iniciais
        const {
            source_type = 'manual',
            source_id = '',
            source_name = '',
            sku = '',
            name = '',
            price = 0,
            stock = 1,
            images = []
        } = initialData;

        if (meliCreateSourceType) meliCreateSourceType.value = source_type;
        if (meliCreateSourceId) meliCreateSourceId.value = source_id;
        if (meliCreateSourceData) meliCreateSourceData.value = JSON.stringify(initialData);

        if (meliCreateSourceBadge && meliCreateSourceText) {
            if (source_type !== 'manual') {
                meliCreateSourceBadge.style.display = 'flex';
                const label = source_type === 'erp' ? 'ERP' : 'Fornecedor';
                meliCreateSourceText.innerHTML = `Importado do ${label} <strong>${source_name || ''}</strong> (SKU: <code>${sku || 'N/D'}</code>)`;
            } else {
                meliCreateSourceBadge.style.display = 'none';
            }
        }

        if (meliCreateTitle) {
            meliCreateTitle.value = (name || '').substring(0, 60);
            if (meliTitleCounter) meliTitleCounter.textContent = `${meliCreateTitle.value.length}/60 caracteres`;
        }

        if (meliCreateSku) meliCreateSku.value = sku || '';
        if (meliCreateStock) meliCreateStock.value = stock !== undefined && stock !== null ? Math.max(1, parseInt(stock, 10) || 1) : 1;

        const numPrice = typeof price === 'number' ? price : parseFloat(String(price).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
        if (meliCreateCostPrice) meliCreateCostPrice.value = numPrice > 0 ? numPrice.toFixed(2) : '';

        const defaultMarkup = 30.0;
        if (meliCreateMarkup) meliCreateMarkup.value = defaultMarkup;

        if (numPrice > 0) {
            const finalPrice = numPrice * (1 + defaultMarkup / 100);
            if (meliCreatePrice) meliCreatePrice.value = finalPrice.toFixed(2);
        } else {
            if (meliCreatePrice) meliCreatePrice.value = '';
        }

        if (meliCreateCategoryId) meliCreateCategoryId.value = '';
        if (meliCreateCategoryName) meliCreateCategoryName.value = '';
        if (meliCategorySuggestions) meliCategorySuggestions.style.display = 'none';

        // Preenche imagens
        if (Array.isArray(images)) {
            images.forEach(img => {
                const url = typeof img === 'string' ? img : (img.source || img.url || '');
                if (url && url.startsWith('http')) meliImagesList.push(url);
            });
        }
        renderMeliImagesPreview();

        // Se tem título, sugere categoria automaticamente
        if (name) {
            executeCategoryPrediction(name);
        }

        meliCreateModal.style.display = 'flex';
    };

    const closeMeliCreateModal = () => {
        if (meliCreateModal) meliCreateModal.style.display = 'none';
    };

    const openMeliEditModal = (item) => {
        if (!meliEditModal) return;
        if (meliEditItemId) meliEditItemId.value = item.item_id || item.id;
        if (meliEditConnectionId) meliEditConnectionId.value = item.connection_id;
        if (meliEditTitle) meliEditTitle.value = item.title || '';
        if (meliEditPrice) meliEditPrice.value = (typeof item.price === 'number' ? item.price : parseFloat(item.price)).toFixed(2);
        if (meliEditStock) meliEditStock.value = item.available_quantity || 0;
        if (meliEditStatus) meliEditStatus.value = item.status || 'active';

        const subTitle = document.getElementById('meli-edit-modal-subtitle');
        if (subTitle) subTitle.textContent = `Anúncio: ${item.item_id || item.id} | SKU: ${item.sku || 'N/D'}`;

        meliEditModal.style.display = 'flex';
    };

    const closeMeliEditModal = () => {
        if (meliEditModal) meliEditModal.style.display = 'none';
    };

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);
    
    if (supplierTestModalCloseBtns) {
        supplierTestModalCloseBtns.forEach(btn => {
            btn.addEventListener('click', closeSupplierTestModal);
        });
    }

    if (meliCreateModalCloseBtns) {
        meliCreateModalCloseBtns.forEach(btn => btn.addEventListener('click', closeMeliCreateModal));
    }
    if (meliEditModalCloseBtns) {
        meliEditModalCloseBtns.forEach(btn => btn.addEventListener('click', closeMeliEditModal));
    }

    // Fechar modais ao clicar no backdrop ou pressionar ESC
    window.addEventListener('click', (e) => {
        if (e.target === modal || (e.target.classList && e.target.classList.contains('modal-backdrop') && e.target.closest('#form-modal'))) {
            closeModal();
        }
        if (e.target === supplierTestModal || (e.target.classList && e.target.classList.contains('modal-backdrop') && e.target.closest('#supplier-test-modal'))) {
            closeSupplierTestModal();
        }
        if (e.target === meliCreateModal || (e.target.classList && e.target.classList.contains('modal-backdrop') && e.target.closest('#meli-create-modal'))) {
            closeMeliCreateModal();
        }
        if (e.target === meliEditModal || (e.target.classList && e.target.classList.contains('modal-backdrop') && e.target.closest('#meli-edit-modal'))) {
            closeMeliEditModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (modal && modal.style.display === 'flex') closeModal();
            if (supplierTestModal && supplierTestModal.style.display === 'flex') closeSupplierTestModal();
            if (meliCreateModal && meliCreateModal.style.display === 'flex') closeMeliCreateModal();
            if (meliEditModal && meliEditModal.style.display === 'flex') closeMeliEditModal();
        }
    });

    /**
     * Lógica de Categorias, Imagens e Markup no Formulário do Mercado Livre
     */
    if (meliCreateTitle) {
        meliCreateTitle.addEventListener('input', () => {
            if (meliTitleCounter) {
                meliTitleCounter.textContent = `${meliCreateTitle.value.length}/60 caracteres`;
            }
        });
    }

    const executeCategoryPrediction = async (title) => {
        if (!title || !title.trim()) return;
        if (meliPredictBtn) {
            meliPredictBtn.classList.add('loading');
            meliPredictBtn.disabled = true;
        }

        try {
            const res = await api('/api/marketplace/mercadolivre/predict-category', 'POST', { title: title.trim() });
            const categories = res.categories || [];
            if (categories.length > 0) {
                // Auto seleciona a primeira categoria mais provável
                const topCat = categories[0];
                if (meliCreateCategoryId) meliCreateCategoryId.value = topCat.category_id;
                if (meliCreateCategoryName) meliCreateCategoryName.value = `${topCat.category_name} (${topCat.category_id})`;

                // Renderiza sugestões alternativas caso o usuário queira trocar
                if (meliCategorySuggestions && categories.length > 1) {
                    meliCategorySuggestions.innerHTML = categories.map(cat => `
                        <div class="meli-suggestion-item" data-cat-id="${cat.category_id}" data-cat-name="${cat.category_name}">
                            <span><strong>${cat.category_name}</strong> <small style="color: var(--color-text-offset); font-size: 0.78rem;">(${cat.domain_name || ''})</small></span>
                            <span class="sku-badge">${cat.category_id}</span>
                        </div>
                    `).join('');
                    meliCategorySuggestions.style.display = 'block';
                }
            } else {
                showToast('Nenhuma categoria específica sugerida para este título. Tente ajustar o nome.', 'info');
            }
        } catch (err) {
            console.error('Erro na predição de categoria:', err);
        } finally {
            if (meliPredictBtn) {
                meliPredictBtn.classList.remove('loading');
                meliPredictBtn.disabled = false;
            }
        }
    };

    if (meliPredictBtn) {
        meliPredictBtn.addEventListener('click', () => {
            const title = meliCreateTitle ? meliCreateTitle.value : '';
            if (!title) {
                showToast('Preencha o título do anúncio antes de sugerir a categoria.', 'warning');
                return;
            }
            executeCategoryPrediction(title);
        });
    }

    if (meliCategorySuggestions) {
        meliCategorySuggestions.addEventListener('click', (e) => {
            const item = e.target.closest('.meli-suggestion-item');
            if (!item) return;
            const catId = item.dataset.catId;
            const catName = item.dataset.catName;
            if (meliCreateCategoryId) meliCreateCategoryId.value = catId;
            if (meliCreateCategoryName) meliCreateCategoryName.value = `${catName} (${catId})`;
            meliCategorySuggestions.style.display = 'none';
            showToast(`Categoria selecionada: ${catName}`, 'success');
        });
    }

    // Calculadora de Markup / Preço de Venda
    const updateSellingPriceFromMarkup = () => {
        const cost = parseFloat(meliCreateCostPrice?.value || 0);
        const markup = parseFloat(meliCreateMarkup?.value || 0);
        if (cost > 0 && meliCreatePrice) {
            const finalPrice = cost * (1 + markup / 100);
            meliCreatePrice.value = finalPrice.toFixed(2);
        }
    };

    if (meliCreateCostPrice) meliCreateCostPrice.addEventListener('input', updateSellingPriceFromMarkup);
    if (meliCreateMarkup) meliCreateMarkup.addEventListener('input', updateSellingPriceFromMarkup);

    if (meliCreatePrice) {
        meliCreatePrice.addEventListener('input', () => {
            const cost = parseFloat(meliCreateCostPrice?.value || 0);
            const price = parseFloat(meliCreatePrice.value || 0);
            if (cost > 0 && price > cost && meliCreateMarkup) {
                const markup = ((price - cost) / cost) * 100;
                meliCreateMarkup.value = markup.toFixed(1);
            }
        });
    }

    // Gerenciador de Imagens
    if (meliAddImageBtn) {
        meliAddImageBtn.addEventListener('click', () => {
            const url = meliCreateNewImage ? meliCreateNewImage.value.trim() : '';
            if (!url || !url.startsWith('http')) {
                showToast('Informe uma URL de imagem válida (iniciando com http:// ou https://).', 'warning');
                return;
            }
            meliImagesList.push(url);
            if (meliCreateNewImage) meliCreateNewImage.value = '';
            renderMeliImagesPreview();
            showToast('Imagem adicionada ao anúncio!', 'info');
        });
    }

    if (meliImagesPreviewList) {
        meliImagesPreviewList.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('[data-action="remove-meli-image"]');
            if (!removeBtn) return;
            const idx = parseInt(removeBtn.dataset.idx, 10);
            if (!isNaN(idx)) {
                meliImagesList.splice(idx, 1);
                renderMeliImagesPreview();
            }
        });
    }

    // Submissão do Formulário de Criação no Mercado Livre
    if (meliCreateForm) {
        meliCreateForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const connectionId = meliCreateAccount ? meliCreateAccount.value : '';
            const title = meliCreateTitle ? meliCreateTitle.value.trim() : '';
            const categoryId = meliCreateCategoryId ? meliCreateCategoryId.value : '';
            const categoryName = meliCreateCategoryName ? meliCreateCategoryName.value : '';
            const price = meliCreatePrice ? parseFloat(meliCreatePrice.value) : 0;
            const stock = meliCreateStock ? parseInt(meliCreateStock.value, 10) : 1;
            const listingTypeId = meliCreateListingType ? meliCreateListingType.value : 'gold_special';
            const condition = meliCreateCondition ? meliCreateCondition.value : 'new';
            const sku = meliCreateSku ? meliCreateSku.value.trim() : '';
            const description = meliCreateDescription ? meliCreateDescription.value.trim() : '';
            const sourceType = meliCreateSourceType ? meliCreateSourceType.value : 'manual';
            const sourceId = meliCreateSourceId ? meliCreateSourceId.value : null;
            const markupPercent = meliCreateMarkup ? parseFloat(meliCreateMarkup.value) : 0;
            const syncAutoStock = meliCreateSyncStock ? meliCreateSyncStock.checked : false;
            const syncAutoPrice = meliCreateSyncPrice ? meliCreateSyncPrice.checked : false;

            if (!connectionId) {
                showToast('Selecione a conta do Mercado Livre para publicar.', 'warning');
                return;
            }
            if (!title) {
                showToast('Informe o título do anúncio.', 'warning');
                return;
            }
            if (!categoryId) {
                showToast('Selecione ou sugira a categoria do anúncio.', 'warning');
                return;
            }
            if (!price || price <= 0) {
                showToast('Informe um preço de venda válido.', 'warning');
                return;
            }
            if (meliImagesList.length === 0) {
                showToast('Adicione pelo menos uma URL de imagem para o anúncio.', 'warning');
                return;
            }

            if (meliSubmitPublishBtn) {
                meliSubmitPublishBtn.classList.add('loading');
                meliSubmitPublishBtn.disabled = true;
            }

            try {
                const payload = {
                    connectionId,
                    title,
                    category_id: categoryId,
                    category_name: categoryName,
                    price,
                    available_quantity: stock,
                    listing_type_id: listingTypeId,
                    condition,
                    sku,
                    description,
                    pictures: meliImagesList.map(u => ({ source: u })),
                    source_type: sourceType,
                    source_id: sourceId,
                    markup_percent: markupPercent,
                    sync_auto_stock: syncAutoStock,
                    sync_auto_price: syncAutoPrice
                };

                const res = await api('/api/marketplace/mercadolivre/items/create', 'POST', payload);
                showToast(`Anúncio publicado com sucesso no Mercado Livre! (ID: ${res.item?.id || ''})`, 'success');
                closeMeliCreateModal();

                // Se estiver na tela de anúncios, recarrega
                const activeNav = document.querySelector('.menu-links a.active');
                if (activeNav && activeNav.id === 'nav-meli-anuncios') {
                    renderMercadoLivreListings();
                }
            } catch (publishErr) {
                showToast(`Falha ao publicar anúncio: ${publishErr.message}`, 'error');
            } finally {
                if (meliSubmitPublishBtn) {
                    meliSubmitPublishBtn.classList.remove('loading');
                    meliSubmitPublishBtn.disabled = false;
                }
            }
        });
    }

    // Submissão do Formulário de Edição Rápida
    if (meliEditForm) {
        meliEditForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const itemId = meliEditItemId ? meliEditItemId.value : '';
            const connectionId = meliEditConnectionId ? meliEditConnectionId.value : '';
            const title = meliEditTitle ? meliEditTitle.value.trim() : '';
            const price = meliEditPrice ? parseFloat(meliEditPrice.value) : 0;
            const stock = meliEditStock ? parseInt(meliEditStock.value, 10) : 0;
            const status = meliEditStatus ? meliEditStatus.value : 'active';

            if (!itemId) return;

            if (meliEditSaveBtn) {
                meliEditSaveBtn.classList.add('loading');
                meliEditSaveBtn.disabled = true;
            }

            try {
                await api(`/api/marketplace/mercadolivre/items/${itemId}/update`, 'PUT', {
                    connectionId,
                    title,
                    price,
                    available_quantity: stock,
                    status
                });
                showToast('Anúncio atualizado com sucesso no Mercado Livre!', 'success');
                closeMeliEditModal();

                const activeNav = document.querySelector('.menu-links a.active');
                if (activeNav && activeNav.id === 'nav-meli-anuncios') {
                    renderMercadoLivreListings();
                }
            } catch (editErr) {
                showToast(`Erro ao atualizar: ${editErr.message}`, 'error');
            } finally {
                if (meliEditSaveBtn) {
                    meliEditSaveBtn.classList.remove('loading');
                    meliEditSaveBtn.disabled = false;
                }
            }
        });
    }

    /**
     * Listener para o formulário de teste de fornecedor (Pop-up Dismatal)
     */
    if (supplierTestForm) {
        supplierTestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const connId = supplierTestConnectionId ? supplierTestConnectionId.value : '';
            const searchTerm = supplierTestTerm ? supplierTestTerm.value.trim() : '';

            if (!searchTerm) {
                showToast('Informe o SKU do produto para testar.', 'warning');
                return;
            }

            if (supplierTestSubmitBtn) {
                supplierTestSubmitBtn.classList.add('loading');
                supplierTestSubmitBtn.disabled = true;
            }

            if (supplierTestResults) {
                supplierTestResults.innerHTML = `
                    <div class="loader-container" style="padding: 2.5rem 1rem;">
                        <div class="loader"></div>
                        <p style="font-size: 0.9rem;">Consultando produto no B2B do fornecedor via Puppeteer...</p>
                    </div>
                `;
            }

            try {
                const response = await api(`/api/supplier-connections/${connId}/products`, 'POST', { searchTerm });

                const products = response.products || response.produtos || [];
                if (!response.sucesso || products.length === 0) {
                    supplierTestResults.innerHTML = `
                        <div class="empty-state" style="padding: 2rem 1rem; margin: 0;">
                            <div class="empty-state-icon" style="color: var(--color-warning); background-color: var(--color-warning-light); width: 48px; height: 48px; font-size: 1.3rem;">
                                <i class="fas fa-box-open"></i>
                            </div>
                            <h4 style="font-size: 1.05rem; font-weight: 600;">Produto não localizado</h4>
                            <p style="font-size: 0.85rem; margin: 0;">Nenhum item retornado para o SKU "<strong>${searchTerm}</strong>".</p>
                        </div>
                    `;
                    showToast('Nenhum produto encontrado para este SKU.', 'warning');
                    return;
                }

                let productsHtml = '';
                products.forEach(p => {
                    const priceFormatted = (typeof p.price === 'number') 
                        ? `R$ ${p.price.toFixed(2)}` 
                        : (p.price ? `R$ ${p.price}` : 'Preço indisponível');
                    const rawPrice = typeof p.price === 'number' ? p.price : (p.preco || 0);
                    const stockVal = p.stock !== null && p.stock !== undefined ? p.stock : (p.estoque !== null && p.estoque !== undefined ? p.estoque : null);
                    const stockLabel = stockVal !== null ? `${stockVal} em estoque` : 'Estoque indisponível';
                    const hasStock = stockVal !== null ? Number(stockVal) > 0 : true;

                    const images = p.images || p.imagens || [];
                    const imgUrl = (Array.isArray(images) && images.length > 0) ? images[0] : (typeof images === 'string' ? images : null);

                    const encodedImages = encodeURIComponent(JSON.stringify(images));
                    const safeName = (p.name || '').replace(/"/g, '&quot;');
                    const skuVal = p.sku || searchTerm;

                    productsHtml += `
                        <div class="supplier-test-product-card">
                            <div class="supplier-test-img-container">
                                ${imgUrl 
                                    ? `<img src="${imgUrl}" alt="${p.name || 'Produto'}" class="supplier-test-img" onerror="this.parentElement.innerHTML='<i class=\'fas fa-box-open\' style=\'font-size: 2.2rem; color: var(--color-text-offset);\'></i>'">` 
                                    : `<i class="fas fa-box-open" style="font-size: 2.2rem; color: var(--color-text-offset);"></i>`}
                            </div>
                            <div class="supplier-test-details">
                                <h4 class="supplier-test-name">${p.name || 'Produto Sem Descrição'}</h4>
                                <div class="supplier-test-meta-row">
                                    <span class="sku-badge"><i class="fas fa-hashtag"></i> SKU: ${skuVal}</span>
                                    ${p.barcode ? `<span class="sku-badge"><i class="fas fa-barcode"></i> EAN: ${p.barcode}</span>` : ''}
                                    <span class="stock-badge ${hasStock ? 'in-stock' : 'out-of-stock'}">
                                        <i class="fas ${hasStock ? 'fa-check' : 'fa-xmark'}"></i> ${stockLabel}
                                    </span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.65rem;">
                                    <div class="supplier-test-price">${priceFormatted}</div>
                                    <button type="button" class="btn btn-small btn-meli" data-action="create-ad-from-supplier" data-sku="${skuVal}" data-name="${safeName}" data-price="${rawPrice}" data-stock="${stockVal !== null ? stockVal : 1}" data-images="${encodedImages}" data-conn-id="${connId}" title="Publicar este produto no Mercado Livre">
                                        <i class="fas fa-store"></i> Publicar no Mercado Livre
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                });

                supplierTestResults.innerHTML = productsHtml;
                showToast('Produto consultado e retornado com sucesso!', 'success');
            } catch (err) {
                supplierTestResults.innerHTML = `
                    <div class="empty-state" style="padding: 2rem 1rem; margin: 0;">
                        <div class="empty-state-icon" style="color: var(--color-danger); background-color: var(--color-danger-light); width: 48px; height: 48px; font-size: 1.3rem;">
                            <i class="fas fa-triangle-exclamation"></i>
                        </div>
                        <h4 style="font-size: 1.05rem; font-weight: 600;">Falha na consulta</h4>
                        <p style="font-size: 0.85rem; margin: 0; color: var(--color-danger);">${err.message}</p>
                    </div>
                `;
                showToast(`Erro na busca: ${err.message}`, 'error');
            } finally {
                if (supplierTestSubmitBtn) {
                    supplierTestSubmitBtn.classList.remove('loading');
                    supplierTestSubmitBtn.disabled = false;
                }
            }
        });
    }

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
        if (cleanType === 'mercadolivre' || cleanType === 'meli') return '/assets/logos/mercadolivre.svg';
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

    const generateSupplierForm = (conn = {}) => {
        const creds = conn.credentials || {};
        // Define valores padrão para Dismatal
        const defaultUrl = "https://www.dismatal.com.br";
        const defaultUsername = "";
        const defaultPassword = "";
        
        const fragment = document.createDocumentFragment();

        const idInput = document.createElement('input');
        idInput.type = 'hidden';
        idInput.name = 'id';
        idInput.value = conn.id || '';
        fragment.appendChild(idInput);

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.id = 'name';
        nameInput.name = 'name';
        nameInput.className = 'form-control';
        nameInput.placeholder = 'Ex: Dismatal Distribuidora';
        nameInput.value = conn.name || 'Dismatal';
        nameInput.required = true;
        fragment.appendChild(createFormGroup('Nome do Fornecedor', nameInput));

        const typeSelect = document.createElement('select');
        typeSelect.id = 'type';
        typeSelect.name = 'type';
        typeSelect.className = 'form-control';
        typeSelect.required = true;
        typeSelect.innerHTML = `
            <option value="dismatal_webscraper" selected>Dismatal (Web Scraper Automatizado)</option>
        `;
        fragment.appendChild(createFormGroup('Tipo de Integração', typeSelect));

        // Campos separados para URL, Usuário e Senha
        const urlInput = document.createElement('input');
        urlInput.type = 'url';
        urlInput.id = 'url';
        urlInput.name = 'url';
        urlInput.className = 'form-control';
        urlInput.placeholder = 'Ex: https://www.dismatal.com.br';
        urlInput.value = creds.url || defaultUrl;
        urlInput.required = true;
        fragment.appendChild(createFormGroup('URL do Portal', urlInput, 'Endereço do portal B2B do fornecedor.'));

        const usernameInput = document.createElement('input');
        usernameInput.type = 'text';
        usernameInput.id = 'username';
        usernameInput.name = 'username';
        usernameInput.className = 'form-control';
        usernameInput.placeholder = 'Usuário de acesso';
        usernameInput.value = creds.username || defaultUsername;
        usernameInput.required = true;
        fragment.appendChild(createFormGroup('Usuário', usernameInput));

        const passwordInput = document.createElement('input');
        passwordInput.type = 'password';
        passwordInput.id = 'password';
        passwordInput.name = 'password';
        passwordInput.className = 'form-control';
        passwordInput.placeholder = 'Senha de acesso';
        passwordInput.value = creds.password || defaultPassword;
        passwordInput.required = true;
        fragment.appendChild(createFormGroup('Senha', passwordInput));

        return fragment;
    };

    const generateMarketplaceForm = (conn = {}) => {
        const creds = conn.credentials || {};
        const fragment = document.createDocumentFragment();

        const idInput = document.createElement('input');
        idInput.type = 'hidden';
        idInput.name = 'id';
        idInput.value = conn.id || '';
        fragment.appendChild(idInput);

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.id = 'name';
        nameInput.name = 'name';
        nameInput.className = 'form-control';
        nameInput.placeholder = 'Ex: Minha Loja Mercado Livre';
        nameInput.value = conn.name || 'Mercado Livre';
        nameInput.required = true;
        fragment.appendChild(createFormGroup('Nome da Conta / Identificação', nameInput));

        const typeSelect = document.createElement('select');
        typeSelect.id = 'type';
        typeSelect.name = 'type';
        typeSelect.className = 'form-control';
        typeSelect.required = true;
        typeSelect.innerHTML = `
            <option value="mercadolivre" selected>Mercado Livre (OAuth 2.0 Oficial)</option>
        `;
        fragment.appendChild(createFormGroup('Marketplace', typeSelect));

        const clientIdInput = document.createElement('input');
        clientIdInput.type = 'text';
        clientIdInput.id = 'client_id';
        clientIdInput.name = 'client_id';
        clientIdInput.className = 'form-control';
        clientIdInput.placeholder = 'App ID / Client ID (Ex: 1234567890123456)';
        clientIdInput.value = creds.client_id || '';
        clientIdInput.required = true;
        fragment.appendChild(createFormGroup('App ID / Client ID', clientIdInput, 'Obtido no portal Mercado Livre Developers (developers.mercadolivre.com.br)'));

        const clientSecretInput = document.createElement('input');
        clientSecretInput.type = 'password';
        clientSecretInput.id = 'client_secret';
        clientSecretInput.name = 'client_secret';
        clientSecretInput.className = 'form-control';
        clientSecretInput.placeholder = 'Client Secret Key';
        clientSecretInput.value = creds.client_secret || '';
        clientSecretInput.required = true;
        fragment.appendChild(createFormGroup('Client Secret', clientSecretInput, 'Chave secreta da aplicação no Mercado Livre Developers'));

        const redirectUriInput = document.createElement('input');
        redirectUriInput.type = 'text';
        redirectUriInput.id = 'redirect_uri';
        redirectUriInput.name = 'redirect_uri';
        redirectUriInput.className = 'form-control';
        redirectUriInput.placeholder = 'Ex: http://localhost:3000/api/marketplace/callback';
        redirectUriInput.value = creds.redirect_uri || (window.location.origin + '/api/marketplace/callback');
        redirectUriInput.required = true;
        fragment.appendChild(createFormGroup('URI de Redirecionamento Callback', redirectUriInput, 'URL cadastrada em Redirect URI no painel do Mercado Livre'));

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

    /**
     * =================================================================
     * 1. DASHBOARD / HOME PAGE
     * =================================================================
     */
    const renderWelcomePage = async () => {
        mainTitle.textContent = 'Dashboard Integrador';
        if (mainSubtitle) mainSubtitle.textContent = 'Visão geral das integrações ativas, catálogo de produtos e marketplace Mercado Livre';
        headerActions.innerHTML = `
            <button class="btn btn-primary" data-action="open-create-ad-modal">
                <i class="fas fa-store"></i> Criar Anúncio ML
            </button>
            <button class="btn btn-secondary" data-action="add-erp">
                <i class="fas fa-plus"></i> Novo ERP
            </button>
        `;

        showLoading('Carregando métricas e conexões...');

        try {
            const [erpRes, supRes, meliConnRes, meliItemsRes] = await Promise.all([
                api('/api/erp-connections').catch(() => ({ connections: [] })),
                api('/api/supplier-connections').catch(() => ({ connections: [] })),
                api('/api/marketplace-connections').catch(() => ({ connections: [] })),
                api('/api/marketplace/mercadolivre/items').catch(() => ({ items: [] }))
            ]);

            const erpConnections = erpRes.connections || [];
            const supplierConnections = supRes.connections || [];
            const meliConnections = meliConnRes.connections || [];
            const meliItems = meliItemsRes.items || [];

            const connectedErps = erpConnections.filter(c => c.status === 'connected').length;
            const connectedMelis = meliConnections.filter(c => c.status === 'connected').length;
            const activeMeliAds = meliItems.filter(i => i.status === 'active').length;

            let html = `
                <!-- Hero Banner -->
                <div class="dashboard-hero">
                    <div class="hero-content">
                        <span class="hero-badge"><i class="fas fa-circle-nodes"></i> Hub Central de Integrações & Marketplace</span>
                        <h2 class="hero-title">Bem-vindo ao Integrador ERP & Mercado Livre</h2>
                        <p class="hero-description">
                            Importe produtos de ERPs e fornecedores, publique anúncios no Mercado Livre e sincronize estoque e preços em tempo real.
                        </p>
                        <div class="hero-actions">
                            <button class="btn btn-meli" data-action="nav-goto-meli-ads">
                                <i class="fas fa-store"></i> Gerenciar Anúncios ML (${meliItems.length})
                            </button>
                            <button class="btn btn-primary" data-action="nav-goto-products">
                                <i class="fas fa-boxes-stacked"></i> Consultar Catálogo ERP
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
                            <span class="stat-label">Conexões ERP (${connectedErps} ativas)</span>
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
                        <div class="stat-icon-wrapper" style="background-color: rgba(255, 230, 0, 0.2); color: #2D3277;">
                            <i class="fas fa-store"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value">${meliConnections.length}</span>
                            <span class="stat-label">Contas Mercado Livre (${connectedMelis} auth)</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon-wrapper stat-icon-green">
                            <i class="fas fa-rectangle-ad"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value">${activeMeliAds}</span>
                            <span class="stat-label">Anúncios ML Ativos (${meliItems.length} total)</span>
                        </div>
                    </div>
                </div>

                <!-- Seção Mercado Livre -->
                <div class="dashboard-section">
                    <div class="section-header">
                        <h3 class="section-title"><i class="fas fa-store" style="color: #FFE600;"></i> Marketplace Mercado Livre</h3>
                        <a href="#" class="section-link" data-action="nav-goto-meli-ads">Ver todos os anúncios <i class="fas fa-arrow-right"></i></a>
                    </div>
            `;

            if (meliConnections.length === 0) {
                html += `
                    <div class="empty-state">
                        <div class="empty-state-icon" style="color: #2D3277; background-color: rgba(255, 230, 0, 0.25);">
                            <i class="fas fa-store"></i>
                        </div>
                        <h3>Nenhuma conta do Mercado Livre conectada</h3>
                        <p>Cadastre suas credenciais do Mercado Livre Developers (App ID e Secret) para publicar anúncios e sincronizar preços/estoques.</p>
                        <button class="btn btn-meli" data-action="add-marketplace">
                            <i class="fas fa-plus"></i> Conectar Mercado Livre
                        </button>
                    </div>
                `;
            } else if (meliItems.length === 0) {
                html += `
                    <div class="empty-state">
                        <div class="empty-state-icon" style="color: var(--color-primary); background-color: var(--color-primary-light);">
                            <i class="fas fa-boxes-packing"></i>
                        </div>
                        <h3>Nenhum anúncio cadastrado no integrador</h3>
                        <p>Publique seu primeiro anúncio a partir do catálogo de produtos do ERP, do scraper Dismatal ou importe seus anúncios existentes do Mercado Livre.</p>
                        <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
                            <button class="btn btn-meli" data-action="open-create-ad-modal">
                                <i class="fas fa-paper-plane"></i> Criar Novo Anúncio
                            </button>
                            <button class="btn btn-secondary" data-action="import-meli-items" data-conn-id="${meliConnections[0].id}">
                                <i class="fas fa-cloud-arrow-down"></i> Importar do Mercado Livre
                            </button>
                        </div>
                    </div>
                `;
            } else {
                html += '<div class="connections-grid">';
                meliItems.slice(0, 3).forEach(item => {
                    const thumb = item.thumbnail || '/assets/logos/default-erp.svg';
                    const isPaused = item.status === 'paused';
                    const isActive = item.status === 'active';
                    const statusClass = isActive ? 'status-connected' : (isPaused ? 'status-requires_auth' : 'status-disconnected');
                    const statusText = isActive ? 'Ativo' : (isPaused ? 'Pausado' : item.status);

                    html += `
                        <div class="connection-card">
                            <div class="card-header">
                                <div class="logo-container" style="width: 48px; height: 48px;">
                                    <img src="${thumb}" alt="${item.title}" class="brand-logo-img" style="object-fit: contain;" onerror="this.src='/assets/logos/default-erp.svg'">
                                </div>
                                <span class="status-pill ${statusClass}"><span class="status-dot"></span> ${statusText}</span>
                            </div>
                            <div class="card-body">
                                <div class="card-title-row">
                                    <h4 class="card-title" style="font-size: 0.95rem; line-height: 1.3;" title="${item.title}">${item.title.substring(0, 45)}...</h4>
                                </div>
                                <ul class="card-details-list">
                                    <li class="card-details-item">
                                        <span class="detail-label">MLB ID:</span>
                                        <span class="detail-val"><code>${item.item_id}</code></span>
                                    </li>
                                    <li class="card-details-item">
                                        <span class="detail-label">Preço:</span>
                                        <span class="detail-val" style="font-weight: 700; color: var(--color-text);">R$ ${parseFloat(item.price).toFixed(2)}</span>
                                    </li>
                                    <li class="card-details-item">
                                        <span class="detail-label">Estoque:</span>
                                        <span class="detail-val">${item.available_quantity} un.</span>
                                    </li>
                                </ul>
                            </div>
                            <div class="card-footer">
                                <div class="card-footer-actions-left">
                                    ${item.permalink ? `<a href="${item.permalink}" target="_blank" class="btn btn-small btn-secondary" title="Ver no Mercado Livre"><i class="fas fa-external-link"></i> Ver no ML</a>` : ''}
                                </div>
                                <div class="card-footer-actions-right">
                                    <button class="card-action-btn" data-action="edit-meli-item" data-item="${encodeURIComponent(JSON.stringify(item))}" data-tooltip="Editar Anúncio">
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
                                    <button class="btn btn-small btn-primary" data-action="test-scraper-link" data-id="${conn.id}" data-name="${conn.name}" title="Buscar produto no Scraper via Pop-up">
                                        <i class="fas fa-vial"></i> Testar
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
        mainTitle.textContent = 'ERPs';
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
        mainTitle.textContent = 'Fornecedores';
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
                                <button class="btn btn-small btn-primary" data-action="test-scraper-link" data-id="${conn.id}" data-name="${conn.name}" title="Abrir pop-up para buscar e testar produto no Scraper">
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
     * 3.1 ANÚNCIOS MERCADO LIVRE (GERENCIADOR & SINCRONIZAÇÃO)
     * =================================================================
     */
    const renderMercadoLivreListings = async () => {
        mainTitle.textContent = 'Anúncios Mercado Livre';
        if (mainSubtitle) mainSubtitle.textContent = 'Gerencie, altere preços/estoques, sincronize e monitore seus anúncios no Mercado Livre';
        headerActions.innerHTML = `
            <button class="btn btn-meli" data-action="open-create-ad-modal">
                <i class="fas fa-plus"></i> Novo Anúncio
            </button>
            <button class="btn btn-secondary" data-action="import-meli-items" title="Importar anúncios existentes diretamente da conta ML">
                <i class="fas fa-cloud-arrow-down"></i> Importar do ML
            </button>
            <button class="btn btn-secondary" data-action="nav-goto-meli-accounts">
                <i class="fas fa-key"></i> Contas ML
            </button>
        `;

        showLoading('Carregando anúncios do Mercado Livre...');

        try {
            const [itemsRes, connRes] = await Promise.all([
                api('/api/marketplace/mercadolivre/items'),
                api('/api/marketplace-connections').catch(() => ({ connections: [] }))
            ]);

            const items = itemsRes.items || [];
            const connections = (connRes.connections || []).filter(c => c.type === 'mercadolivre');

            if (connections.length === 0) {
                pageContent.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon" style="background-color: rgba(255, 230, 0, 0.2); color: #2D3277;">
                            <i class="fas fa-store"></i>
                        </div>
                        <h3>Nenhuma conta do Mercado Livre conectada</h3>
                        <p>Para criar e gerenciar anúncios, primeiro cadastre e autorize sua conta do Mercado Livre.</p>
                        <button class="btn btn-meli" data-action="add-marketplace">
                            <i class="fas fa-plus"></i> Conectar Conta do Mercado Livre
                        </button>
                    </div>
                `;
                return;
            }

            const accountsOptions = connections.map(c => `
                <option value="${c.id}">${c.name} (${c.credentials?.nickname ? '@' + c.credentials.nickname : '#' + c.id})</option>
            `).join('');

            let html = `
                <div class="search-filter-card">
                    <div class="filter-form-grid" style="grid-template-columns: 2fr 1.2fr 1.2fr auto;">
                        <div class="form-group" style="margin: 0;">
                            <label for="meli-filter-search"><i class="fas fa-magnifying-glass"></i> Buscar por Título, SKU ou MLB ID</label>
                            <input type="search" id="meli-filter-search" class="form-control" placeholder="Digite para filtrar instantaneamente...">
                        </div>
                        <div class="form-group" style="margin: 0;">
                            <label for="meli-filter-status"><i class="fas fa-toggle-on"></i> Status</label>
                            <select id="meli-filter-status" class="form-control">
                                <option value="">Todos os Status</option>
                                <option value="active">🟢 Ativos</option>
                                <option value="paused">🟠 Pausados</option>
                                <option value="closed">🔴 Finalizados</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin: 0;">
                            <label for="meli-filter-account"><i class="fas fa-user-tag"></i> Conta ML</label>
                            <select id="meli-filter-account" class="form-control">
                                <option value="">Todas as Contas</option>
                                ${accountsOptions}
                            </select>
                        </div>
                        <div class="form-group" style="margin: 0; align-self: flex-end;">
                            <button type="button" class="btn btn-secondary" id="meli-filter-refresh-btn" style="height: 42px;" title="Atualizar listagem">
                                <i class="fas fa-rotate"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div id="meli-listings-container" class="results-container">
            `;

            const renderTable = (listings) => {
                if (listings.length === 0) {
                    return `
                        <div class="empty-state">
                            <div class="empty-state-icon" style="color: var(--color-warning); background-color: var(--color-warning-light);">
                                <i class="fas fa-box-open"></i>
                            </div>
                            <h3>Nenhum anúncio encontrado</h3>
                            <p>Não há anúncios correspondentes aos filtros aplicados. Publique novos anúncios ou sincronize com sua conta do Mercado Livre.</p>
                            <button class="btn btn-meli" data-action="open-create-ad-modal">
                                <i class="fas fa-plus"></i> Criar Anúncio Agora
                            </button>
                        </div>
                    `;
                }

                const rows = listings.map(item => {
                    const thumb = item.thumbnail || '/assets/logos/default-erp.svg';
                    const isPaused = item.status === 'paused';
                    const isActive = item.status === 'active';
                    const statusClass = isActive ? 'status-connected' : (isPaused ? 'status-requires_auth' : 'status-disconnected');
                    const statusText = isActive ? 'Ativo' : (isPaused ? 'Pausado' : (item.status === 'closed' ? 'Finalizado' : item.status));
                    const isClassic = item.listing_type_id === 'gold_special';
                    const listingBadge = isClassic
                        ? '<span class="listing-type-badge listing-type-gold_special"><i class="fas fa-bolt"></i> Clássico</span>'
                        : '<span class="listing-type-badge listing-type-gold_pro"><i class="fas fa-crown"></i> Premium</span>';

                    const hasSource = item.source_type && item.source_type !== 'manual';
                    const sourceTag = hasSource
                        ? `<span class="sku-badge" style="background-color: var(--color-primary-light); color: var(--color-primary);" title="Origem: ${item.source_type.toUpperCase()}"><i class="fas fa-link"></i> ${item.source_type.toUpperCase()}</span>`
                        : '';

                    const inStock = item.available_quantity > 0;

                    return `
                        <tr data-item-id="${item.item_id}">
                            <td style="width: 54px; text-align: center;">
                                <img src="${thumb}" alt="${item.title}" class="meli-table-img" onerror="this.src='/assets/logos/default-erp.svg'">
                            </td>
                            <td>
                                <div style="display: flex; flex-direction: column; gap: 0.2rem;">
                                    <div style="font-weight: 600; color: var(--color-text); font-size: 0.92rem;">
                                        ${item.permalink ? `<a href="${item.permalink}" target="_blank" style="text-decoration: none; color: inherit;" title="Abrir no Mercado Livre">${item.title} <i class="fas fa-arrow-up-right-from-square" style="font-size: 0.72rem; color: var(--color-text-offset);"></i></a>` : item.title}
                                    </div>
                                    <div style="display: flex; gap: 0.5rem; align-items: center; font-size: 0.78rem;">
                                        <span style="color: var(--color-text-offset);">MLB: <code>${item.item_id}</code></span>
                                        ${item.connection_name ? `<span style="color: var(--color-text-muted);">| Conta: ${item.connection_name}</span>` : ''}
                                        ${sourceTag}
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span class="sku-badge">${item.sku || 'N/A'}</span>
                            </td>
                            <td>
                                <div style="display: flex; flex-direction: column;">
                                    <span class="price-text" style="font-size: 0.98rem; font-weight: 700;">R$ ${parseFloat(item.price).toFixed(2)}</span>
                                    ${item.markup_percent > 0 ? `<small style="color: var(--color-success); font-size: 0.74rem;">+${item.markup_percent}% markup</small>` : ''}
                                </div>
                            </td>
                            <td>
                                <span class="stock-badge ${inStock ? 'in-stock' : 'out-of-stock'}">
                                    <i class="fas ${inStock ? 'fa-check' : 'fa-xmark'}"></i> ${item.available_quantity} un.
                                </span>
                            </td>
                            <td>${listingBadge}</td>
                            <td>
                                <span class="status-pill ${statusClass}"><span class="status-dot"></span> ${statusText}</span>
                            </td>
                            <td style="text-align: right; white-space: nowrap;">
                                <div style="display: inline-flex; gap: 0.35rem; align-items: center;">
                                    ${isActive ? `
                                        <button class="card-action-btn" data-action="toggle-meli-status" data-item-id="${item.item_id}" data-current-status="active" data-conn-id="${item.connection_id}" data-tooltip="Pausar Anúncio">
                                            <i class="fas fa-pause"></i>
                                        </button>
                                    ` : `
                                        <button class="card-action-btn" data-action="toggle-meli-status" data-item-id="${item.item_id}" data-current-status="paused" data-conn-id="${item.connection_id}" data-tooltip="Ativar Anúncio" style="color: var(--color-success);">
                                            <i class="fas fa-play"></i>
                                        </button>
                                    `}
                                    ${hasSource ? `
                                        <button class="card-action-btn" data-action="sync-meli-item" data-item-id="${item.item_id}" data-tooltip="Sincronizar com Origem (${item.source_type.toUpperCase()})" style="color: var(--color-info);">
                                            <i class="fas fa-rotate"></i>
                                        </button>
                                    ` : ''}
                                    <button class="card-action-btn" data-action="edit-meli-item" data-item="${encodeURIComponent(JSON.stringify(item))}" data-tooltip="Editar Preço / Estoque">
                                        <i class="fas fa-pencil"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('');

                return `
                    <div class="results-card">
                        <div class="table-responsive">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Foto</th>
                                        <th>Título e Identificação</th>
                                        <th>SKU</th>
                                        <th>Preço de Venda</th>
                                        <th>Estoque</th>
                                        <th>Tipo</th>
                                        <th>Status</th>
                                        <th style="text-align: right;">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rows}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            };

            html += renderTable(items);
            html += '</div>';

            pageContent.innerHTML = html;

            // Filtros dinâmicos no frontend
            const searchInput = document.getElementById('meli-filter-search');
            const statusSelect = document.getElementById('meli-filter-status');
            const accountSelect = document.getElementById('meli-filter-account');
            const listingsContainer = document.getElementById('meli-listings-container');
            const refreshBtn = document.getElementById('meli-filter-refresh-btn');

            const applyFilters = () => {
                const term = (searchInput?.value || '').toLowerCase().trim();
                const status = statusSelect?.value || '';
                const account = accountSelect?.value || '';

                const filtered = items.filter(i => {
                    const matchTerm = !term || 
                        (i.title && i.title.toLowerCase().includes(term)) || 
                        (i.sku && i.sku.toLowerCase().includes(term)) || 
                        (i.item_id && i.item_id.toLowerCase().includes(term));
                    const matchStatus = !status || (i.status === status);
                    const matchAccount = !account || (String(i.connection_id) === String(account));
                    return matchTerm && matchStatus && matchAccount;
                });

                if (listingsContainer) listingsContainer.innerHTML = renderTable(filtered);
            };

            if (searchInput) searchInput.addEventListener('input', applyFilters);
            if (statusSelect) statusSelect.addEventListener('change', applyFilters);
            if (accountSelect) accountSelect.addEventListener('change', applyFilters);
            if (refreshBtn) refreshBtn.addEventListener('click', () => renderMercadoLivreListings());

        } catch (error) {
            renderError(error);
        }
    };

    /**
     * =================================================================
     * 3.2 CONEXÕES MERCADO LIVRE (CONTAS OAUTH)
     * =================================================================
     */
    const renderMarketplaceConnections = async () => {
        mainTitle.textContent = 'Contas Mercado Livre';
        if (mainSubtitle) mainSubtitle.textContent = 'Gerencie suas credenciais de desenvolvedor e autorize suas contas do Mercado Livre via OAuth 2.0';
        headerActions.innerHTML = `
            <button class="btn btn-meli" data-action="add-marketplace">
                <i class="fas fa-plus"></i> Adicionar Conta ML
            </button>
        `;

        showLoading('Buscando contas do Mercado Livre...');

        try {
            const { connections } = await api('/api/marketplace-connections');
            const meliConnections = (connections || []).filter(c => c.type === 'mercadolivre');

            if (meliConnections.length === 0) {
                pageContent.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon" style="background-color: rgba(255, 230, 0, 0.2); color: #2D3277;">
                            <i class="fas fa-store"></i>
                        </div>
                        <h3>Nenhuma conta do Mercado Livre configurada</h3>
                        <p>Adicione sua aplicação criada no Mercado Livre Developers com o App ID (Client ID) e Client Secret.</p>
                        <button class="btn btn-meli" data-action="add-marketplace">
                            <i class="fas fa-plus"></i> Adicionar Conta Mercado Livre
                        </button>
                    </div>
                `;
                return;
            }

            let cardsHtml = '<div class="connections-grid">';
            meliConnections.forEach(conn => {
                const isConnected = conn.status === 'connected';
                const nickname = conn.credentials?.nickname;
                const siteId = conn.credentials?.site_id || 'MLB';

                cardsHtml += `
                    <div class="connection-card" data-conn-id="${conn.id}">
                        <div class="card-header">
                            <div class="logo-container" title="Mercado Livre">
                                <img src="/assets/logos/mercadolivre.svg" alt="${conn.name}" class="brand-logo-img" onerror="this.src='/assets/logos/default-erp.svg'">
                            </div>
                            ${formatStatusBadge(conn.status)}
                        </div>
                        <div class="card-body">
                            <div class="card-title-row">
                                <h3 class="card-title">${conn.name}</h3>
                                <span class="type-tag" style="background-color: rgba(255, 230, 0, 0.25); color: #2D3277; font-weight: 700;">MERCADO LIVRE</span>
                            </div>
                            <ul class="card-details-list">
                                <li class="card-details-item">
                                    <span class="detail-label">Identificador:</span>
                                    <span class="detail-val">#${conn.id}</span>
                                </li>
                                ${nickname ? `
                                <li class="card-details-item">
                                    <span class="detail-label">Vendedor:</span>
                                    <span class="detail-val"><strong>@${nickname}</strong> (${siteId})</span>
                                </li>` : ''}
                                <li class="card-details-item">
                                    <span class="detail-label">App ID / Client:</span>
                                    <span class="detail-val"><code>${conn.credentials?.client_id || 'N/A'}</code></span>
                                </li>
                                <li class="card-details-item">
                                    <span class="detail-label">Autenticação:</span>
                                    <span class="detail-val">OAuth 2.0 Oficial</span>
                                </li>
                            </ul>
                        </div>
                        <div class="card-footer">
                            <div class="card-footer-actions-left">
                                <button class="btn btn-small ${isConnected ? 'btn-secondary' : 'btn-meli'}" data-action="auth-meli" data-id="${conn.id}" title="Autenticar conta no Mercado Livre via OAuth">
                                    <i class="fas fa-key"></i> ${isConnected ? 'Reautorizar' : 'Autorizar Login ML'}
                                </button>
                                <button class="btn btn-small btn-primary" data-action="nav-goto-meli-ads" title="Ver anúncios desta conta">
                                    <i class="fas fa-rectangle-ad"></i> Anúncios
                                </button>
                            </div>
                            <div class="card-footer-actions-right">
                                <button class="card-action-btn" data-action="edit-marketplace" data-id="${conn.id}" data-tooltip="Editar Conta">
                                    <i class="fas fa-pencil"></i>
                                </button>
                                <button class="card-action-btn danger" data-action="remove-marketplace" data-id="${conn.id}" data-tooltip="Excluir Conta">
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
                        const rawPrice = typeof p.price === 'number' ? p.price : (parseFloat(String(p.price).replace(/[^\d.,]/g, '').replace(',', '.')) || 0);
                        const stock = p.stock !== null && p.stock !== undefined ? p.stock : 'N/D';
                        const inStock = typeof stock === 'number' ? stock > 0 : true;
                        const safeName = (p.name || '').replace(/"/g, '&quot;');
                        const safeSku = p.sku || '';

                        return `
                            <tr>
                                <td><span class="sku-badge">${safeSku || 'N/A'}</span></td>
                                <td><strong>${p.name || 'Sem nome'}</strong></td>
                                <td>
                                    <span class="stock-badge ${inStock ? 'in-stock' : 'out-of-stock'}">
                                        <i class="fas ${inStock ? 'fa-check' : 'fa-xmark'}"></i> ${stock} un.
                                    </span>
                                </td>
                                <td><span class="price-text">${price}</span></td>
                                <td style="text-align: right;">
                                    <button type="button" class="btn btn-small btn-meli" data-action="create-ad-from-erp" data-sku="${safeSku}" data-name="${safeName}" data-price="${rawPrice}" data-stock="${stock !== 'N/D' ? stock : 1}" data-conn-id="${connectionId}" title="Publicar este produto no Mercado Livre">
                                        <i class="fas fa-store"></i> Criar Anúncio ML
                                    </button>
                                </td>
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
                                            <th style="text-align: right;">Ações Mercado Livre</th>
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

        const { action, id, name, itemId, currentStatus, connId, sku, price, stock, images, item } = actionButton.dataset;

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
        if (action === 'nav-goto-meli-ads') {
            setActiveNavLink('nav-meli-anuncios');
            renderMercadoLivreListings();
            return;
        }
        if (action === 'nav-goto-meli-accounts') {
            setActiveNavLink('nav-meli-conexoes');
            renderMarketplaceConnections();
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

        // 4. Autenticação OAuth do Mercado Livre
        if (action === 'auth-meli') {
            actionButton.classList.add('loading');
            actionButton.disabled = true;
            try {
                const res = await api(`/api/marketplace/auth/${id}/mercadolivre`);
                if (res.url) {
                    showToast('Redirecionando para o Mercado Livre para autorização oficial...', 'info');
                    window.location.href = res.url;
                } else {
                    showToast('URL de autorização não retornada pelo servidor.', 'error');
                }
            } catch (authError) {
                showToast(`Falha ao iniciar OAuth do Mercado Livre: ${authError.message}`, 'error');
            } finally {
                actionButton.classList.remove('loading');
                actionButton.disabled = false;
            }
            return;
        }

        // 5. Testar Conexão / Buscar Produto do Fornecedor em POP-UP NA MESMA TELA
        if (action === 'test-scraper-link') {
            e.preventDefault();
            e.stopPropagation();
            openSupplierTestModal(id, name || 'Dismatal');
            return;
        }

        // 6. Ações do Mercado Livre (Criar, Editar, Pausar/Ativar, Sincronizar, Importar)
        if (action === 'open-create-ad-modal') {
            openMeliCreateModal();
            return;
        }

        if (action === 'create-ad-from-erp') {
            const rawPrice = parseFloat(price) || 0;
            const rawStock = parseInt(stock, 10) || 1;
            openMeliCreateModal({
                source_type: 'erp',
                source_id: connId || '',
                source_name: 'ERP',
                sku: sku || '',
                name: name || '',
                price: rawPrice,
                stock: rawStock
            });
            return;
        }

        if (action === 'create-ad-from-supplier') {
            let parsedImages = [];
            try {
                if (images) parsedImages = JSON.parse(decodeURIComponent(images));
            } catch (err) {
                parsedImages = [];
            }

            const rawPrice = parseFloat(price) || 0;
            const rawStock = parseInt(stock, 10) || 1;
            openMeliCreateModal({
                source_type: 'supplier',
                source_id: connId || '',
                source_name: 'Dismatal',
                sku: sku || '',
                name: name || '',
                price: rawPrice,
                stock: rawStock,
                images: parsedImages
            });
            return;
        }

        if (action === 'edit-meli-item') {
            try {
                const itemObj = JSON.parse(decodeURIComponent(item));
                openMeliEditModal(itemObj);
            } catch (err) {
                showToast('Erro ao carregar dados para edição.', 'error');
            }
            return;
        }

        if (action === 'toggle-meli-status') {
            const newStatus = currentStatus === 'active' ? 'paused' : 'active';
            const actionLabel = newStatus === 'active' ? 'Reativando' : 'Pausando';
            actionButton.classList.add('loading');
            actionButton.disabled = true;

            try {
                await api(`/api/marketplace/mercadolivre/items/${itemId}/status`, 'PUT', {
                    newStatus,
                    connectionId: connId
                });
                showToast(`Anúncio ${newStatus === 'active' ? 'reativado' : 'pausado'} com sucesso no Mercado Livre!`, 'success');
                renderMercadoLivreListings();
            } catch (err) {
                showToast(`Falha ao alterar status: ${err.message}`, 'error');
            } finally {
                actionButton.classList.remove('loading');
                actionButton.disabled = false;
            }
            return;
        }

        if (action === 'sync-meli-item') {
            actionButton.classList.add('loading');
            actionButton.disabled = true;
            try {
                const syncRes = await api(`/api/marketplace/mercadolivre/items/${itemId}/sync-from-source`, 'POST');
                showToast(syncRes.mensagem || 'Estoque e preço sincronizados com sucesso!', 'success');
                renderMercadoLivreListings();
            } catch (err) {
                showToast(`Erro na sincronização: ${err.message}`, 'error');
            } finally {
                actionButton.classList.remove('loading');
                actionButton.disabled = false;
            }
            return;
        }

        if (action === 'import-meli-items') {
            actionButton.classList.add('loading');
            actionButton.disabled = true;

            try {
                const { connections } = await api('/api/marketplace-connections');
                const meliConnections = (connections || []).filter(c => c.type === 'mercadolivre' && c.status === 'connected');
                
                if (meliConnections.length === 0) {
                    showToast('Nenhuma conta do Mercado Livre autenticada. Autorize sua conta antes de importar.', 'warning');
                    return;
                }

                const targetConnId = connId || meliConnections[0].id;
                showToast('Importando anúncios do Mercado Livre...', 'info');

                const importRes = await api('/api/marketplace/mercadolivre/items/import-from-meli', 'POST', {
                    connectionId: targetConnId
                });

                showToast(`Importação concluída! ${importRes.importados || 0} anúncios importados/atualizados.`, 'success');
                renderMercadoLivreListings();
            } catch (err) {
                showToast(`Falha na importação: ${err.message}`, 'error');
            } finally {
                actionButton.classList.remove('loading');
                actionButton.disabled = false;
            }
            return;
        }

        // 7. Ações de CRUD (Adicionar, Editar, Remover Conexões de ERP, Fornecedor e Marketplace)
        const isMarketplace = action.includes('marketplace');
        const isErp = action.includes('erp');
        const type = isMarketplace ? 'marketplace' : (isErp ? 'erp' : 'supplier');
        const typeTitle = isMarketplace ? 'Marketplace Mercado Livre' : (isErp ? 'ERP' : 'Fornecedor');
        const endpoint = isMarketplace ? '/api/marketplace-connections' : (isErp ? '/api/erp-connections' : '/api/supplier-connections');
        const renderFn = isMarketplace ? renderMarketplaceConnections : (isErp ? renderErpConnections : renderSupplierConnections);

        try {
            // ADICIONAR
            if (action.startsWith('add')) {
                modalTitle.textContent = `Adicionar Conexão de ${typeTitle}`;
                modalSubtitle.textContent = `Configure os parâmetros de integração com ${typeTitle}`;
                modalIconBadge.innerHTML = `<i class="fas ${isMarketplace ? 'fa-store' : (isErp ? 'fa-server' : 'fa-truck-fast')}"></i>`;
                
                formFields.innerHTML = '';
                if (isMarketplace) {
                    formFields.appendChild(generateMarketplaceForm());
                } else if (isErp) {
                    formFields.appendChild(generateErpForm());
                } else {
                    formFields.appendChild(generateSupplierForm());
                }
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

                        if (isMarketplace) {
                            body.credentials = {
                                client_id: formData.get('client_id'),
                                client_secret: formData.get('client_secret'),
                                redirect_uri: formData.get('redirect_uri')
                            };
                        } else if (isErp) {
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
                            body.credentials = {
                                url: formData.get('url'),
                                username: formData.get('username'),
                                password: formData.get('password'),
                            };
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
                if (isMarketplace) {
                    formFields.appendChild(generateMarketplaceForm(connection));
                } else if (isErp) {
                    formFields.appendChild(generateErpForm(connection));
                } else {
                    formFields.appendChild(generateSupplierForm(connection));
                }
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

                        if (isMarketplace) {
                            body.credentials = {
                                client_id: formData.get('client_id'),
                                client_secret: formData.get('client_secret'),
                                redirect_uri: formData.get('redirect_uri')
                            };
                        } else if (isErp) {
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
                            body.credentials = {
                                url: formData.get('url'),
                                username: formData.get('username'),
                                password: formData.get('password'),
                            };
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
        'nav-meli-anuncios': renderMercadoLivreListings,
        'nav-meli-conexoes': renderMarketplaceConnections
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

    // CORREÇÃO: Atualiza o texto dos links de navegação no menu lateral
    const navErpLink = document.getElementById('nav-conexoes-erp');
    if (navErpLink) {
        navErpLink.textContent = 'ERPs';
    }

    const navSupplierLink = document.getElementById('nav-conexoes-fornecedores');
    if (navSupplierLink) {
        navSupplierLink.textContent = 'Fornecedores';
    }

    // Checar se veio de retorno OAuth do Bling ou Mercado Livre
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autorizado') === 'true') {
        showToast('Bling autenticado com sucesso via OAuth!', 'success');
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (urlParams.get('ml_autorizado') === 'true') {
        showToast('Conta do Mercado Livre autorizada e conectada com sucesso!', 'success');
        window.history.replaceState({}, document.title, window.location.pathname);
        setActiveNavLink('nav-meli-conexoes');
        renderMarketplaceConnections();
        return;
    }

    // Carregar tela inicial (Dashboard)
    renderWelcomePage();
});
