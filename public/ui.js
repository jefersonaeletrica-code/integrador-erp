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
    const meliCreateFileInput = document.getElementById('meli-create-file-input');
    const meliCreateBrowseFilesBtn = document.getElementById('meli-create-browse-files-btn');
    const meliCreateDropzone = document.getElementById('meli-create-dropzone');
    const meliCreateSyncStock = document.getElementById('meli-create-sync-stock');
    const meliCreateSyncPrice = document.getElementById('meli-create-sync-price');
    const meliCreateSourceType = document.getElementById('meli-create-source-type');
    const meliCreateSourceId = document.getElementById('meli-create-source-id');
    const meliCreateSourceData = document.getElementById('meli-create-source-data');
    const meliCreateSourceBadge = document.getElementById('meli-create-source-badge');
    const meliCreateSourceText = document.getElementById('meli-create-source-text');
    const meliSubmitPublishBtn = document.getElementById('meli-submit-publish-btn');
    const meliCreateModalCloseBtns = document.querySelectorAll('.meli-create-modal-close');

    // Modal de Edição Completa do Mercado Livre
    const meliEditModal = document.getElementById('meli-edit-modal');
    const meliEditForm = document.getElementById('meli-edit-form');
    const meliEditItemId = document.getElementById('meli-edit-item-id');
    const meliEditConnectionId = document.getElementById('meli-edit-connection-id');
    const meliEditTitle = document.getElementById('meli-edit-title');
    const meliEditTitleCounter = document.getElementById('meli-edit-title-counter');
    const meliEditTitleWarning = document.getElementById('meli-edit-title-warning');
    const meliEditSku = document.getElementById('meli-edit-sku');
    const meliEditGtin = document.getElementById('meli-edit-gtin');
    const meliEditBrand = document.getElementById('meli-edit-brand');
    const meliEditModel = document.getElementById('meli-edit-model');
    const meliEditPrice = document.getElementById('meli-edit-price');
    const meliEditStock = document.getElementById('meli-edit-stock');
    const meliEditListingType = document.getElementById('meli-edit-listing-type');
    const meliEditStatus = document.getElementById('meli-edit-status');
    const meliEditFileInput = document.getElementById('meli-edit-file-input');
    const meliEditBrowseFilesBtn = document.getElementById('meli-edit-browse-files-btn');
    const meliEditDropzone = document.getElementById('meli-edit-dropzone');
    const meliEditImagesList = document.getElementById('meli-edit-images-list');

    // Elementos de Clip de Vídeo & Moderação
    const meliEditClipFile = document.getElementById('meli-edit-clip-file');
    const meliEditClipDropzone = document.getElementById('meli-edit-clip-dropzone');
    const meliEditClipBrowseBtn = document.getElementById('meli-edit-clip-browse-btn');
    const meliEditClipContainer = document.getElementById('meli-edit-clip-container');
    const meliEditClipPlayer = document.getElementById('meli-edit-clip-player');
    const meliEditClipBadge = document.getElementById('meli-edit-clip-badge');
    const meliEditClipMsg = document.getElementById('meli-edit-clip-msg');
    const meliEditClipFilename = document.getElementById('meli-edit-clip-filename');
    const meliEditClipIdLabel = document.getElementById('meli-edit-clip-id-label');
    const meliEditClipHeaderBadge = document.getElementById('meli-edit-clip-header-badge');
    const meliEditClipCheckBtn = document.getElementById('meli-edit-clip-check-btn');
    const meliEditClipRemoveBtn = document.getElementById('meli-edit-clip-remove-btn');

    const meliEditDescription = document.getElementById('meli-edit-description');
    const meliEditDescStatus = document.getElementById('meli-edit-desc-status');
    const meliEditMarkup = document.getElementById('meli-edit-markup');
    const meliEditSyncStock = document.getElementById('meli-edit-sync-stock');
    const meliEditSyncPrice = document.getElementById('meli-edit-sync-price');
    const meliEditSaveBtn = document.getElementById('meli-edit-save-btn');
    const meliEditModalCloseBtns = document.querySelectorAll('.meli-edit-modal-close');

    // Elementos de Catálogo & Concorrência na Buy Box
    const meliEditCatalogNotice = document.getElementById('meli-edit-catalog-notice');
    const meliEditTitleCatalogLock = document.getElementById('meli-edit-title-catalog-lock');
    const meliEditAttributesCatalogLock = document.getElementById('meli-edit-attributes-catalog-lock');
    const meliEditImagesCatalogLock = document.getElementById('meli-edit-images-catalog-lock');
    const meliEditImagesCatalogNotice = document.getElementById('meli-edit-images-catalog-notice');
    const meliEditImagesCoverHint = document.getElementById('meli-edit-images-cover-hint');
    const meliEditDescCatalogLock = document.getElementById('meli-edit-desc-catalog-lock');

    const meliEditCatalogContainer = document.getElementById('meli-edit-catalog-container');
    const meliEditCatalogBadge = document.getElementById('meli-edit-catalog-badge');
    const meliEditCatalogRefreshBtn = document.getElementById('meli-edit-catalog-refresh-btn');
    const meliEditCatalogStatus = document.getElementById('meli-edit-catalog-status');
    const meliEditCatalogStatusDesc = document.getElementById('meli-edit-catalog-status-desc');
    const meliEditCatalogCurrentPrice = document.getElementById('meli-edit-catalog-current-price');
    const meliEditCatalogPriceToWin = document.getElementById('meli-edit-catalog-price-to-win');
    const meliEditCatalogDiffDesc = document.getElementById('meli-edit-catalog-diff-desc');
    const meliEditCatalogActionBanner = document.getElementById('meli-edit-catalog-action-banner');
    const meliEditCatalogBannerText = document.getElementById('meli-edit-catalog-banner-text');
    const meliEditCatalogApplyPriceBtn = document.getElementById('meli-edit-catalog-apply-price-btn');

    // Elementos de Retorno Financeiro & Valor Líquido
    const meliEditFinContainer = document.getElementById('meli-edit-financial-container');
    const meliEditFinRefreshBtn = document.getElementById('meli-edit-financial-refresh-btn');
    const meliEditFinPrice = document.getElementById('meli-edit-fin-price');
    const meliEditFinListingType = document.getElementById('meli-edit-fin-listing-type');
    const meliEditFinFee = document.getElementById('meli-edit-fin-fee');
    const meliEditFinFeeDesc = document.getElementById('meli-edit-fin-fee-desc');
    const meliEditFinShipping = document.getElementById('meli-edit-fin-shipping');
    const meliEditFinShippingDesc = document.getElementById('meli-edit-fin-shipping-desc');
    const meliEditFinNet = document.getElementById('meli-edit-fin-net');
    const meliEditFinNetPct = document.getElementById('meli-edit-fin-net-pct');
    const meliEditFinProfitRow = document.getElementById('meli-edit-fin-profit-row');
    const meliEditFinCostPrice = document.getElementById('meli-edit-fin-cost-price');
    const meliEditFinRealProfit = document.getElementById('meli-edit-fin-real-profit');
    const meliEditFinRealMargin = document.getElementById('meli-edit-fin-real-margin');

    let meliImagesList = [];
    let meliEditImagesArray = [];
    let meliCurrentClip = null;
    let meliCurrentCatalog = null;
    let meliCurrentFinancial = null;

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
     * Helpers para Gerenciamento de Fotos, Upload de Arquivos e Drag & Drop
     */
    const updateTitleCounter = (inputEl, counterEl, warningEl) => {
        if (!inputEl || !counterEl) return;
        const len = inputEl.value.length;
        counterEl.textContent = `${len}/60 caracteres`;
        counterEl.classList.remove('ok', 'warning', 'danger');
        inputEl.classList.remove('input-danger');

        if (len <= 45) {
            counterEl.classList.add('ok');
            if (warningEl) warningEl.style.display = 'none';
        } else if (len <= 60) {
            counterEl.classList.add('warning');
            if (warningEl) warningEl.style.display = 'none';
        } else {
            counterEl.classList.add('danger');
            inputEl.classList.add('input-danger');
            if (warningEl) warningEl.style.display = 'block';
        }
    };

    const uploadImageFilesToMeli = async (files, targetArray, renderCallback, connectionId) => {
        if (!files || files.length === 0) return;
        const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (validFiles.length === 0) {
            showToast('Por favor, selecione apenas arquivos de imagem (JPG, PNG, WEBP).', 'warning');
            return;
        }

        showToast(`Carregando ${validFiles.length} foto(s)...`, 'info');

        for (const file of validFiles) {
            try {
                const base64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });

                const res = await api('/api/marketplace/mercadolivre/upload-picture', 'POST', {
                    imageBase64: base64,
                    filename: file.name,
                    mimeType: file.type,
                    connectionId
                });

                const picUrl = res.url || res.localUrl;
                const picObj = res.id ? { id: res.id, url: picUrl } : picUrl;
                targetArray.push(picObj);
                renderCallback();
            } catch (err) {
                console.error('Erro no upload de foto:', err);
                showToast(`Falha ao carregar "${file.name}": ${err.message}`, 'error');
            }
        }
        showToast('Fotos adicionadas à galeria com sucesso!', 'success');
    };

    const setupGalleryDragAndDrop = (containerEl, targetArray, renderCallback) => {
        if (!containerEl) return;

        let draggedIdx = null;

        containerEl.querySelectorAll('.meli-image-card[draggable="true"]').forEach(card => {
            card.addEventListener('dragstart', (e) => {
                draggedIdx = parseInt(card.dataset.idx, 10);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', draggedIdx);
                card.classList.add('dragging');
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                containerEl.querySelectorAll('.meli-image-card').forEach(c => c.classList.remove('drag-over-card'));
            });

            card.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                card.classList.add('drag-over-card');
            });

            card.addEventListener('dragleave', () => {
                card.classList.remove('drag-over-card');
            });

            card.addEventListener('drop', (e) => {
                e.preventDefault();
                card.classList.remove('drag-over-card');
                const targetIdx = parseInt(card.dataset.idx, 10);
                if (!isNaN(draggedIdx) && !isNaN(targetIdx) && draggedIdx !== targetIdx) {
                    const [movedItem] = targetArray.splice(draggedIdx, 1);
                    targetArray.splice(targetIdx, 0, movedItem);
                    renderCallback();
                    showToast(targetIdx === 0 ? 'Foto definida como Capa Principal!' : 'Sequência das fotos atualizada!', 'info');
                }
            });
        });
    };

    const renderMeliImagesPreview = () => {
        if (!meliImagesPreviewList) return;
        if (meliImagesList.length === 0) {
            meliImagesPreviewList.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; color: var(--color-text-offset); font-size: 0.84rem; padding: 1.5rem;">
                    <i class="fas fa-image" style="font-size: 1.75rem; margin-bottom: 0.45rem; display: block; color: var(--color-text-muted);"></i>
                    Nenhuma foto adicionada. Arraste fotos acima ou cole a URL.
                </div>
            `;
            return;
        }

        let html = '';
        meliImagesList.forEach((item, idx) => {
            const url = typeof item === 'string' ? item : (item.url || item.source || item.secure_url || '');
            const isCover = idx === 0;

            html += `
                <div class="meli-image-card ${isCover ? 'is-cover' : ''}" data-idx="${idx}" draggable="true" title="Arraste para reordenar a sequência">
                    <div class="meli-image-wrapper">
                        <img src="${url}" alt="Foto ${idx + 1}" onerror="this.src='/assets/logos/default-erp.svg'">
                        ${isCover ? `
                            <span class="meli-cover-badge">
                                <i class="fas fa-star"></i> Capa
                            </span>
                        ` : ''}
                        <button type="button" class="meli-image-remove" data-action="remove-meli-image" data-idx="${idx}" title="Excluir esta foto">&times;</button>
                    </div>
                    <div class="meli-image-actions-bar">
                        <button type="button" class="btn-order-move" data-action="move-meli-create-left" data-idx="${idx}" ${idx === 0 ? 'disabled' : ''} title="Mover para esquerda">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        ${!isCover ? `
                            <button type="button" class="btn-set-cover" data-action="set-meli-create-cover" data-idx="${idx}" title="Tornar esta a Foto Principal (Capa)">
                                <i class="fas fa-star"></i> Capa
                            </button>
                        ` : `
                            <span class="image-index-indicator" style="color: #b45309; font-weight: 800;">Principal</span>
                        `}
                        <button type="button" class="btn-order-move" data-action="move-meli-create-right" data-idx="${idx}" ${idx === meliImagesList.length - 1 ? 'disabled' : ''} title="Mover para direita">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        meliImagesPreviewList.innerHTML = html;
        setupGalleryDragAndDrop(meliImagesPreviewList, meliImagesList, renderMeliImagesPreview);
    };

    const renderMeliEditImages = () => {
        if (!meliEditImagesList) return;
        const countEl = document.getElementById('meli-edit-images-counter');
        if (countEl) {
            countEl.textContent = `(${meliEditImagesArray.length} ${meliEditImagesArray.length === 1 ? 'foto' : 'fotos'})`;
        }

        if (meliEditImagesArray.length === 0) {
            meliEditImagesList.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; color: var(--color-text-offset); font-size: 0.84rem; padding: 1.5rem;">
                    <i class="fas fa-image" style="font-size: 1.75rem; margin-bottom: 0.45rem; display: block; color: var(--color-text-muted);"></i>
                    Nenhuma foto cadastrada.
                </div>
            `;
            return;
        }

        const isCatalog = !!(meliCurrentCatalog && meliCurrentCatalog.is_catalog);

        let html = '';
        meliEditImagesArray.forEach((item, idx) => {
            const url = typeof item === 'string' ? item : (item.url || item.source || item.secure_url || '');
            const isCover = idx === 0;

            if (isCatalog) {
                html += `
                    <div class="meli-image-card ${isCover ? 'is-cover' : ''}" data-idx="${idx}" title="Foto padrão do Catálogo Mercado Livre">
                        <div class="meli-image-wrapper">
                            <img src="${url}" alt="Foto ${idx + 1}" onerror="this.src='/assets/logos/default-erp.svg'">
                            ${isCover ? `
                                <span class="meli-cover-badge" style="background: #4f46e5;">
                                    <i class="fas fa-certificate"></i> Capa do Catálogo
                                </span>
                            ` : ''}
                        </div>
                        <div class="meli-image-actions-bar" style="justify-content: center;">
                            <span class="image-index-indicator" style="color: var(--color-text-offset); font-size: 0.74rem;">
                                <i class="fas fa-lock"></i> Foto ${idx + 1}
                            </span>
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div class="meli-image-card ${isCover ? 'is-cover' : ''}" data-idx="${idx}" draggable="true" title="Arraste para reordenar a sequência">
                        <div class="meli-image-wrapper">
                            <img src="${url}" alt="Foto ${idx + 1}" onerror="this.src='/assets/logos/default-erp.svg'">
                            ${isCover ? `
                                <span class="meli-cover-badge">
                                    <i class="fas fa-star"></i> Capa
                                </span>
                            ` : ''}
                            <button type="button" class="meli-image-remove" data-action="remove-meli-edit-image" data-idx="${idx}" title="Excluir esta foto">&times;</button>
                        </div>
                        <div class="meli-image-actions-bar">
                            <button type="button" class="btn-order-move" data-action="move-meli-edit-left" data-idx="${idx}" ${idx === 0 ? 'disabled' : ''} title="Mover para esquerda">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            ${!isCover ? `
                                <button type="button" class="btn-set-cover" data-action="set-meli-edit-cover" data-idx="${idx}" title="Tornar esta a Foto Principal (Capa)">
                                    <i class="fas fa-star"></i> Capa
                                </button>
                            ` : `
                                <span class="image-index-indicator" style="color: #b45309; font-weight: 800;">Principal</span>
                            `}
                            <button type="button" class="btn-order-move" data-action="move-meli-edit-right" data-idx="${idx}" ${idx === meliEditImagesArray.length - 1 ? 'disabled' : ''} title="Mover para direita">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                `;
            }
        });
        meliEditImagesList.innerHTML = html;
        if (!isCatalog) {
            setupGalleryDragAndDrop(meliEditImagesList, meliEditImagesArray, renderMeliEditImages);
        }
    };

    const renderMeliClipState = (clipData) => {
        meliCurrentClip = clipData;
        if (!clipData || (!clipData.videoUrl && !clipData.video_url && !clipData.clipId && !clipData.clip_id)) {
            if (meliEditClipDropzone) meliEditClipDropzone.style.display = 'flex';
            if (meliEditClipContainer) meliEditClipContainer.style.display = 'none';
            if (meliEditClipPlayer) {
                meliEditClipPlayer.pause();
                meliEditClipPlayer.removeAttribute('src');
                meliEditClipPlayer.load();
            }
            if (meliEditClipHeaderBadge) {
                meliEditClipHeaderBadge.className = 'clip-mini-status';
                meliEditClipHeaderBadge.textContent = 'Sem vídeo';
            }
            return;
        }

        const videoUrl = clipData.videoUrl || clipData.video_url || '';
        const clipId = clipData.clipId || clipData.clip_id || 'clip_anuncio';
        const rawStatus = String(clipData.clipStatus || clipData.clip_status || 'under_review').toLowerCase();
        const details = (typeof clipData.clipDetails === 'object' ? clipData.clipDetails : null) || (typeof clipData.clip_details === 'object' ? clipData.clip_details : null) || {};
        const filename = clipData.filename || details.filename || 'clip_anuncio.mp4';

        if (meliEditClipDropzone) meliEditClipDropzone.style.display = 'none';
        if (meliEditClipContainer) meliEditClipContainer.style.display = 'block';

        if (meliEditClipPlayer && videoUrl) {
            meliEditClipPlayer.src = videoUrl;
            meliEditClipPlayer.load();
        }

        if (meliEditClipFilename) {
            meliEditClipFilename.innerHTML = `<i class="fas fa-file-video"></i> ${filename}`;
        }
        if (meliEditClipIdLabel) {
            meliEditClipIdLabel.innerHTML = `<i class="fas fa-hashtag"></i> ${clipId}`;
        }

        // Mapeamento do status de moderação
        let badgeClass = 'under_review';
        let badgeText = '<i class="fas fa-clock"></i> Em Análise / Moderação';
        let miniBadgeText = '🟡 Em Moderação';
        let msgText = details.moderation_message || clipData.moderationMessage || 'O vídeo foi enviado e está sendo analisado pela equipe de moderação do Mercado Livre. Isso pode levar alguns minutos.';

        if (rawStatus === 'approved' || rawStatus === 'active') {
            badgeClass = 'approved';
            badgeText = '<i class="fas fa-circle-check"></i> Aprovado no Mercado Livre';
            miniBadgeText = '🟢 Aprovado';
            msgText = 'O clipe de vídeo foi aprovado pela moderação e está ativo no anúncio do Mercado Livre!';
        } else if (rawStatus === 'rejected' || rawStatus === 'error' || rawStatus === 'reprovado') {
            badgeClass = 'rejected';
            badgeText = '<i class="fas fa-triangle-exclamation"></i> Reprovado / Rejeitado';
            miniBadgeText = '🔴 Reprovado';
            msgText = details.moderation_message || clipData.moderationMessage || 'O clipe de vídeo não atendeu às diretrizes do Mercado Livre e foi recusado. Envie um novo clipe.';
        }

        if (meliEditClipBadge) {
            meliEditClipBadge.className = `clip-status-badge ${badgeClass}`;
            meliEditClipBadge.innerHTML = badgeText;
        }
        if (meliEditClipHeaderBadge) {
            meliEditClipHeaderBadge.className = `clip-mini-status ${badgeClass}`;
            meliEditClipHeaderBadge.textContent = miniBadgeText;
        }
        if (meliEditClipMsg) {
            meliEditClipMsg.textContent = msgText;
        }
    };

    const uploadClipFileToMeli = async (file, itemId, connectionId) => {
        if (!file) return;
        if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|mov|webm)$/i)) {
            showToast('Por favor, selecione um arquivo de vídeo válido (MP4, MOV, WEBM).', 'warning');
            return;
        }
        if (file.size > 50 * 1024 * 1024) {
            showToast('O arquivo de vídeo excede o tamanho máximo permitido de 50MB.', 'warning');
            return;
        }

        showToast(`Carregando clipe "${file.name}" para moderação...`, 'info');

        try {
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const res = await api('/api/marketplace/mercadolivre/upload-clip', 'POST', {
                videoBase64: base64,
                filename: file.name,
                mimeType: file.type || 'video/mp4',
                itemId,
                connectionId
            });

            if (res.sucesso) {
                renderMeliClipState(res);
                showToast('Vídeo enviado com sucesso! Status: Em Análise / Moderação 🟡', 'success');
            } else {
                throw new Error(res.erro || 'Falha no upload do clipe.');
            }
        } catch (err) {
            console.error('Erro no upload de clip:', err);
            showToast(`Falha ao carregar clipe: ${err.message}`, 'error');
        }
    };

    const renderMeliCatalogState = (catalogData, currentPriceVal, isAdActive = true) => {
        meliCurrentCatalog = catalogData;
        const isCatalog = !!(catalogData && catalogData.is_catalog);

        if (!isCatalog) {
            if (meliEditCatalogContainer) meliEditCatalogContainer.style.display = 'none';
            if (meliEditCatalogNotice) meliEditCatalogNotice.style.display = 'none';
            if (meliEditTitleCatalogLock) meliEditTitleCatalogLock.style.display = 'none';
            if (meliEditAttributesCatalogLock) meliEditAttributesCatalogLock.style.display = 'none';
            if (meliEditImagesCatalogLock) meliEditImagesCatalogLock.style.display = 'none';
            if (meliEditImagesCatalogNotice) meliEditImagesCatalogNotice.style.display = 'none';
            if (meliEditImagesCoverHint) meliEditImagesCoverHint.style.display = 'inline-block';
            if (meliEditDropzone) meliEditDropzone.style.display = 'flex';
            if (meliEditDescCatalogLock) meliEditDescCatalogLock.style.display = 'none';

            // Desbloqueia campos
            if (meliEditTitle) {
                meliEditTitle.readOnly = false;
                meliEditTitle.classList.remove('catalog-locked');
                meliEditTitle.removeAttribute('title');
            }
            if (meliEditGtin) {
                meliEditGtin.readOnly = false;
                meliEditGtin.classList.remove('catalog-locked');
                meliEditGtin.removeAttribute('title');
            }
            if (meliEditBrand) {
                meliEditBrand.readOnly = false;
                meliEditBrand.classList.remove('catalog-locked');
                meliEditBrand.removeAttribute('title');
            }
            if (meliEditModel) {
                meliEditModel.readOnly = false;
                meliEditModel.classList.remove('catalog-locked');
                meliEditModel.removeAttribute('title');
            }
            if (meliEditDescription) {
                meliEditDescription.readOnly = false;
                meliEditDescription.classList.remove('catalog-locked');
                meliEditDescription.removeAttribute('title');
            }
            return;
        }

        // Ativa modo de Catálogo
        if (meliEditCatalogContainer) meliEditCatalogContainer.style.display = 'block';
        if (meliEditCatalogNotice) meliEditCatalogNotice.style.display = 'flex';
        if (meliEditTitleCatalogLock) meliEditTitleCatalogLock.style.display = 'inline-flex';
        if (meliEditAttributesCatalogLock) meliEditAttributesCatalogLock.style.display = 'inline-flex';
        if (meliEditImagesCatalogLock) meliEditImagesCatalogLock.style.display = 'inline-flex';
        if (meliEditImagesCatalogNotice) meliEditImagesCatalogNotice.style.display = 'flex';
        if (meliEditImagesCoverHint) meliEditImagesCoverHint.style.display = 'none';
        if (meliEditDropzone) meliEditDropzone.style.display = 'none';
        if (meliEditDescCatalogLock) meliEditDescCatalogLock.style.display = 'inline-flex';

        // Bloqueia campos gerenciados pelo Mercado Livre
        if (meliEditTitle) {
            meliEditTitle.readOnly = true;
            meliEditTitle.classList.add('catalog-locked');
            meliEditTitle.title = 'Título padronizado pelo Catálogo oficial do Mercado Livre (não editável).';
        }
        if (meliEditGtin) {
            meliEditGtin.readOnly = true;
            meliEditGtin.classList.add('catalog-locked');
            meliEditGtin.title = 'Código EAN/GTIN gerenciado pelo Catálogo do Mercado Livre.';
        }
        if (meliEditBrand) {
            meliEditBrand.readOnly = true;
            meliEditBrand.classList.add('catalog-locked');
            meliEditBrand.title = 'Marca gerenciada pelo Catálogo do Mercado Livre.';
        }
        if (meliEditModel) {
            meliEditModel.readOnly = true;
            meliEditModel.classList.add('catalog-locked');
            meliEditModel.title = 'Modelo gerenciado pelo Catálogo do Mercado Livre.';
        }
        if (meliEditDescription) {
            meliEditDescription.readOnly = true;
            meliEditDescription.classList.add('catalog-locked');
            meliEditDescription.title = 'Descrição oficial padronizada pelo Catálogo do Mercado Livre.';
        }
        if (meliEditDescStatus) {
            meliEditDescStatus.innerHTML = '<span style="color: #6366f1; font-weight: 600;"><i class="fas fa-lock"></i> Descrição padrão do Catálogo ML</span>';
        }

        const numCurrentPrice = typeof currentPriceVal === 'number' ? currentPriceVal : parseFloat(String(currentPriceVal).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
        if (meliEditCatalogCurrentPrice) {
            meliEditCatalogCurrentPrice.textContent = numCurrentPrice > 0 ? `R$ ${numCurrentPrice.toFixed(2)}` : 'N/D';
        }

        // Se o anúncio estiver pausado/não-ativo, suspende a visualização de Buy Box
        if (!isAdActive || catalogData.is_paused) {
            if (meliEditCatalogStatus) {
                meliEditCatalogStatus.innerHTML = '<span style="color: #6b7280;"><i class="fas fa-pause-circle"></i> Anúncio Pausado</span>';
            }
            if (meliEditCatalogStatusDesc) {
                meliEditCatalogStatusDesc.textContent = 'A Buy Box e a concorrência de catálogo ficam suspensas enquanto o anúncio estiver pausado.';
            }
            if (meliEditCatalogPriceToWin) {
                meliEditCatalogPriceToWin.textContent = '-';
                meliEditCatalogPriceToWin.style.color = 'var(--color-text-offset)';
            }
            if (meliEditCatalogDiffDesc) {
                meliEditCatalogDiffDesc.textContent = 'Reative o anúncio para participar da Buy Box';
            }
            if (meliEditCatalogActionBanner) {
                meliEditCatalogActionBanner.style.display = 'none';
            }
            return;
        }

        const rawStatus = String(catalogData.status || '').toLowerCase();
        const isWinner = !!catalogData.is_winner || rawStatus === 'winner' || rawStatus === 'winning';
        const priceToWin = catalogData.price_to_win !== null && catalogData.price_to_win !== undefined ? parseFloat(catalogData.price_to_win) : null;

        if (meliEditCatalogStatus) {
            if (isWinner) {
                meliEditCatalogStatus.innerHTML = '<span style="color: #10b981;"><i class="fas fa-trophy"></i> Ganhando a Buy Box</span>';
            } else if (rawStatus === 'losing' || rawStatus === 'opportunity' || priceToWin !== null) {
                meliEditCatalogStatus.innerHTML = '<span style="color: #f59e0b;"><i class="fas fa-bolt"></i> Perdendo a Buy Box</span>';
            } else if (rawStatus === 'without_competition') {
                meliEditCatalogStatus.innerHTML = '<span style="color: #6b7280;"><i class="fas fa-circle-check"></i> Sem Concorrência</span>';
            } else {
                meliEditCatalogStatus.innerHTML = '<span style="color: #6366f1;"><i class="fas fa-arrows-split-up-and-left"></i> Em Concorrência</span>';
            }
        }

        if (meliEditCatalogStatusDesc) {
            if (isWinner) {
                meliEditCatalogStatusDesc.textContent = 'Seu anúncio é o vencedor da Buy Box e está em destaque no Mercado Livre.';
            } else if (priceToWin !== null) {
                meliEditCatalogStatusDesc.textContent = 'Outro vendedor está oferecendo condições mais competitivas no Catálogo.';
            } else {
                meliEditCatalogStatusDesc.textContent = 'Anúncio participando da disputa de visibilidade no Catálogo.';
            }
        }

        if (meliEditCatalogPriceToWin) {
            if (priceToWin !== null && priceToWin > 0) {
                meliEditCatalogPriceToWin.textContent = `R$ ${priceToWin.toFixed(2)}`;
                meliEditCatalogPriceToWin.style.color = '#10b981';
            } else {
                meliEditCatalogPriceToWin.textContent = isWinner ? 'Preço Vencedor' : 'Sem sugestão direta';
                meliEditCatalogPriceToWin.style.color = 'var(--color-text)';
            }
        }

        if (meliEditCatalogDiffDesc) {
            if (priceToWin !== null && numCurrentPrice > 0) {
                const diff = priceToWin - numCurrentPrice;
                const diffPercent = ((diff / numCurrentPrice) * 100).toFixed(1);
                if (diff < -0.01) {
                    meliEditCatalogDiffDesc.innerHTML = `<span style="color: #ef4444; font-weight: 700;">R$ ${diff.toFixed(2)} (${diffPercent}%)</span> para vencer`;
                } else if (diff > 0.01) {
                    meliEditCatalogDiffDesc.innerHTML = `<span style="color: #10b981; font-weight: 700;">+R$ ${diff.toFixed(2)} (+${diffPercent}%)</span> margem disponível`;
                } else {
                    meliEditCatalogDiffDesc.textContent = 'Preço idêntico ao sugerido';
                }
            } else {
                meliEditCatalogDiffDesc.textContent = isWinner ? 'Você já possui o melhor preço' : '-';
            }
        }

        if (meliEditCatalogActionBanner && meliEditCatalogApplyPriceBtn) {
            if (!isWinner && priceToWin !== null && priceToWin > 0 && Math.abs(priceToWin - numCurrentPrice) > 0.01) {
                meliEditCatalogActionBanner.style.display = 'flex';
                if (meliEditCatalogBannerText) {
                    meliEditCatalogBannerText.innerHTML = `Aplique <strong>R$ ${priceToWin.toFixed(2)}</strong> para aumentar suas chances de ganhar a Buy Box do Catálogo!`;
                }
                meliEditCatalogApplyPriceBtn.dataset.suggestedPrice = priceToWin.toFixed(2);
            } else {
                meliEditCatalogActionBanner.style.display = 'none';
            }
        }
    };

    /**
     * Renderiza e formata os dados do card financeiro no Modal de Edição
     */
    const renderMeliFinancialState = (financialData, costPrice = null) => {
        meliCurrentFinancial = financialData;

        if (!financialData) {
            if (meliEditFinPrice) meliEditFinPrice.textContent = 'R$ 0,00';
            if (meliEditFinFee) meliEditFinFee.textContent = '- R$ 0,00';
            if (meliEditFinShipping) meliEditFinShipping.textContent = 'R$ 0,00';
            if (meliEditFinNet) meliEditFinNet.textContent = 'R$ 0,00';
            if (meliEditFinNetPct) meliEditFinNetPct.textContent = '0% do valor';
            if (meliEditFinProfitRow) meliEditFinProfitRow.style.display = 'none';
            return;
        }

        const price = parseFloat(financialData.price || 0);
        const fee = parseFloat(financialData.sale_fee_amount || 0);
        const ship = parseFloat(financialData.shipping_cost || 0);
        const net = parseFloat(financialData.net_amount !== null && financialData.net_amount !== undefined ? financialData.net_amount : (price - fee - ship));
        const netPct = price > 0 ? ((net / price) * 100).toFixed(1) : '0';

        const details = financialData.fee_details || {};
        const isPro = details.listing_type_id === 'gold_pro' || (meliEditListingType && meliEditListingType.value === 'gold_pro');
        const typeLabel = isPro ? 'Premium (gold_pro)' : 'Clássico (gold_special)';

        if (meliEditFinPrice) meliEditFinPrice.textContent = `R$ ${price.toFixed(2)}`;
        if (meliEditFinListingType) meliEditFinListingType.textContent = typeLabel;

        if (meliEditFinFee) {
            meliEditFinFee.textContent = fee > 0 ? `- R$ ${fee.toFixed(2)}` : 'R$ 0,00';
        }
        if (meliEditFinFeeDesc) {
            let desc = '';
            if (details.percentage_fee) desc += `${details.percentage_fee}%`;
            if (details.fixed_fee) desc += (desc ? ' + ' : '') + `R$ ${parseFloat(details.fixed_fee).toFixed(2)} fixo`;
            meliEditFinFeeDesc.textContent = desc || 'Comissão Mercado Livre';
        }

        if (meliEditFinShipping) {
            if (ship > 0) {
                meliEditFinShipping.textContent = `- R$ ${ship.toFixed(2)}`;
                if (meliEditFinShippingDesc) meliEditFinShippingDesc.textContent = 'Frete Grátis pago pelo Vendedor';
            } else {
                meliEditFinShipping.textContent = 'R$ 0,00';
                if (meliEditFinShippingDesc) meliEditFinShippingDesc.textContent = 'Frete por conta do Comprador';
            }
        }

        if (meliEditFinNet) {
            meliEditFinNet.textContent = `R$ ${net.toFixed(2)}`;
        }
        if (meliEditFinNetPct) {
            meliEditFinNetPct.textContent = `${netPct}% do valor de venda`;
        }

        // Lucro real caso haja custo de mercadoria do ERP ou Fornecedor
        const numCost = (costPrice !== null && costPrice !== undefined && !isNaN(parseFloat(costPrice)) && parseFloat(costPrice) > 0)
            ? parseFloat(costPrice)
            : null;

        if (numCost !== null && meliEditFinProfitRow) {
            meliEditFinProfitRow.style.display = 'flex';
            const realProfit = net - numCost;
            const realMargin = price > 0 ? ((realProfit / price) * 100).toFixed(1) : '0';

            if (meliEditFinCostPrice) meliEditFinCostPrice.textContent = `R$ ${numCost.toFixed(2)}`;
            if (meliEditFinRealProfit) {
                meliEditFinRealProfit.textContent = `R$ ${realProfit.toFixed(2)}`;
                meliEditFinRealProfit.className = realProfit >= 0 ? 'text-success' : 'text-danger';
            }
            if (meliEditFinRealMargin) {
                meliEditFinRealMargin.textContent = `${realMargin}%`;
                meliEditFinRealMargin.className = realProfit >= 0 ? 'text-success' : 'text-danger';
            }
        } else if (meliEditFinProfitRow) {
            meliEditFinProfitRow.style.display = 'none';
        }
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

    const openMeliEditModal = async (item) => {
        if (!meliEditModal) return;
        if (meliEditForm) meliEditForm.reset();
        meliEditImagesArray = [];
        renderMeliClipState(null);

        const isItemActive = item.status === 'active';

        // Inicializa estado de catálogo local imediato (apenas se for anúncio de catálogo)
        if (item.catalog_listing) {
            renderMeliCatalogState({
                is_catalog: true,
                catalog_product_id: item.catalog_product_id,
                status: isItemActive ? (item.catalog_status || 'competing') : 'paused',
                price_to_win: isItemActive ? item.catalog_price_to_win : null,
                details: isItemActive ? item.catalog_details : null,
                is_paused: !isItemActive
            }, item.price, isItemActive);
        } else {
            renderMeliCatalogState(null);
        }

        // Inicializa retorno financeiro e taxas locais imediatas
        const initialCostPrice = item.cost_price || item.source_data?.price || null;
        if (item.sale_fee_amount !== null && item.sale_fee_amount !== undefined) {
            renderMeliFinancialState({
                price: item.price,
                sale_fee_amount: item.sale_fee_amount,
                shipping_cost: item.shipping_cost,
                net_amount: item.net_amount,
                fee_details: item.fee_details
            }, initialCostPrice);
        } else {
            renderMeliFinancialState(null);
        }

        const itemId = item.item_id || item.id;
        const connectionId = item.connection_id;

        if (meliEditItemId) meliEditItemId.value = itemId;
        if (meliEditConnectionId) meliEditConnectionId.value = connectionId;
        if (meliEditTitle) {
            meliEditTitle.value = item.title || '';
            updateTitleCounter(meliEditTitle, meliEditTitleCounter, meliEditTitleWarning);
        }
        if (meliEditSku) meliEditSku.value = item.sku || '';
        if (meliEditPrice) meliEditPrice.value = (typeof item.price === 'number' ? item.price : parseFloat(item.price || 0)).toFixed(2);
        if (meliEditStock) meliEditStock.value = item.available_quantity !== undefined ? item.available_quantity : 0;
        if (meliEditListingType) meliEditListingType.value = item.listing_type_id || 'gold_special';
        if (meliEditStatus) meliEditStatus.value = item.status || 'active';
        if (meliEditMarkup) meliEditMarkup.value = item.markup_percent !== undefined ? item.markup_percent : 0;
        if (meliEditSyncStock) meliEditSyncStock.checked = !!item.sync_auto_stock;
        if (meliEditSyncPrice) meliEditSyncPrice.checked = !!item.sync_auto_price;

        if (meliEditDescStatus) meliEditDescStatus.textContent = 'Carregando detalhes e fotos da API...';
        if (meliEditDescription) meliEditDescription.value = '';

        // Se tem thumbnail imediata, coloca temporariamente
        if (item.thumbnail && item.thumbnail.startsWith('http')) {
            meliEditImagesArray.push(item.thumbnail);
        }
        renderMeliEditImages();

        // Se tem clip local imediato
        if (item.video_url || item.clip_id) {
            renderMeliClipState({
                video_url: item.video_url,
                clip_id: item.clip_id,
                clip_status: item.clip_status || 'under_review',
                clip_details: item.clip_details
            });
        }

        const subTitle = document.getElementById('meli-edit-modal-subtitle');
        if (subTitle) subTitle.textContent = `MLB: ${itemId} | SKU: ${item.sku || 'N/D'}`;

        meliEditModal.style.display = 'flex';

        // Carrega dados completos em segundo plano da API do Mercado Livre
        try {
            const res = await api(`/api/marketplace/mercadolivre/items/${itemId}/details?connectionId=${connectionId}`);
            if (res.sucesso) {
                const fullItem = res.item || {};
                const local = res.localItem || {};
                const isFullActive = (fullItem.status || item.status) === 'active';
                const isFullCatalog = !!(fullItem.catalog_listing === true || (fullItem.catalog_listing === undefined && (local.catalog_listing || item.catalog_listing)));

                // Descrição
                if (meliEditDescription) {
                    meliEditDescription.value = res.description || '';
                }
                if (meliEditDescStatus) {
                    if (isFullCatalog) {
                        meliEditDescStatus.innerHTML = '<span style="color: #6366f1;"><i class="fas fa-bookmark"></i> Anúncio de Catálogo (descrição padrão gerenciada pelo Mercado Livre)</span>';
                    } else {
                        meliEditDescStatus.textContent = res.description ? 'Descrição sincronizada' : 'Sem descrição cadastrada';
                    }
                }

                // Catálogo & Concorrência na Buy Box
                if (isFullCatalog) {
                    if (res.catalog && res.catalog.is_catalog && isFullActive) {
                        renderMeliCatalogState(res.catalog, fullItem.price || item.price, true);
                    } else {
                        renderMeliCatalogState({
                            is_catalog: true,
                            catalog_product_id: fullItem.catalog_product_id || local.catalog_product_id,
                            status: isFullActive ? (local.catalog_status || 'competing') : 'paused',
                            price_to_win: isFullActive ? local.catalog_price_to_win : null,
                            details: isFullActive ? local.catalog_details : null,
                            is_paused: !isFullActive
                        }, fullItem.price || item.price, isFullActive);
                    }
                } else {
                    renderMeliCatalogState(null);
                }

                // Retorno Financeiro, Taxas ML e Custo de Frete
                const resolvedCostPrice = local.cost_price || local.source_data?.price || item.cost_price || item.source_data?.price || null;
                if (res.financial) {
                    renderMeliFinancialState(res.financial, resolvedCostPrice);
                } else if (local.sale_fee_amount !== null && local.sale_fee_amount !== undefined) {
                    renderMeliFinancialState({
                        price: local.price || item.price,
                        sale_fee_amount: local.sale_fee_amount,
                        shipping_cost: local.shipping_cost,
                        net_amount: local.net_amount,
                        fee_details: local.fee_details
                    }, resolvedCostPrice);
                }

                // Fotos completas
                meliEditImagesArray = [];
                if (Array.isArray(fullItem.pictures) && fullItem.pictures.length > 0) {
                    fullItem.pictures.forEach(p => {
                        const u = p.secure_url || p.url || p.source;
                        if (p.id) {
                            meliEditImagesArray.push({ id: p.id, url: u });
                        } else if (u) {
                            meliEditImagesArray.push(u);
                        }
                    });
                } else if (item.thumbnail && item.thumbnail.startsWith('http')) {
                    meliEditImagesArray.push(item.thumbnail);
                }
                renderMeliEditImages();

                // Atributos (EAN / GTIN, Marca, Modelo)
                if (Array.isArray(fullItem.attributes)) {
                    const gtinAttr = fullItem.attributes.find(a => a.id === 'GTIN' || a.id === 'EAN');
                    if (gtinAttr && meliEditGtin) meliEditGtin.value = gtinAttr.value_name || '';

                    const brandAttr = fullItem.attributes.find(a => a.id === 'BRAND');
                    if (brandAttr && meliEditBrand) meliEditBrand.value = brandAttr.value_name || '';

                    const modelAttr = fullItem.attributes.find(a => a.id === 'MODEL');
                    if (modelAttr && meliEditModel) meliEditModel.value = modelAttr.value_name || '';

                    const skuAttr = fullItem.attributes.find(a => a.id === 'SELLER_SKU');
                    if (skuAttr && meliEditSku && !meliEditSku.value) meliEditSku.value = skuAttr.value_name || '';
                }

                // Clip de Vídeo & Status de Moderação
                if (local.video_url || local.clip_id || fullItem.clips || fullItem.video_id) {
                    renderMeliClipState({
                        video_url: local.video_url,
                        clip_id: local.clip_id || fullItem.video_id,
                        clip_status: local.clip_status || (fullItem.video_id ? 'approved' : 'under_review'),
                        clip_details: local.clip_details,
                        filename: local.clip_details?.filename || 'clip_anuncio.mp4'
                    });
                } else {
                    renderMeliClipState(null);
                }

                // Tipo de listagem
                if (meliEditListingType && fullItem.listing_type_id) {
                    meliEditListingType.value = fullItem.listing_type_id;
                }

                // Sincronizações locais
                if (local.sync_auto_stock !== undefined && meliEditSyncStock) {
                    meliEditSyncStock.checked = !!local.sync_auto_stock;
                }
                if (local.sync_auto_price !== undefined && meliEditSyncPrice) {
                    meliEditSyncPrice.checked = !!local.sync_auto_price;
                }
                if (local.markup_percent !== undefined && meliEditMarkup) {
                    meliEditMarkup.value = local.markup_percent;
                }
            }
        } catch (err) {
            if (meliEditDescStatus) meliEditDescStatus.textContent = 'Não foi possível carregar descrição remota.';
        }
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

    // Gerenciador de Upload de Fotos e Drag & Drop no Modal de Criação
    if (meliCreateBrowseFilesBtn && meliCreateFileInput) {
        meliCreateBrowseFilesBtn.addEventListener('click', () => meliCreateFileInput.click());
        meliCreateFileInput.addEventListener('change', () => {
            const connId = meliCreateAccount ? meliCreateAccount.value : '';
            uploadImageFilesToMeli(meliCreateFileInput.files, meliImagesList, renderMeliImagesPreview, connId);
            meliCreateFileInput.value = '';
        });
    }

    if (meliCreateDropzone) {
        meliCreateDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            meliCreateDropzone.classList.add('drag-over');
        });
        meliCreateDropzone.addEventListener('dragleave', () => {
            meliCreateDropzone.classList.remove('drag-over');
        });
        meliCreateDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            meliCreateDropzone.classList.remove('drag-over');
            const connId = meliCreateAccount ? meliCreateAccount.value : '';
            uploadImageFilesToMeli(e.dataTransfer.files, meliImagesList, renderMeliImagesPreview, connId);
        });
    }

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
            showToast('Foto adicionada!', 'info');
        });
    }

    if (meliImagesPreviewList) {
        meliImagesPreviewList.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('[data-action="remove-meli-image"]');
            if (removeBtn) {
                const idx = parseInt(removeBtn.dataset.idx, 10);
                if (!isNaN(idx)) {
                    meliImagesList.splice(idx, 1);
                    renderMeliImagesPreview();
                }
                return;
            }

            const coverBtn = e.target.closest('[data-action="set-meli-create-cover"]');
            if (coverBtn) {
                const idx = parseInt(coverBtn.dataset.idx, 10);
                if (!isNaN(idx) && idx > 0) {
                    const [item] = meliImagesList.splice(idx, 1);
                    meliImagesList.unshift(item);
                    renderMeliImagesPreview();
                    showToast('Foto definida como Capa Principal!', 'success');
                }
                return;
            }

            const moveLeftBtn = e.target.closest('[data-action="move-meli-create-left"]');
            if (moveLeftBtn) {
                const idx = parseInt(moveLeftBtn.dataset.idx, 10);
                if (!isNaN(idx) && idx > 0) {
                    const temp = meliImagesList[idx - 1];
                    meliImagesList[idx - 1] = meliImagesList[idx];
                    meliImagesList[idx] = temp;
                    renderMeliImagesPreview();
                }
                return;
            }

            const moveRightBtn = e.target.closest('[data-action="move-meli-create-right"]');
            if (moveRightBtn) {
                const idx = parseInt(moveRightBtn.dataset.idx, 10);
                if (!isNaN(idx) && idx < meliImagesList.length - 1) {
                    const temp = meliImagesList[idx + 1];
                    meliImagesList[idx + 1] = meliImagesList[idx];
                    meliImagesList[idx] = temp;
                    renderMeliImagesPreview();
                }
                return;
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
                showToast('Adicione pelo menos uma foto para o anúncio.', 'warning');
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
                    pictures: meliImagesList.map(u => ({ source: typeof u === 'string' ? u : (u.url || u.source) })),
                    source_type: sourceType,
                    source_id: sourceId,
                    markup_percent: markupPercent,
                    sync_auto_stock: syncAutoStock,
                    sync_auto_price: syncAutoPrice
                };

                const res = await api('/api/marketplace/mercadolivre/items/create', 'POST', payload);
                showToast(`Anúncio publicado com sucesso no Mercado Livre! (ID: ${res.item?.id || ''})`, 'success');
                closeMeliCreateModal();

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

    // Gerenciador de Título e Fotos no Modal de Edição
    if (meliEditTitle) {
        meliEditTitle.addEventListener('input', () => {
            updateTitleCounter(meliEditTitle, meliEditTitleCounter, meliEditTitleWarning);
        });
    }

    if (meliEditBrowseFilesBtn && meliEditFileInput) {
        meliEditBrowseFilesBtn.addEventListener('click', () => meliEditFileInput.click());
        meliEditFileInput.addEventListener('change', () => {
            const connId = meliEditConnectionId ? meliEditConnectionId.value : '';
            uploadImageFilesToMeli(meliEditFileInput.files, meliEditImagesArray, renderMeliEditImages, connId);
            meliEditFileInput.value = '';
        });
    }

    if (meliEditDropzone) {
        meliEditDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            meliEditDropzone.classList.add('drag-over');
        });
        meliEditDropzone.addEventListener('dragleave', () => {
            meliEditDropzone.classList.remove('drag-over');
        });
        meliEditDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            meliEditDropzone.classList.remove('drag-over');
            const connId = meliEditConnectionId ? meliEditConnectionId.value : '';
            uploadImageFilesToMeli(e.dataTransfer.files, meliEditImagesArray, renderMeliEditImages, connId);
        });
    }

    // Gerenciador de Upload de Clip de Vídeo no Modal de Edição
    if (meliEditClipBrowseBtn && meliEditClipFile) {
        meliEditClipBrowseBtn.addEventListener('click', () => meliEditClipFile.click());
        meliEditClipFile.addEventListener('change', () => {
            const file = meliEditClipFile.files && meliEditClipFile.files[0];
            const itemId = meliEditItemId ? meliEditItemId.value : '';
            const connId = meliEditConnectionId ? meliEditConnectionId.value : '';
            if (file) {
                uploadClipFileToMeli(file, itemId, connId);
                meliEditClipFile.value = '';
            }
        });
    }

    if (meliEditClipDropzone) {
        meliEditClipDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            meliEditClipDropzone.classList.add('drag-over');
        });
        meliEditClipDropzone.addEventListener('dragleave', () => {
            meliEditClipDropzone.classList.remove('drag-over');
        });
        meliEditClipDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            meliEditClipDropzone.classList.remove('drag-over');
            const file = e.dataTransfer.files && e.dataTransfer.files[0];
            const itemId = meliEditItemId ? meliEditItemId.value : '';
            const connId = meliEditConnectionId ? meliEditConnectionId.value : '';
            if (file) {
                uploadClipFileToMeli(file, itemId, connId);
            }
        });
    }

    if (meliEditClipCheckBtn) {
        meliEditClipCheckBtn.addEventListener('click', async () => {
            const itemId = meliEditItemId ? meliEditItemId.value : '';
            if (!itemId) {
                showToast('ID do anúncio não identificado.', 'error');
                return;
            }
            meliEditClipCheckBtn.classList.add('loading');
            meliEditClipCheckBtn.disabled = true;
            try {
                const res = await api(`/api/marketplace/mercadolivre/items/${itemId}/clip-status`);
                if (res.sucesso) {
                    renderMeliClipState(res);
                    const statusLabel = res.clipStatus === 'approved' ? 'Aprovado 🟢' : (res.clipStatus === 'rejected' ? 'Reprovado 🔴' : 'Em Análise 🟡');
                    showToast(`Status de moderação atualizado: ${statusLabel}`, 'info');
                }
            } catch (err) {
                showToast(`Erro ao consultar moderação: ${err.message}`, 'error');
            } finally {
                meliEditClipCheckBtn.classList.remove('loading');
                meliEditClipCheckBtn.disabled = false;
            }
        });
    }

    if (meliEditClipRemoveBtn) {
        meliEditClipRemoveBtn.addEventListener('click', async () => {
            if (!confirm('Deseja realmente desvincular o clipe de vídeo deste anúncio?')) return;
            const itemId = meliEditItemId ? meliEditItemId.value : '';
            if (itemId) {
                try {
                    await api(`/api/marketplace/mercadolivre/items/${itemId}/clip`, 'DELETE');
                    renderMeliClipState(null);
                    showToast('Clip de vídeo desvinculado com sucesso!', 'info');
                } catch (err) {
                    showToast(`Erro ao remover clipe: ${err.message}`, 'error');
                }
            } else {
                renderMeliClipState(null);
            }
        });
    }

    // Ações de Catálogo & Concorrência na Buy Box
    if (meliEditCatalogRefreshBtn) {
        meliEditCatalogRefreshBtn.addEventListener('click', async () => {
            const itemId = meliEditItemId ? meliEditItemId.value : '';
            const connectionId = meliEditConnectionId ? meliEditConnectionId.value : '';
            if (!itemId) {
                showToast('ID do anúncio não identificado.', 'error');
                return;
            }
            meliEditCatalogRefreshBtn.classList.add('loading');
            meliEditCatalogRefreshBtn.disabled = true;
            try {
                const res = await api(`/api/marketplace/mercadolivre/items/${itemId}/price-to-win?connectionId=${connectionId}`);
                if (res.sucesso) {
                    renderMeliCatalogState(res.catalog, meliEditPrice?.value || 0);
                    const statusLabel = res.catalog?.is_winner ? 'Ganhando a Buy Box 🏆' : (res.catalog?.price_to_win ? `Perdendo (Preço sugerido: R$ ${parseFloat(res.catalog.price_to_win).toFixed(2)}) ⚡` : 'Concorrendo 🔄');
                    showToast(`Status do Catálogo atualizado: ${statusLabel}`, 'info');
                } else {
                    showToast('Não foi possível obter dados atualizados do Catálogo.', 'warning');
                }
            } catch (err) {
                showToast(`Erro ao consultar concorrência do catálogo: ${err.message}`, 'error');
            } finally {
                meliEditCatalogRefreshBtn.classList.remove('loading');
                meliEditCatalogRefreshBtn.disabled = false;
            }
        });
    }

    if (meliEditCatalogApplyPriceBtn) {
        meliEditCatalogApplyPriceBtn.addEventListener('click', () => {
            const suggested = meliEditCatalogApplyPriceBtn.dataset.suggestedPrice;
            if (!suggested || isNaN(parseFloat(suggested))) {
                showToast('Nenhum preço sugerido disponível para aplicação.', 'warning');
                return;
            }
            const newPrice = parseFloat(suggested);
            if (meliEditPrice) {
                meliEditPrice.value = newPrice.toFixed(2);
                meliEditPrice.dispatchEvent(new Event('input', { bubbles: true }));
            }
            if (meliCurrentCatalog) {
                renderMeliCatalogState(meliCurrentCatalog, newPrice);
            }
            showToast(`Preço de R$ ${newPrice.toFixed(2)} aplicado! Clique em "Salvar Alterações" para sincronizar com o Mercado Livre.`, 'success');
        });
    }

    // Recalcular taxas e valor líquido dinamicamente
    let meliFeeCalcTimeout = null;
    const triggerMeliFinancialRecalculation = () => {
        clearTimeout(meliFeeCalcTimeout);
        meliFeeCalcTimeout = setTimeout(async () => {
            const itemId = meliEditItemId ? meliEditItemId.value : '';
            const connId = meliEditConnectionId ? meliEditConnectionId.value : '';
            const price = parseFloat(meliEditPrice?.value || 0);
            const listingTypeId = meliEditListingType?.value || 'gold_special';
            if (!price || price <= 0) return;

            try {
                const res = await api('/api/marketplace/mercadolivre/items/calculate-fees', 'POST', {
                    connectionId: connId,
                    itemId,
                    price,
                    listing_type_id: listingTypeId
                });
                if (res.sucesso && res.financial) {
                    renderMeliFinancialState(res.financial);
                }
            } catch (err) {
                console.warn('Falha ao simular taxas dinâmicas:', err);
            }
        }, 350);
    };

    if (meliEditFinRefreshBtn) {
        meliEditFinRefreshBtn.addEventListener('click', async () => {
            meliEditFinRefreshBtn.classList.add('loading');
            meliEditFinRefreshBtn.disabled = true;
            try {
                const itemId = meliEditItemId ? meliEditItemId.value : '';
                const connId = meliEditConnectionId ? meliEditConnectionId.value : '';
                const price = parseFloat(meliEditPrice?.value || 0);
                const listingTypeId = meliEditListingType?.value || 'gold_special';
                const res = await api('/api/marketplace/mercadolivre/items/calculate-fees', 'POST', {
                    connectionId: connId,
                    itemId,
                    price,
                    listing_type_id: listingTypeId
                });
                if (res.sucesso && res.financial) {
                    renderMeliFinancialState(res.financial);
                    showToast(`Taxas recalculadas: Líquido R$ ${res.financial.net_amount.toFixed(2)}`, 'success');
                }
            } catch (err) {
                showToast(`Erro ao recalcular taxas: ${err.message}`, 'error');
            } finally {
                meliEditFinRefreshBtn.classList.remove('loading');
                meliEditFinRefreshBtn.disabled = false;
            }
        });
    }

    if (meliEditListingType) {
        meliEditListingType.addEventListener('change', triggerMeliFinancialRecalculation);
    }

    if (meliEditPrice) {
        meliEditPrice.addEventListener('input', () => {
            if (meliCurrentCatalog && meliCurrentCatalog.is_catalog) {
                renderMeliCatalogState(meliCurrentCatalog, meliEditPrice.value);
            }
            triggerMeliFinancialRecalculation();
        });
    }

    if (meliEditImagesList) {
        meliEditImagesList.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('[data-action="remove-meli-edit-image"]');
            if (removeBtn) {
                const idx = parseInt(removeBtn.dataset.idx, 10);
                if (!isNaN(idx)) {
                    meliEditImagesArray.splice(idx, 1);
                    renderMeliEditImages();
                }
                return;
            }

            const coverBtn = e.target.closest('[data-action="set-meli-edit-cover"]');
            if (coverBtn) {
                const idx = parseInt(coverBtn.dataset.idx, 10);
                if (!isNaN(idx) && idx > 0) {
                    const [item] = meliEditImagesArray.splice(idx, 1);
                    meliEditImagesArray.unshift(item);
                    renderMeliEditImages();
                    showToast('Foto definida como Capa Principal!', 'success');
                }
                return;
            }

            const moveLeftBtn = e.target.closest('[data-action="move-meli-edit-left"]');
            if (moveLeftBtn) {
                const idx = parseInt(moveLeftBtn.dataset.idx, 10);
                if (!isNaN(idx) && idx > 0) {
                    const temp = meliEditImagesArray[idx - 1];
                    meliEditImagesArray[idx - 1] = meliEditImagesArray[idx];
                    meliEditImagesArray[idx] = temp;
                    renderMeliEditImages();
                }
                return;
            }

            const moveRightBtn = e.target.closest('[data-action="move-meli-edit-right"]');
            if (moveRightBtn) {
                const idx = parseInt(moveRightBtn.dataset.idx, 10);
                if (!isNaN(idx) && idx < meliEditImagesArray.length - 1) {
                    const temp = meliEditImagesArray[idx + 1];
                    meliEditImagesArray[idx + 1] = meliEditImagesArray[idx];
                    meliEditImagesArray[idx] = temp;
                    renderMeliEditImages();
                }
                return;
            }
        });
    }

    // Submissão do Formulário de Edição Completa do Mercado Livre
    if (meliEditForm) {
        meliEditForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const itemId = meliEditItemId ? meliEditItemId.value : '';
            const connectionId = meliEditConnectionId ? meliEditConnectionId.value : '';
            const title = meliEditTitle ? meliEditTitle.value.trim() : '';
            const sku = meliEditSku ? meliEditSku.value.trim() : '';
            const gtin = meliEditGtin ? meliEditGtin.value.trim() : '';
            const brand = meliEditBrand ? meliEditBrand.value.trim() : '';
            const model = meliEditModel ? meliEditModel.value.trim() : '';
            const price = meliEditPrice ? parseFloat(meliEditPrice.value) : 0;
            const stock = meliEditStock ? parseInt(meliEditStock.value, 10) : 0;
            const listingTypeId = meliEditListingType ? meliEditListingType.value : 'gold_special';
            const status = meliEditStatus ? meliEditStatus.value : 'active';
            const description = meliEditDescription ? meliEditDescription.value.trim() : '';
            const markupPercent = meliEditMarkup ? parseFloat(meliEditMarkup.value) : 0;
            const syncAutoStock = meliEditSyncStock ? meliEditSyncStock.checked : false;
            const syncAutoPrice = meliEditSyncPrice ? meliEditSyncPrice.checked : false;

            const isCatalog = !!(meliCurrentCatalog && meliCurrentCatalog.is_catalog);

            if (!itemId) {
                showToast('ID do anúncio não identificado.', 'error');
                return;
            }
            if (!isCatalog && !title) {
                showToast('O título do anúncio não pode ficar vazio.', 'warning');
                return;
            }
            if (!price || price <= 0) {
                showToast('Informe um preço de venda válido maior que zero.', 'warning');
                return;
            }
            if (!isCatalog && meliEditImagesArray.length === 0) {
                showToast('O anúncio precisa ter pelo menos uma foto cadastrada.', 'warning');
                return;
            }

            if (meliEditSaveBtn) {
                meliEditSaveBtn.classList.add('loading');
                meliEditSaveBtn.disabled = true;
            }

            try {
                const formattedPictures = meliEditImagesArray.map(item => {
                    if (typeof item === 'string') {
                        if (item.startsWith('http') || item.startsWith('/')) return { source: item };
                        return { id: item };
                    }
                    if (item.id) return { id: String(item.id), url: item.url || item.source };
                    if (item.source) return { source: item.source };
                    if (item.url) return { source: item.url };
                    return item;
                });

                const payload = {
                    connectionId,
                    price,
                    available_quantity: stock,
                    status,
                    listing_type_id: listingTypeId,
                    sku,
                    sync_auto_stock: syncAutoStock,
                    sync_auto_price: syncAutoPrice,
                    markup_percent: markupPercent,
                    is_catalog: isCatalog
                };

                if (!isCatalog) {
                    payload.title = title;
                    payload.gtin = gtin;
                    payload.brand = brand;
                    payload.model = model;
                    payload.description = description;
                    payload.pictures = formattedPictures;
                }

                await api(`/api/marketplace/mercadolivre/items/${itemId}/update`, 'PUT', payload);
                showToast('Anúncio atualizado com sucesso no Mercado Livre!', 'success');
                closeMeliEditModal();

                const activeNav = document.querySelector('.menu-links a.active');
                if (activeNav && activeNav.id === 'nav-meli-anuncios') {
                    renderMercadoLivreListings();
                }
            } catch (editErr) {
                showToast(`Erro ao atualizar anúncio: ${editErr.message}`, 'error');
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
            <button class="btn btn-secondary" data-action="sync-all-catalog-items" title="Atualizar status da Buy Box e sugestão de preço de todos os anúncios de catálogo">
                <i class="fas fa-trophy"></i> Atualizar Buy Box
            </button>
            <button class="btn btn-secondary" data-action="sync-all-fees-items" title="Recalcular comissões ML, frete e valor líquido de todos os anúncios">
                <i class="fas fa-calculator"></i> Recalcular Líquido
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
                api('/api/marketplace/mercadolivre/items?limit=all'),
                api('/api/marketplace-connections').catch(() => ({ connections: [] }))
            ]);

            const allItems = itemsRes.items || [];
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

            // Estado de paginação e filtros
            let currentPage = 1;
            let pageSize = 25; // 25 itens por página por padrão
            let currentFilteredItems = [...allItems];

            let html = `
                <div class="search-filter-card">
                    <div class="meli-filter-grid">
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
                            <label for="meli-filter-catalog"><i class="fas fa-certificate"></i> Catálogo / Buy Box</label>
                            <select id="meli-filter-catalog" class="form-control">
                                <option value="">Todos os Anúncios</option>
                                <option value="catalog">🏷️ Anúncios de Catálogo</option>
                                <option value="winning">🏆 Ganhando Buy Box</option>
                                <option value="losing">⚡ Perdendo Buy Box</option>
                                <option value="traditional">📦 Anúncios Tradicionais</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin: 0;">
                            <label for="meli-filter-account"><i class="fas fa-user-tag"></i> Conta ML</label>
                            <select id="meli-filter-account" class="form-control">
                                <option value="">Todas as Contas</option>
                                ${accountsOptions}
                            </select>
                        </div>
                        <div class="form-group" style="margin: 0; align-self: flex-end; display: flex; align-items: center; gap: 0.5rem;">
                            <button type="button" class="btn btn-secondary" id="meli-filter-refresh-btn" style="height: 42px;" title="Atualizar listagem">
                                <i class="fas fa-rotate"></i>
                            </button>
                            <div id="meli-visible-count-container" class="total-count-badge">
                                <i class="fas fa-box"></i>
                                <span id="meli-visible-count">${allItems.length}</span>
                                <span>anúncios</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="meli-bulk-actions-container" class="bulk-actions-container" style="display: none;">
                    <div class="bulk-actions-info">
                        <span id="meli-selected-count">0</span> anúncio(s) selecionado(s)
                    </div>
                    <div class="bulk-actions-buttons">
                        <button class="btn btn-secondary" data-action="bulk-pause-meli-items"><i class="fas fa-pause"></i> Pausar Selecionados</button>
                        <button class="btn btn-success" data-action="bulk-activate-meli-items"><i class="fas fa-play"></i> Ativar Selecionados</button>
                    </div>
                </div>

                <div id="meli-listings-container" class="results-container"></div>
            `;

            pageContent.innerHTML = html;

            const listingsContainer = document.getElementById('meli-listings-container');
            const searchInput = document.getElementById('meli-filter-search');
            const statusSelect = document.getElementById('meli-filter-status');
            const catalogSelect = document.getElementById('meli-filter-catalog');
            const accountSelect = document.getElementById('meli-filter-account');
            const refreshBtn = document.getElementById('meli-filter-refresh-btn');
            const visibleCountEl = document.getElementById('meli-visible-count');

            const renderView = () => {
                if (!listingsContainer) return;

                const totalItems = currentFilteredItems.length;
                if (totalItems === 0) {
                    listingsContainer.innerHTML = `
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
                    return;
                }

                const isAll = pageSize === 'all';
                const limitPerPage = isAll ? totalItems : parseInt(pageSize, 10);
                const totalPages = isAll ? 1 : Math.ceil(totalItems / limitPerPage);

                if (currentPage > totalPages) currentPage = totalPages;
                if (currentPage < 1) currentPage = 1;

                const startIdx = isAll ? 0 : (currentPage - 1) * limitPerPage;
                const endIdx = isAll ? totalItems : Math.min(startIdx + limitPerPage, totalItems);
                const pageListings = currentFilteredItems.slice(startIdx, endIdx);

                const rows = pageListings.map(item => {
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

                    // Badges de Catálogo e Buy Box (apenas para anúncios de catálogo ativos)
                    const isCatalog = !!item.catalog_listing;
                    let catalogBadges = '';
                    if (isCatalog) {
                        let buyboxBadge = '';
                        if (isActive) {
                            const rawCatStatus = String(item.catalog_status || '').toLowerCase();
                            const isWinner = rawCatStatus === 'winner' || rawCatStatus === 'winning';
                            const priceToWin = item.catalog_price_to_win !== null && item.catalog_price_to_win !== undefined ? parseFloat(item.catalog_price_to_win) : null;
                            
                            if (isWinner) {
                                buyboxBadge = `<span class="buybox-badge winning" title="Ganhando a Buy Box no Catálogo"><i class="fas fa-trophy"></i> Ganhando</span>`;
                            } else if (rawCatStatus === 'losing' || rawCatStatus === 'opportunity' || priceToWin !== null) {
                                buyboxBadge = `<span class="buybox-badge losing" title="Perdendo a Buy Box no Catálogo (Sugerido: R$ ${priceToWin ? priceToWin.toFixed(2) : '-'})"><i class="fas fa-bolt"></i> Perdendo</span>`;
                            } else if (rawCatStatus === 'without_competition') {
                                buyboxBadge = `<span class="buybox-badge competing" title="Sem Concorrência Direta no Catálogo"><i class="fas fa-circle-check"></i> Sem Concorrência</span>`;
                            } else if (rawCatStatus) {
                                buyboxBadge = `<span class="buybox-badge competing" title="Em Concorrência no Catálogo"><i class="fas fa-arrows-split-up-and-left"></i> Concorrendo</span>`;
                            }
                        }

                        catalogBadges = `
                            <span class="catalog-listing-badge" title="Anúncio de Catálogo Mercado Livre (ID: ${item.catalog_product_id || 'Catálogo'})">
                                <i class="fas fa-certificate"></i> Catálogo
                            </span>
                            ${buyboxBadge}
                        `;
                    }

                    return `
                        <tr data-item-id="${item.item_id}">
                            <td style="width: 28px; text-align: center;">
                                <input type="checkbox" class="meli-item-checkbox" data-item-id="${item.item_id}">
                            </td>
                            <td style="width: 44px; text-align: center;">
                                <img src="${thumb}" alt="${item.title}" class="meli-table-img" onerror="this.src='/assets/logos/default-erp.svg'">
                            </td>
                            <td>
                                <div style="display: flex; flex-direction: column; gap: 0.2rem; min-width: 140px;">
                                     <div style="font-weight: 600; color: var(--color-text); font-size: 0.88rem; word-break: break-word; line-height: 1.3;">
                                         ${item.permalink ? `<a href="${item.permalink}" target="_blank" style="text-decoration: none; color: inherit;" title="Abrir no Mercado Livre">${item.title} <i class="fas fa-arrow-up-right-from-square" style="font-size: 0.68rem; color: var(--color-text-offset);"></i></a>` : item.title}
                                     </div>
                                     <div style="display: flex; gap: 0.4rem; align-items: center; font-size: 0.74rem; flex-wrap: wrap;">
                                         <span style="color: var(--color-text-offset);">MLB: <code>${item.item_id}</code></span>
                                         ${item.connection_name ? `<span style="color: var(--color-text-muted);">| Conta: ${item.connection_name}</span>` : ''}
                                         ${catalogBadges}
                                         ${sourceTag}
                                     </div>
                                 </div>
                             </td>
                             <td style="white-space: nowrap;">
                                 <span class="sku-badge">${item.sku || 'N/A'}</span>
                             </td>
                             <td style="white-space: nowrap;">
                                 <div style="display: flex; flex-direction: column; gap: 0.1rem;">
                                     <span class="price-text" style="font-size: 0.92rem; font-weight: 700;">R$ ${parseFloat(item.price).toFixed(2)}</span>
                                     ${isActive && item.catalog_price_to_win && item.catalog_price_to_win != item.price && (String(item.catalog_status).toLowerCase() === 'losing' || String(item.catalog_status).toLowerCase() === 'opportunity') ? `<small style="color: #f59e0b; font-weight: 600; font-size: 0.72rem;" title="Preço sugerido para ganhar a Buy Box"><i class="fas fa-bolt"></i> Ganhe: R$ ${parseFloat(item.catalog_price_to_win).toFixed(2)}</small>` : ''}
                                     ${item.net_amount !== null && item.net_amount !== undefined ? `<span class="net-amount-pill" title="Valor líquido estimado a receber por venda (descontando comissão ML e frete)"><i class="fas fa-coins"></i> Líquido: R$ ${parseFloat(item.net_amount).toFixed(2)}</span>` : ''}
                                     ${item.markup_percent > 0 ? `<small style="color: var(--color-success); font-size: 0.7rem;">+${item.markup_percent}% markup</small>` : ''}
                                 </div>
                            </td>
                            <td style="white-space: nowrap;">
                                <span class="stock-badge ${inStock ? 'in-stock' : 'out-of-stock'}">
                                    <i class="fas ${inStock ? 'fa-check' : 'fa-xmark'}"></i> ${item.available_quantity} un.
                                </span>
                            </td>
                            <td style="white-space: nowrap;">${listingBadge}</td>
                            <td style="white-space: nowrap;">
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
                                    <button class="card-action-btn" data-action="edit-meli-item" data-item="${encodeURIComponent(JSON.stringify(item))}" data-tooltip="Editar Anúncio Completo (Preço, Estoque, Fotos, Descrição...)">
                                        <i class="fas fa-pencil"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('');

                // Gerar botões de paginação numérica
                let paginationNavHtml = '';
                if (totalPages > 1) {
                    const maxButtons = 5;
                    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
                    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

                    if (endPage - startPage + 1 < maxButtons) {
                        startPage = Math.max(1, endPage - maxButtons + 1);
                    }

                    paginationNavHtml = `
                        <div class="pagination-nav">
                            <button type="button" class="pagination-nav-btn" data-page="1" ${currentPage === 1 ? 'disabled' : ''} title="Primeira Página">
                                <i class="fas fa-angles-left"></i>
                            </button>
                            <button type="button" class="pagination-nav-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''} title="Página Anterior">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                    `;

                    for (let p = startPage; p <= endPage; p++) {
                        paginationNavHtml += `
                            <button type="button" class="pagination-nav-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">
                                ${p}
                            </button>
                        `;
                    }

                    paginationNavHtml += `
                            <button type="button" class="pagination-nav-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''} title="Próxima Página">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                            <button type="button" class="pagination-nav-btn" data-page="${totalPages}" ${currentPage === totalPages ? 'disabled' : ''} title="Última Página">
                                <i class="fas fa-angles-right"></i>
                            </button>
                        </div>
                    `;
                }

                listingsContainer.innerHTML = `
                    <div class="results-card">
                        <div class="table-responsive">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th style="width: 32px;"><input type="checkbox" id="meli-select-all-checkbox" title="Selecionar todos os anúncios visíveis nesta página"></th>
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
                        <div class="pagination-footer">
                            <div class="pagination-info">
                                <span>Mostrando <strong>${totalItems > 0 ? startIdx + 1 : 0} - ${endIdx}</strong> de <strong>${totalItems}</strong> anúncios</span>
                                <div style="display: flex; align-items: center; gap: 0.4rem; margin-left: 0.5rem;">
                                    <label for="meli-page-size-select" style="font-size: 0.8rem; color: var(--color-text-offset);">Exibir:</label>
                                    <select id="meli-page-size-select" class="meli-page-size-select">
                                        <option value="25" ${pageSize == 25 ? 'selected' : ''}>25 por pág.</option>
                                        <option value="50" ${pageSize == 50 ? 'selected' : ''}>50 por pág.</option>
                                        <option value="100" ${pageSize == 100 ? 'selected' : ''}>100 por pág.</option>
                                        <option value="all" ${pageSize === 'all' ? 'selected' : ''}>Todos (${totalItems})</option>
                                    </select>
                                </div>
                            </div>
                            ${paginationNavHtml}
                        </div>
                    </div>
                `;

                // Event Listeners de Paginação
                document.querySelectorAll('.pagination-nav-btn[data-page]').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const targetPage = parseInt(btn.dataset.page, 10);
                        if (targetPage && targetPage >= 1 && targetPage <= totalPages && targetPage !== currentPage) {
                            currentPage = targetPage;
                            renderView();
                            listingsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    });
                });

                const pageSizeSelect = document.getElementById('meli-page-size-select');
                if (pageSizeSelect) {
                    pageSizeSelect.addEventListener('change', (e) => {
                        pageSize = e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10);
                        currentPage = 1;
                        renderView();
                    });
                }

                // Sincronizar checkboxes
                const selectAllCheckbox = document.getElementById('meli-select-all-checkbox');
                if (selectAllCheckbox) {
                    selectAllCheckbox.addEventListener('change', (e) => {
                        const isChecked = e.target.checked;
                        document.querySelectorAll('.meli-item-checkbox').forEach(checkbox => {
                            checkbox.checked = isChecked;
                        });
                        updateBulkActionsVisibility();
                    });
                }

                updateBulkActionsVisibility();
            };

            const applyFilters = () => {
                const term = (searchInput?.value || '').toLowerCase().trim();
                const status = statusSelect?.value || '';
                const account = accountSelect?.value || '';
                const catalogFilter = catalogSelect?.value || '';

                currentFilteredItems = allItems.filter(i => {
                    const matchTerm = !term || 
                        (i.title && i.title.toLowerCase().includes(term)) || 
                        (i.sku && i.sku.toLowerCase().includes(term)) || 
                        (i.item_id && i.item_id.toLowerCase().includes(term));
                    const matchStatus = !status || (i.status === status);
                    const matchAccount = !account || (String(i.connection_id) === String(account));

                    const isCat = !!i.catalog_listing;
                    const isItemActive = i.status === 'active';
                    const catStatus = String(i.catalog_status || '').toLowerCase();
                    const isWin = isCat && isItemActive && (catStatus === 'winner' || catStatus === 'winning');
                    const isLose = isCat && isItemActive && (catStatus === 'losing' || catStatus === 'opportunity' || (i.catalog_price_to_win !== null && i.catalog_price_to_win !== undefined));

                    let matchCatalog = true;
                    if (catalogFilter === 'catalog') {
                        matchCatalog = isCat;
                    } else if (catalogFilter === 'winning') {
                        matchCatalog = isWin;
                    } else if (catalogFilter === 'losing') {
                        matchCatalog = isLose;
                    } else if (catalogFilter === 'traditional') {
                        matchCatalog = !isCat;
                    }

                    return matchTerm && matchStatus && matchAccount && matchCatalog;
                });

                currentPage = 1;
                if (visibleCountEl) visibleCountEl.textContent = currentFilteredItems.length;
                renderView();
            };

            if (searchInput) searchInput.addEventListener('input', applyFilters);
            if (statusSelect) statusSelect.addEventListener('change', applyFilters);
            if (catalogSelect) catalogSelect.addEventListener('change', applyFilters);
            if (accountSelect) accountSelect.addEventListener('change', applyFilters);
            if (refreshBtn) refreshBtn.addEventListener('click', () => renderMercadoLivreListings());

            // Lógica para seleção em massa
            const updateBulkActionsVisibility = () => {
                const container = document.getElementById('meli-bulk-actions-container');
                const countEl = document.getElementById('meli-selected-count');
                const selectedCheckboxes = document.querySelectorAll('.meli-item-checkbox:checked');
                
                if (container && countEl) {
                    if (selectedCheckboxes.length > 0) {
                        countEl.textContent = selectedCheckboxes.length;
                        container.style.display = 'flex';
                    } else {
                        container.style.display = 'none';
                    }
                }

                const selectAllCheckbox = document.getElementById('meli-select-all-checkbox');
                const allVisibleCheckboxes = document.querySelectorAll('.meli-item-checkbox');
                if (selectAllCheckbox) {
                    selectAllCheckbox.checked = (allVisibleCheckboxes.length > 0 && selectedCheckboxes.length === allVisibleCheckboxes.length);
                }
            };

            listingsContainer.addEventListener('change', (e) => {
                if (e.target.matches('.meli-item-checkbox')) {
                    updateBulkActionsVisibility();
                }
            });

            // Renderização inicial
            renderView();

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

                showToast(`Importação concluída! ${importRes.count || 0} anúncios importados/atualizados.`, 'success');
                renderMercadoLivreListings();
            } catch (err) {
                showToast(`Falha na importação: ${err.message}`, 'error');
            } finally {
                actionButton.classList.remove('loading');
                actionButton.disabled = false;
            }
            return;
        }

        if (action === 'sync-all-catalog-items') {
            actionButton.classList.add('loading');
            actionButton.disabled = true;
            showToast('Consultando e sincronizando status da Buy Box para todos os anúncios de catálogo...', 'info');

            try {
                const res = await api('/api/marketplace/mercadolivre/sync-all-catalog-status', 'POST');
                if (res.sucesso) {
                    showToast(res.mensagem || 'Buy Box de catálogo atualizada com sucesso!', 'success');
                    renderMercadoLivreListings();
                } else {
                    showToast(`Erro ao sincronizar Buy Box: ${res.erro || 'Falha desconhecida'}`, 'error');
                }
            } catch (err) {
                showToast(`Erro na sincronização da Buy Box: ${err.message}`, 'error');
            } finally {
                actionButton.classList.remove('loading');
                actionButton.disabled = false;
            }
            return;
        }

        if (action === 'sync-all-fees-items') {
            actionButton.classList.add('loading');
            actionButton.disabled = true;
            showToast('Recalculando comissões ML, frete e valor líquido de todos os anúncios...', 'info');

            try {
                const res = await api('/api/marketplace/mercadolivre/sync-all-fees', 'POST');
                if (res.sucesso) {
                    showToast(res.mensagem || 'Cálculo de taxas concluído!', 'success');
                    renderMercadoLivreListings();
                } else {
                    showToast(`Erro ao recalcular taxas: ${res.erro || 'Falha desconhecida'}`, 'error');
                }
            } catch (err) {
                showToast(`Erro ao recalcular taxas: ${err.message}`, 'error');
            } finally {
                actionButton.classList.remove('loading');
                actionButton.disabled = false;
            }
            return;
        }

        if (action === 'bulk-pause-meli-items' || action === 'bulk-activate-meli-items') {
            const selectedCheckboxes = document.querySelectorAll('.meli-item-checkbox:checked');
            if (selectedCheckboxes.length === 0) {
                showToast('Nenhum anúncio selecionado para a ação em massa.', 'warning');
                return;
            }

            const itemIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.itemId);
            const newStatus = action === 'bulk-pause-meli-items' ? 'paused' : 'active';
            const actionLabel = newStatus === 'active' ? 'Ativando' : 'Pausando';

            actionButton.classList.add('loading');
            actionButton.disabled = true;

            try {
                // Assumindo que a API pode lidar com um array de IDs
                // Se não, você precisará fazer um loop e chamar a API para cada um.
                const res = await api(`/api/marketplace/mercadolivre/items/bulk-status`, 'PUT', {
                    itemIds,
                    newStatus
                });
                showToast(`${res.successCount || itemIds.length} anúncio(s) foram atualizados.`, 'success');
                renderMercadoLivreListings();
            } catch (err) {
                showToast(`Erro na ação em massa: ${err.message}`, 'error');
            } finally {
                actionButton.classList.remove('loading');
                actionButton.disabled = false;
                const bulkContainer = document.getElementById('meli-bulk-actions-container');
                if (bulkContainer) bulkContainer.style.display = 'none';
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
     * MÓDULO DE INTELIGÊNCIA ARTIFICIAL (GEMINI AGENTS)
     * =================================================================
     */

    /**
     * Helper para formatar Markdown simples em HTML seguro
     */
    function formatMarkdownText(text) {
        if (!text) return '';
        let html = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // Bold & Italic
        html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

        // Inline code
        html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');

        // Listas não ordenadas
        html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');
        html = html.replace(/<\/ul>\s*<ul>/gim, '');

        // Quebras de linha normais
        html = html.replace(/\n\n/gim, '</p><p>');
        html = html.replace(/\n/gim, '<br>');

        return `<p>${html}</p>`;
    }

    /**
     * TELA 1: Chat & Copilot com Agentes
     */
    async function renderAIChatView(targetAgentId = null, targetConvId = null) {
        mainTitle.textContent = 'Chat com Agentes IA';
        mainSubtitle.textContent = 'Interaja com agentes especializados equipados com ferramentas para análise e execução no ERP';
        headerActions.innerHTML = '';
        showLoading('Carregando agentes e conversas...');

        try {
            const [agentsRes, convsRes, settingsRes] = await Promise.all([
                api('/api/ai/agents'),
                api('/api/ai/conversations'),
                api('/api/ai/settings')
            ]);

            const agents = agentsRes.agents || [];
            const conversations = convsRes.conversations || [];
            const hasKey = settingsRes.settings?.has_key;

            if (!hasKey) {
                pageContent.innerHTML = `
                    <div class="empty-state" style="max-width: 600px; margin: 3rem auto;">
                        <div class="empty-state-icon" style="color: var(--color-primary); background-color: var(--color-primary-light);">
                            <i class="fas fa-key"></i>
                        </div>
                        <h3>Chave do Google Gemini Necessária</h3>
                        <p>Para ativar os agentes inteligentes, cadastre sua chave de API do Google Gemini (Google AI Studio ou Vertex AI).</p>
                        <button class="btn btn-primary" id="btn-goto-ai-settings" style="margin-top: 1rem;">
                            <i class="fas fa-gear"></i> Configurar Chave da API
                        </button>
                    </div>
                `;
                document.getElementById('btn-goto-ai-settings')?.addEventListener('click', () => {
                    setActiveNavLink('nav-ai-settings');
                    renderAISettingsView();
                });
                return;
            }

            if (agents.length === 0) {
                pageContent.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon" style="color: var(--color-warning); background-color: var(--color-warning-light);">
                            <i class="fas fa-robot"></i>
                        </div>
                        <h3>Nenhum agente cadastrado</h3>
                        <p>Não há agentes de IA ativos no momento.</p>
                    </div>
                `;
                return;
            }

            let currentAgentId = targetAgentId || agents[0].id;
            let currentConvId = targetConvId || (conversations.find(c => c.agent_id == currentAgentId)?.id || null);

            const activeAgent = agents.find(a => a.id == currentAgentId) || agents[0];

            pageContent.innerHTML = `
                <div class="ai-chat-layout">
                    <!-- Barra Lateral de Conversas -->
                    <div class="ai-conv-sidebar">
                        <div class="ai-conv-sidebar-header">
                            <button type="button" class="ai-new-chat-btn" id="ai-btn-new-chat">
                                <i class="fas fa-plus"></i> Nova Análise
                            </button>
                            <label style="font-size: 0.76rem; font-weight: 700; color: var(--color-text-offset); text-transform: uppercase;">Agente Ativo:</label>
                            <select id="ai-sidebar-agent-select" class="ai-agent-selector-select">
                                ${agents.map(a => `
                                    <option value="${a.id}" ${a.id == activeAgent.id ? 'selected' : ''}>
                                        ${a.name} (${a.model})
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="ai-conv-list" id="ai-conv-list">
                            ${conversations.length === 0 ? `
                                <div style="text-align: center; color: var(--color-text-muted); font-size: 0.8rem; padding: 2rem 1rem;">
                                    Nenhuma conversa anterior. Inicie uma nova análise ao lado!
                                </div>
                            ` : conversations.map(c => `
                                <div class="ai-conv-item ${c.id == currentConvId ? 'active' : ''}" data-conv-id="${c.id}" data-agent-id="${c.agent_id}">
                                    <div class="ai-conv-item-info">
                                        <span class="ai-conv-item-title">${c.title || 'Nova Conversa'}</span>
                                        <span class="ai-conv-item-agent">
                                            <i class="fas ${c.avatar_icon || 'fa-robot'}" style="color: ${c.avatar_color || 'var(--color-primary)'};"></i>
                                            ${c.agent_name || 'Agente'} • ${c.message_count || 0} msgs
                                        </span>
                                    </div>
                                    <button type="button" class="ai-conv-item-delete" data-action="delete-conv" data-conv-id="${c.id}" title="Excluir conversa">
                                        <i class="fas fa-trash-can"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Viewport Principal do Chat -->
                    <div class="ai-chat-viewport">
                        <div class="ai-chat-header">
                            <div class="ai-agent-header-info">
                                <div class="ai-agent-avatar" style="background-color: ${activeAgent.avatar_color || '#3b82f6'};">
                                    <i class="fas ${activeAgent.avatar_icon || 'fa-robot'}"></i>
                                </div>
                                <div class="ai-agent-header-text">
                                    <h3>
                                        ${activeAgent.name}
                                        <span class="ai-model-badge"><i class="fas fa-sparkles"></i> ${activeAgent.model}</span>
                                    </h3>
                                    <p>${activeAgent.role_title}</p>
                                </div>
                            </div>
                            <div>
                                <span class="badge ${activeAgent.require_confirmation ? 'badge-warning' : 'badge-success'}" style="font-size: 0.74rem;">
                                    <i class="fas ${activeAgent.require_confirmation ? 'fa-shield-halved' : 'fa-bolt'}"></i>
                                    ${activeAgent.require_confirmation ? 'Requer Confirmação' : 'Autônomo'}
                                </span>
                            </div>
                        </div>

                        <!-- Container de Mensagens -->
                        <div class="ai-messages-container" id="ai-messages-container">
                            <div class="ai-message assistant">
                                <div class="ai-agent-avatar" style="background-color: ${activeAgent.avatar_color || '#3b82f6'}; width: 32px; height: 32px; font-size: 0.95rem;">
                                    <i class="fas ${activeAgent.avatar_icon || 'fa-robot'}"></i>
                                </div>
                                <div class="ai-message-bubble">
                                    <p>Olá! Eu sou o <strong>${activeAgent.name}</strong>.</p>
                                    <p>${activeAgent.description}</p>
                                    <p style="margin-top: 0.5rem; font-size: 0.82rem; color: var(--color-text-offset);">
                                        <i class="fas fa-wrench"></i> <strong>Ferramentas conectadas:</strong> ${(activeAgent.allowed_tools || []).join(', ')}
                                    </p>
                                    <p style="margin-top: 0.4rem;">Como posso ajudar você agora?</p>
                                </div>
                            </div>
                        </div>

                        <!-- Chips de Sugestões Rápidas -->
                        <div class="ai-prompt-chips" id="ai-prompt-chips">
                            <button type="button" class="ai-chip-btn" data-prompt="Auditar anúncios com margem líquida inferior a 15%">
                                <i class="fas fa-percent"></i> Auditar Margens Baixas (< 15%)
                            </button>
                            <button type="button" class="ai-chip-btn" data-prompt="Verificar oportunidades de Buy Box no Catálogo">
                                <i class="fas fa-trophy"></i> Oportunidades Buy Box
                            </button>
                            <button type="button" class="ai-chip-btn" data-prompt="Gerar um resumo geral das métricas da loja">
                                <i class="fas fa-chart-line"></i> Resumo Geral da Loja
                            </button>
                            <button type="button" class="ai-chip-btn" data-prompt="Verificar divergências de estoque com fornecedores">
                                <i class="fas fa-boxes-stacked"></i> Auditoria de Estoque
                            </button>
                        </div>

                        <!-- Caixa de Entrada -->
                        <div class="ai-input-area">
                            <textarea id="ai-chat-input" class="ai-chat-textarea" placeholder="Envie uma instrução ou pergunta para o ${activeAgent.name}... (Shift + Enter para pular linha)"></textarea>
                            <button type="button" id="ai-chat-send-btn" class="ai-send-btn" title="Enviar Mensagem">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Helper para renderizar mensagens da conversa carregada
            const loadAndRenderMessages = async (convId) => {
                if (!convId) return;
                try {
                    const res = await api(`/api/ai/conversations/${convId}`);
                    const messages = res.messages || [];
                    const container = document.getElementById('ai-messages-container');
                    if (!container) return;

                    let html = '';
                    for (const m of messages) {
                        if (m.sender === 'user') {
                            html += `
                                <div class="ai-message user">
                                    <div class="ai-message-bubble">${formatMarkdownText(m.content)}</div>
                                </div>
                            `;
                        } else if (m.sender === 'assistant') {
                            html += `
                                <div class="ai-message assistant">
                                    <div class="ai-agent-avatar" style="background-color: ${activeAgent.avatar_color || '#3b82f6'}; width: 32px; height: 32px; font-size: 0.95rem;">
                                        <i class="fas ${activeAgent.avatar_icon || 'fa-robot'}"></i>
                                    </div>
                                    <div class="ai-message-bubble">
                                        ${m.content ? formatMarkdownText(m.content) : ''}
                                        ${Array.isArray(m.tool_calls) && m.tool_calls.length > 0 ? `
                                            <div style="margin-top: 0.5rem;">
                                                ${m.tool_calls.map(tc => `
                                                    <div class="ai-tool-call-card">
                                                        <div class="ai-tool-call-info">
                                                            <i class="fas fa-gear" style="color: var(--color-primary);"></i>
                                                            <span><strong>Ferramenta:</strong> <code>${tc.name}</code></span>
                                                        </div>
                                                        <span class="ai-tool-call-badge success">Executado</span>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            `;
                        } else if (m.sender === 'system') {
                            html += `
                                <div class="ai-message system">
                                    <div class="ai-message-bubble">${m.content}</div>
                                </div>
                            `;
                        }
                    }

                    if (html) {
                        container.innerHTML = html;
                        container.scrollTop = container.scrollHeight;
                    }
                } catch (e) {
                    console.error('Erro ao carregar mensagens da conversa:', e);
                }
            };

            if (currentConvId) {
                await loadAndRenderMessages(currentConvId);
            }

            // Event Listeners da View de Chat
            const inputEl = document.getElementById('ai-chat-input');
            const sendBtn = document.getElementById('ai-chat-send-btn');
            const messagesContainer = document.getElementById('ai-messages-container');
            const agentSelect = document.getElementById('ai-sidebar-agent-select');
            const newChatBtn = document.getElementById('ai-btn-new-chat');

            // Troca de agente
            agentSelect?.addEventListener('change', () => {
                renderAIChatView(parseInt(agentSelect.value, 10), null);
            });

            // Novo chat
            newChatBtn?.addEventListener('click', () => {
                renderAIChatView(currentAgentId, null);
            });

            // Selecionar conversa na lista
            document.getElementById('ai-conv-list')?.addEventListener('click', async (e) => {
                const deleteBtn = e.target.closest('[data-action="delete-conv"]');
                if (deleteBtn) {
                    e.stopPropagation();
                    const convId = deleteBtn.dataset.convId;
                    if (confirm('Deseja excluir esta conversa do histórico?')) {
                        await api(`/api/ai/conversations/${convId}`, 'DELETE');
                        showToast('Conversa excluída.', 'info');
                        renderAIChatView(currentAgentId, null);
                    }
                    return;
                }

                const item = e.target.closest('.ai-conv-item');
                if (item) {
                    const convId = item.dataset.convId;
                    const agId = item.dataset.agentId;
                    renderAIChatView(agId, convId);
                }
            });

            // Clique em chips de sugestão
            document.getElementById('ai-prompt-chips')?.addEventListener('click', (e) => {
                const chip = e.target.closest('.ai-chip-btn');
                if (chip && chip.dataset.prompt && inputEl) {
                    inputEl.value = chip.dataset.prompt;
                    sendMessage();
                }
            });

            // Função de envio de mensagem
            const sendMessage = async () => {
                const text = inputEl?.value.trim();
                if (!text) return;

                inputEl.value = '';
                inputEl.disabled = true;
                sendBtn.disabled = true;

                // Renderiza bolha do usuário imediatamente
                messagesContainer.innerHTML += `
                    <div class="ai-message user">
                        <div class="ai-message-bubble">${formatMarkdownText(text)}</div>
                    </div>
                `;

                // Indicador de digitação
                const typingId = 'ai-typing-' + Date.now();
                messagesContainer.innerHTML += `
                    <div class="ai-message assistant" id="${typingId}">
                        <div class="ai-agent-avatar" style="background-color: ${activeAgent.avatar_color || '#3b82f6'}; width: 32px; height: 32px; font-size: 0.95rem;">
                            <i class="fas ${activeAgent.avatar_icon || 'fa-robot'}"></i>
                        </div>
                        <div class="ai-message-bubble">
                            <div class="ai-typing-indicator">
                                <div class="ai-typing-dot"></div>
                                <div class="ai-typing-dot"></div>
                                <div class="ai-typing-dot"></div>
                                <span style="font-size: 0.8rem; color: var(--color-text-offset); margin-left: 0.5rem;">${activeAgent.name} está analisando...</span>
                            </div>
                        </div>
                    </div>
                `;
                messagesContainer.scrollTop = messagesContainer.scrollHeight;

                try {
                    const res = await api('/api/ai/chat', 'POST', {
                        agent_id: activeAgent.id,
                        conversation_id: currentConvId,
                        message: text
                    });

                    currentConvId = res.conversation_id;

                    // Remove indicador de digitação
                    document.getElementById(typingId)?.remove();

                    // Renderiza resposta da IA
                    let assistantHtml = `
                        <div class="ai-message assistant">
                            <div class="ai-agent-avatar" style="background-color: ${activeAgent.avatar_color || '#3b82f6'}; width: 32px; height: 32px; font-size: 0.95rem;">
                                <i class="fas ${activeAgent.avatar_icon || 'fa-robot'}"></i>
                            </div>
                            <div class="ai-message-bubble">
                                ${res.message ? formatMarkdownText(res.message) : ''}
                                
                                ${Array.isArray(res.executed_actions) && res.executed_actions.length > 0 ? `
                                    <div style="margin-top: 0.75rem;">
                                        ${res.executed_actions.map(ea => `
                                            <div class="ai-tool-call-card">
                                                <div class="ai-tool-call-info">
                                                    <i class="fas fa-check-circle" style="color: var(--color-success);"></i>
                                                    <span><strong>Ação Executada:</strong> <code>${ea.tool_name}</code></span>
                                                </div>
                                                <span class="ai-tool-call-badge success">Concluído</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : ''}

                                ${Array.isArray(res.pending_actions) && res.pending_actions.length > 0 ? `
                                    <div style="margin-top: 0.75rem;">
                                        ${res.pending_actions.map(pa => `
                                            <div class="ai-action-approval-card" id="ai-pending-card-${pa.action_id}">
                                                <div class="ai-action-approval-header">
                                                    <i class="fas fa-triangle-exclamation"></i>
                                                    <span>Confirmação Necessária de Alteração</span>
                                                </div>
                                                <div class="ai-action-approval-body">
                                                    <strong>${pa.descricao}</strong>
                                                    <div style="font-size: 0.78rem; color: var(--color-text-offset); margin-top: 0.35rem;">
                                                        Ferramenta: <code>${pa.tool_name}</code>
                                                    </div>
                                                </div>
                                                <div class="ai-action-approval-buttons">
                                                    <button type="button" class="btn btn-secondary btn-sm btn-reject-action" data-action-id="${pa.action_id}">
                                                        <i class="fas fa-times"></i> Rejeitar
                                                    </button>
                                                    <button type="button" class="btn btn-success btn-sm btn-approve-action" data-action-id="${pa.action_id}">
                                                        <i class="fas fa-check"></i> Aprovar e Executar no ML
                                                    </button>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;

                    messagesContainer.innerHTML += assistantHtml;
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;

                } catch (chatErr) {
                    document.getElementById(typingId)?.remove();
                    messagesContainer.innerHTML += `
                        <div class="ai-message assistant">
                            <div class="ai-agent-avatar" style="background-color: var(--color-danger); width: 32px; height: 32px;">
                                <i class="fas fa-triangle-exclamation"></i>
                            </div>
                            <div class="ai-message-bubble" style="border-color: var(--color-danger); background-color: var(--color-danger-light);">
                                <p style="color: var(--color-danger); font-weight: 600;">Erro ao consultar agente:</p>
                                <p style="font-size: 0.85rem;">${chatErr.message}</p>
                            </div>
                        </div>
                    `;
                    showToast(`Erro do Agente: ${chatErr.message}`, 'error');
                } finally {
                    if (inputEl) {
                        inputEl.disabled = false;
                        inputEl.focus();
                    }
                    if (sendBtn) sendBtn.disabled = false;
                }
            };

            sendBtn?.addEventListener('click', sendMessage);
            inputEl?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });

            // Listener para aprovação ou rejeição de ações pendentes
            messagesContainer?.addEventListener('click', async (e) => {
                const approveBtn = e.target.closest('.btn-approve-action');
                if (approveBtn) {
                    const actionId = approveBtn.dataset.actionId;
                    approveBtn.disabled = true;
                    approveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Executando...';
                    try {
                        const res = await api(`/api/ai/actions/${actionId}/approve`, 'POST');
                        showToast(res.mensagem || 'Ação aprovada e executada com sucesso!', 'success');
                        const card = document.getElementById(`ai-pending-card-${actionId}`);
                        if (card) {
                            card.innerHTML = `
                                <div style="color: var(--color-success); font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                                    <i class="fas fa-circle-check"></i> Ação Aprovada e Concluída no Mercado Livre
                                </div>
                            `;
                        }
                    } catch (err) {
                        showToast(`Erro ao aprovar: ${err.message}`, 'error');
                        approveBtn.disabled = false;
                        approveBtn.innerHTML = '<i class="fas fa-check"></i> Aprovar e Executar';
                    }
                    return;
                }

                const rejectBtn = e.target.closest('.btn-reject-action');
                if (rejectBtn) {
                    const actionId = rejectBtn.dataset.actionId;
                    try {
                        await api(`/api/ai/actions/${actionId}/reject`, 'POST');
                        showToast('Ação cancelada.', 'info');
                        const card = document.getElementById(`ai-pending-card-${actionId}`);
                        if (card) {
                            card.innerHTML = `
                                <div style="color: var(--color-text-muted); font-size: 0.85rem;">
                                    <i class="fas fa-ban"></i> Ação rejeitada pelo usuário.
                                </div>
                            `;
                        }
                    } catch (err) {
                        showToast(`Erro ao rejeitar: ${err.message}`, 'error');
                    }
                }
            });

        } catch (error) {
            renderError(error);
        }
    }

    /**
     * TELA 2: Hub de Agentes Especializados
     */
    async function renderAIAgentsHubView() {
        mainTitle.textContent = 'Hub de Agentes Inteligentes';
        mainSubtitle.textContent = 'Agentes autônomos treinados para executar funções de negócio no ERP e Mercado Livre';
        headerActions.innerHTML = '';
        showLoading('Carregando agentes...');

        try {
            const res = await api('/api/ai/agents');
            const agents = res.agents || [];

            pageContent.innerHTML = `
                <div class="ai-page-header">
                    <div>
                        <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--color-text);">Agentes Especialistas Disponíveis</h2>
                        <p style="font-size: 0.85rem; color: var(--color-text-offset);">Selecione um agente para iniciar uma análise ou automação</p>
                    </div>
                </div>

                <div class="ai-agents-grid">
                    ${agents.map(a => `
                        <div class="ai-agent-card">
                            <div>
                                <div class="ai-agent-card-top">
                                    <div class="ai-agent-avatar" style="background-color: ${a.avatar_color || '#3b82f6'}; width: 48px; height: 48px; font-size: 1.35rem;">
                                        <i class="fas ${a.avatar_icon || 'fa-robot'}"></i>
                                    </div>
                                    <div class="ai-agent-card-info">
                                        <h3>${a.name}</h3>
                                        <div class="role">${a.role_title}</div>
                                        <div class="desc">${a.description}</div>
                                    </div>
                                </div>
                                <div style="margin-top: 1rem;">
                                    <div style="font-size: 0.75rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: 0.4rem;">
                                        Ferramentas Habilitadas:
                                    </div>
                                    <div class="ai-agent-card-tools">
                                        ${(a.allowed_tools || []).map(t => `<span class="ai-tool-tag"><i class="fas fa-wrench"></i> ${t}</span>`).join('')}
                                    </div>
                                </div>
                            </div>

                            <div style="margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center;">
                                <span class="badge ${a.require_confirmation ? 'badge-warning' : 'badge-success'}" style="font-size: 0.72rem;">
                                    ${a.require_confirmation ? 'Confirmação Manual' : 'Autônomo'}
                                </span>
                                <button type="button" class="btn btn-primary btn-sm btn-open-agent-chat" data-agent-id="${a.id}">
                                    <i class="fas fa-comments"></i> Conversar
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

            document.querySelectorAll('.btn-open-agent-chat').forEach(btn => {
                btn.addEventListener('click', () => {
                    const agentId = btn.dataset.agentId;
                    setActiveNavLink('nav-ai-chat');
                    renderAIChatView(parseInt(agentId, 10), null);
                });
            });

        } catch (error) {
            renderError(error);
        }
    }

    /**
     * TELA 3: Configurações do Módulo de IA (Gemini)
     */
    async function renderAISettingsView() {
        mainTitle.textContent = 'Configurações de Inteligência Artificial';
        mainSubtitle.textContent = 'Gerencie sua chave da API Google Gemini, modelos e parâmetros de raciocínio';
        headerActions.innerHTML = '';
        showLoading('Carregando configurações de IA...');

        try {
            const res = await api('/api/ai/settings');
            const settings = res.settings || {};

            pageContent.innerHTML = `
                <div class="ai-settings-container">
                    <div class="ai-card">
                        <h3 class="ai-card-title"><i class="fas fa-key" style="color: var(--color-primary);"></i> Chave de API do Google Gemini</h3>
                        <p class="ai-card-subtitle">Insira a chave de API gerada no <a href="https://aistudio.google.com/" target="_blank" style="color: var(--color-primary); text-decoration: underline;">Google AI Studio</a> ou Vertex AI.</p>

                        <form id="ai-settings-form">
                            <div class="form-group">
                                <label for="ai-gemini-key">Chave de API (API Key)</label>
                                <div style="display: flex; gap: 0.65rem;">
                                    <input type="password" id="ai-gemini-key" class="form-control" placeholder="${settings.has_key ? `Chave salva: ${settings.masked_key}` : 'Cole aqui sua chave (Ex: AIzaSy...)'}">
                                    <button type="button" id="ai-btn-test-key" class="btn btn-secondary" style="min-width: 140px;">
                                        <i class="fas fa-vial"></i> Testar Conexão
                                    </button>
                                </div>
                                <small style="color: var(--color-text-offset); font-size: 0.78rem; margin-top: 0.25rem; display: block;">
                                    ${settings.has_key ? `✅ Chave ativa configurada (${settings.masked_key}). Deixe em branco para manter a atual.` : 'Nenhuma chave configurada ainda.'}
                                </small>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
                                <div class="form-group">
                                    <label for="ai-default-model">Modelo Padrão do Gemini</label>
                                    <select id="ai-default-model" class="form-control">
                                        <option value="gemini-2.5-flash" ${settings.default_model === 'gemini-2.5-flash' ? 'selected' : ''}>gemini-2.5-flash (Mais Rápido & Econômico - Recomendado)</option>
                                        <option value="gemini-2.5-pro" ${settings.default_model === 'gemini-2.5-pro' ? 'selected' : ''}>gemini-2.5-pro (Raciocínio Profundo & Avançado)</option>
                                        <option value="gemini-1.5-flash" ${settings.default_model === 'gemini-1.5-flash' ? 'selected' : ''}>gemini-1.5-flash</option>
                                        <option value="gemini-1.5-pro" ${settings.default_model === 'gemini-1.5-pro' ? 'selected' : ''}>gemini-1.5-pro</option>
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label for="ai-temperature">Temperatura (Criatividade vs Precisão): <span id="temp-val">${settings.temperature || 0.2}</span></label>
                                    <input type="range" id="ai-temperature" min="0" max="1" step="0.05" value="${settings.temperature || 0.2}" class="form-range" style="width: 100%; margin-top: 0.5rem;">
                                </div>
                            </div>

                            <div id="ai-test-result-box" style="display: none; margin-top: 1rem; padding: 0.85rem; border-radius: var(--border-radius-sm); font-size: 0.85rem;"></div>

                            <div style="margin-top: 1.5rem; display: flex; justify-content: flex-end;">
                                <button type="submit" id="ai-btn-save-settings" class="btn btn-primary" style="min-width: 160px;">
                                    <i class="fas fa-save"></i> Salvar Configurações
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            `;

            const form = document.getElementById('ai-settings-form');
            const keyInput = document.getElementById('ai-gemini-key');
            const modelSelect = document.getElementById('ai-default-model');
            const tempRange = document.getElementById('ai-temperature');
            const tempVal = document.getElementById('temp-val');
            const testBtn = document.getElementById('ai-btn-test-key');
            const testResultBox = document.getElementById('ai-test-result-box');
            const saveBtn = document.getElementById('ai-btn-save-settings');

            tempRange?.addEventListener('input', () => {
                if (tempVal) tempVal.textContent = tempRange.value;
            });

            // Testar Chave
            testBtn?.addEventListener('click', async () => {
                testBtn.disabled = true;
                testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testando...';
                testResultBox.style.display = 'block';
                testResultBox.className = 'status-box';
                testResultBox.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Conectando à API do Google Gemini...';

                try {
                    const res = await api('/api/ai/settings/test', 'POST', {
                        apiKey: keyInput.value.trim(),
                        model: modelSelect.value
                    });

                    testResultBox.style.backgroundColor = 'var(--color-success-light)';
                    testResultBox.style.color = 'var(--color-success)';
                    testResultBox.style.border = '1px solid var(--color-success)';
                    testResultBox.innerHTML = `✅ <strong>Sucesso!</strong> ${res.mensagem} (Modelo: <code>${res.modelo}</code>)`;
                    showToast('Conexão com a API do Gemini realizada com sucesso!', 'success');
                } catch (err) {
                    testResultBox.style.backgroundColor = 'var(--color-danger-light)';
                    testResultBox.style.color = 'var(--color-danger)';
                    testResultBox.style.border = '1px solid var(--color-danger)';
                    testResultBox.innerHTML = `❌ <strong>Erro no teste:</strong> ${err.message}`;
                    showToast(`Falha no teste: ${err.message}`, 'error');
                } finally {
                    testBtn.disabled = false;
                    testBtn.innerHTML = '<i class="fas fa-vial"></i> Testar Conexão';
                }
            });

            // Salvar Configurações
            form?.addEventListener('submit', async (e) => {
                e.preventDefault();
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

                try {
                    await api('/api/ai/settings', 'POST', {
                        gemini_api_key: keyInput.value.trim() || undefined,
                        default_model: modelSelect.value,
                        temperature: parseFloat(tempRange.value)
                    });

                    showToast('Configurações de IA salvas com sucesso!', 'success');
                    renderAISettingsView();
                } catch (err) {
                    showToast(`Erro ao salvar: ${err.message}`, 'error');
                } finally {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Configurações';
                }
            });

        } catch (error) {
            renderError(error);
        }
    }

    /**
     * TELA 4: Auditoria de Ações Executadas por Agentes
     */
    async function renderAILogsView() {
        mainTitle.textContent = 'Auditoria de Ações dos Agentes';
        mainSubtitle.textContent = 'Histórico detalhado de ferramentas, consultas e alterações executadas pela IA';
        headerActions.innerHTML = '';
        showLoading('Carregando histórico de auditoria...');

        try {
            const res = await api('/api/ai/logs?limit=100');
            const logs = res.logs || [];

            pageContent.innerHTML = `
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Data / Hora</th>
                                <th>Agente</th>
                                <th>Ferramenta (Tool)</th>
                                <th>Argumentos</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${logs.length === 0 ? `
                                <tr>
                                    <td colspan="5" style="text-align: center; color: var(--color-text-muted); padding: 2rem;">
                                        Nenhuma ação registrada ainda.
                                    </td>
                                </tr>
                            ` : logs.map(l => {
                                const statusClass = l.status === 'executed' || l.status === 'approved' ? 'badge-success' : (l.status === 'pending_approval' ? 'badge-warning' : 'badge-danger');
                                const statusLabel = l.status === 'executed' ? 'Executado' : (l.status === 'approved' ? 'Aprovado' : (l.status === 'pending_approval' ? 'Pendente' : 'Falhou'));
                                const dateStr = l.created_at ? new Date(l.created_at).toLocaleString('pt-BR') : '-';

                                return `
                                    <tr>
                                        <td style="font-size: 0.8rem; white-space: nowrap;">${dateStr}</td>
                                        <td>
                                            <span style="font-weight: 600; display: flex; align-items: center; gap: 0.35rem;">
                                                <i class="fas ${l.avatar_icon || 'fa-robot'}" style="color: ${l.avatar_color || 'var(--color-primary)'};"></i>
                                                ${l.agent_name || 'Agente'}
                                            </span>
                                        </td>
                                        <td><code>${l.tool_name}</code></td>
                                        <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.78rem; font-family: var(--font-family-mono);">
                                            ${JSON.stringify(l.tool_args || {})}
                                        </td>
                                        <td><span class="badge ${statusClass}">${statusLabel}</span></td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            renderError(error);
        }
    }

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
        'nav-meli-conexoes': renderMarketplaceConnections,
        'nav-ai-chat': () => renderAIChatView(),
        'nav-ai-agents': renderAIAgentsHubView,
        'nav-ai-settings': renderAISettingsView,
        'nav-ai-logs': renderAILogsView
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
