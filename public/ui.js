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

    // Modal Pop-up de Teste Diagnóstico de 1 Produto no Integrim (CISS Poder)
    const integrimTestModal = document.getElementById('integrim-test-modal');
    const integrimTestForm = document.getElementById('integrim-test-form');
    const integrimTestSku = document.getElementById('integrim-test-sku');
    const integrimTestEan = document.getElementById('integrim-test-ean');
    const integrimTestResults = document.getElementById('integrim-test-results');
    const integrimTestRunBtn = document.getElementById('integrim-test-run-btn');
    const integrimTestModalCloseBtns = document.querySelectorAll('.integrim-test-modal-close');

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
     * Modal Pop-up para Teste Diagnóstico de 1 Produto no Integrim (CISS Poder)
     */
    const openIntegrimSingleProductTestModal = (prefilledSku = '') => {
        if (!integrimTestModal) return;
        if (integrimTestSku) {
            integrimTestSku.value = prefilledSku || '';
        }
        if (integrimTestEan) {
            integrimTestEan.value = '';
        }

        if (prefilledSku) {
            runIntegrimProductDiagnostic();
        } else if (integrimTestResults) {
            integrimTestResults.innerHTML = `
                <div class="empty-state" style="padding: 2.5rem 1rem;">
                    <div class="empty-state-icon" style="background: rgba(245, 158, 11, 0.12); color: #f59e0b;">
                        <i class="fas fa-microscope"></i>
                    </div>
                    <h3>Pronto para testar os endpoints</h3>
                    <p>Informe o SKU ou deixe em branco e clique em <strong>"Testar 3 Endpoints"</strong> para validar a autenticação e as respostas de CAD_PRODUTOS, SALDOS e CUSTOS.</p>
                </div>
            `;
        }

        integrimTestModal.style.display = 'flex';
        if (!prefilledSku && integrimTestSku) {
            setTimeout(() => integrimTestSku.focus(), 150);
        }
    };

    const closeIntegrimTestModal = () => {
        if (integrimTestModal) integrimTestModal.style.display = 'none';
    };

    const runIntegrimProductDiagnostic = async () => {
        const sku = integrimTestSku ? integrimTestSku.value.trim() : '';
        const ean = integrimTestEan ? integrimTestEan.value.trim() : '';

        if (integrimTestRunBtn) {
            integrimTestRunBtn.disabled = true;
            integrimTestRunBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Executando Teste...';
        }

        if (integrimTestResults) {
            integrimTestResults.innerHTML = `
                <div style="padding: 2.5rem 1rem; background: var(--color-surface); border-radius: var(--border-radius-md); border: 1px solid var(--color-border); text-align: center;">
                    <div class="loader" style="margin: 0 auto 1.25rem;"></div>
                    <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--color-text); margin-bottom: 0.35rem;">Consultando Integrim CISS Poder em tempo real...</h4>
                    <p style="font-size: 0.84rem; color: var(--color-text-offset); max-width: 500px; margin: 0 auto;">
                        Disparando chamadas para <code>CAD_PRODUTOS</code>, <code>PRODUTOS_SALDO_ESTOQUE_EMPRESA</code> e <code>PRECOS_CUSTOS_PRODUTOS_EMPRESA</code>...
                    </p>
                </div>
            `;
        }

        try {
            const res = await api('/api/bi/stock/test-single-product', 'POST', {
                idsubproduto: sku || null,
                codigo_barras: ean || null
            });

            const cad = res.endpoints?.cad_produtos || {};
            const saldo = res.endpoints?.produtos_saldo_estoque_empresa || {};
            const custos = res.endpoints?.precos_custos_produtos_empresa || {};
            const prod = res.produto_consolidado || cad.dados_formatados;
            const allSuccess = cad.sucesso && saldo.sucesso && custos.sucesso;

            let html = `
                <!-- Banner de Status Geral -->
                <div style="background: ${allSuccess ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)'}; border: 1px solid ${allSuccess ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}; border-radius: var(--border-radius-md); padding: 1rem 1.25rem; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: ${allSuccess ? '#10b981' : '#ef4444'}; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                            <i class="fas ${allSuccess ? 'fa-check' : 'fa-triangle-exclamation'}"></i>
                        </div>
                        <div>
                            <h4 style="margin: 0; font-size: 0.98rem; font-weight: 700; color: var(--color-text);">
                                ${allSuccess ? '3 Endpoints Respondendo Perfeitamente no Integrim!' : 'Atenção: Houve falha ou pendência em endpoint(s)'}
                            </h4>
                            <p style="margin: 0; font-size: 0.8rem; color: var(--color-text-offset);">
                                Tempo total de resposta: <strong>${res.duracao_total_ms || 0}ms</strong> | SKU Testado: <strong>${res.idsubproduto_buscado || 'N/D'}</strong>
                            </p>
                        </div>
                    </div>
                    <div>
                        <span class="badge ${allSuccess ? 'badge-success' : 'badge-danger'}" style="font-size: 0.82rem; padding: 0.4rem 0.8rem;">
                            ${allSuccess ? 'STATUS 100% OK' : 'REQUER AJUSTE'}
                        </span>
                    </div>
                </div>

                <!-- Cards dos 3 Endpoints -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.85rem; margin-bottom: 1.25rem;">
                    <!-- Endpoint 1 -->
                    <div class="integrim-diag-chip" style="border-left: 4px solid ${cad.sucesso ? '#10b981' : '#ef4444'};">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span class="integrim-diag-chip-label">1. CAD_PRODUTOS</span>
                            <span class="integrim-ep-badge ${cad.sucesso ? 'success' : 'error'}">
                                <i class="fas ${cad.sucesso ? 'fa-circle-check' : 'fa-circle-xmark'}"></i> ${cad.status || 500}
                            </span>
                        </div>
                        <div class="integrim-diag-chip-val" style="font-size: 0.82rem; margin-top: 0.25rem;">
                            ${cad.sucesso ? `✅ ${cad.total_retornado} item(ns) em ${cad.tempo_ms}ms` : `❌ ${cad.erro || 'Erro na consulta'}`}
                        </div>
                    </div>

                    <!-- Endpoint 2 -->
                    <div class="integrim-diag-chip" style="border-left: 4px solid ${saldo.sucesso ? '#10b981' : '#ef4444'};">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span class="integrim-diag-chip-label">2. SALDOS_EMPRESA</span>
                            <span class="integrim-ep-badge ${saldo.sucesso ? 'success' : 'error'}">
                                <i class="fas ${saldo.sucesso ? 'fa-circle-check' : 'fa-circle-xmark'}"></i> ${saldo.status || 500}
                            </span>
                        </div>
                        <div class="integrim-diag-chip-val" style="font-size: 0.82rem; margin-top: 0.25rem;">
                            ${saldo.sucesso ? `✅ ${saldo.total_retornado} filial(is) em ${saldo.tempo_ms}ms` : `❌ ${saldo.erro || 'Erro na consulta'}`}
                        </div>
                    </div>

                    <!-- Endpoint 3 -->
                    <div class="integrim-diag-chip" style="border-left: 4px solid ${custos.sucesso ? '#10b981' : '#ef4444'};">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span class="integrim-diag-chip-label">3. PRECOS_CUSTOS</span>
                            <span class="integrim-ep-badge ${custos.sucesso ? 'success' : 'error'}">
                                <i class="fas ${custos.sucesso ? 'fa-circle-check' : 'fa-circle-xmark'}"></i> ${custos.status || 500}
                            </span>
                        </div>
                        <div class="integrim-diag-chip-val" style="font-size: 0.82rem; margin-top: 0.25rem;">
                            ${custos.sucesso ? `✅ ${custos.total_retornado} filial(is) em ${custos.tempo_ms}ms` : `❌ ${custos.erro || 'Erro na consulta'}`}
                        </div>
                    </div>
                </div>
            `;

            if (prod) {
                html += `
                    <!-- Detalhes do Produto & Estrutura Mercadológica -->
                    <div class="integrim-diag-section">
                        <div class="integrim-diag-header">
                            <div class="integrim-diag-title">
                                <i class="fas fa-box-open" style="color: #0284c7;"></i> Dados Cadastrais & Estrutura Mercadológica
                            </div>
                            <span class="badge ${prod.inativo ? 'badge-danger' : 'badge-success'}">${prod.inativo ? 'Inativo' : 'Ativo'}</span>
                        </div>

                        <div class="integrim-diag-grid-badges">
                            <div class="integrim-diag-chip">
                                <span class="integrim-diag-chip-label">SKU / ID Subproduto</span>
                                <span class="integrim-diag-chip-val"><code>${prod.idsubproduto}</code> (ID: ${prod.idproduto || prod.idsubproduto})</span>
                            </div>
                            <div class="integrim-diag-chip" style="grid-column: span 2;">
                                <span class="integrim-diag-chip-label">Descrição Completa</span>
                                <span class="integrim-diag-chip-val">${prod.descricao}</span>
                            </div>
                            <div class="integrim-diag-chip">
                                <span class="integrim-diag-chip-label">Marca / Fabricante</span>
                                <span class="integrim-diag-chip-val">${prod.marca || '-'} (ID: ${prod.id_marca || '-'})</span>
                            </div>
                            <div class="integrim-diag-chip">
                                <span class="integrim-diag-chip-label">Código de Barras (EAN)</span>
                                <span class="integrim-diag-chip-val">${prod.codigo_barras || '-'}</span>
                            </div>
                            <div class="integrim-diag-chip">
                                <span class="integrim-diag-chip-label">NCM</span>
                                <span class="integrim-diag-chip-val">${prod.ncm || '-'}</span>
                            </div>
                            <div class="integrim-diag-chip">
                                <span class="integrim-diag-chip-label">Unidade Medida</span>
                                <span class="integrim-diag-chip-val">${prod.unidade_medida || 'UN'}</span>
                            </div>
                        </div>

                        <!-- Breadcrumb da Árvore Mercadológica -->
                        <div class="integrim-tree-breadcrumb">
                            <span><i class="fas fa-sitemap" style="color: #0284c7;"></i> <strong>Árvore:</strong></span>
                            <span>Divisão: <strong>${prod.divisao || '-'}</strong></span>
                            <span class="integrim-tree-sep"><i class="fas fa-chevron-right"></i></span>
                            <span>Seção: <strong>${prod.secao || '-'}</strong></span>
                            <span class="integrim-tree-sep"><i class="fas fa-chevron-right"></i></span>
                            <span>Grupo: <strong>${prod.grupo || '-'}</strong></span>
                            <span class="integrim-tree-sep"><i class="fas fa-chevron-right"></i></span>
                            <span>Subgrupo: <strong>${prod.subgrupo || '-'}</strong></span>
                        </div>
                    </div>

                    <!-- Tabela Comparativa das 2 Lojas (Saldos e 5 Custos) -->
                    <div class="integrim-diag-section">
                        <div class="integrim-diag-header">
                            <div class="integrim-diag-title">
                                <i class="fas fa-building-columns" style="color: #0284c7;"></i> Posição de Estoque & Custos por Filial (Loja 1 e Loja 2)
                            </div>
                        </div>

                        <div class="table-responsive">
                            <table class="data-table" style="font-size: 0.82rem;">
                                <thead>
                                    <tr>
                                        <th>Filial / Empresa</th>
                                        <th style="text-align: right;">Saldo Físico</th>
                                        <th style="text-align: right;">Reserva</th>
                                        <th style="text-align: right;">Disponível</th>
                                        <th style="text-align: right;">Custo Médio</th>
                                        <th style="text-align: right;">Custo Fiscal</th>
                                        <th style="text-align: right;">Custo Gerencial</th>
                                        <th style="text-align: right;">Custo Reposição</th>
                                        <th style="text-align: right;">Última NF</th>
                                        <th style="text-align: right; color: #0284c7;">Preço Venda</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${(prod.lojas || []).map(l => `
                                        <tr>
                                            <td style="font-weight: 700;">${l.nome_empresa}</td>
                                            <td style="text-align: right; font-weight: 700; color: ${l.saldo_atual <= 0 ? 'var(--color-danger)' : 'inherit'};">${formatInt(l.saldo_atual)} ${prod.unidade_medida || 'UN'}</td>
                                            <td style="text-align: right; color: var(--color-text-offset);">${formatInt(l.saldo_reserva)}</td>
                                            <td style="text-align: right; font-weight: 700;">${formatInt(l.saldo_disponivel)}</td>
                                            <td style="text-align: right;">${formatBRL(l.custo_medio)}</td>
                                            <td style="text-align: right;">${formatBRL(l.custo_medio_fiscal)}</td>
                                            <td style="text-align: right;">${formatBRL(l.custo_gerencial)}</td>
                                            <td style="text-align: right;">${formatBRL(l.custo_reposicao)}</td>
                                            <td style="text-align: right;">${formatBRL(l.custo_nota_fiscal)}</td>
                                            <td style="text-align: right; font-weight: 800; color: #0284c7;">${formatBRL(l.preco_venda_varejo)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }

            // Inspecionar JSON Bruto
            html += `
                <div class="integrim-diag-section">
                    <details>
                        <summary style="cursor: pointer; font-weight: 700; font-size: 0.88rem; color: var(--color-text); user-select: none;">
                            <i class="fas fa-code" style="color: #f59e0b;"></i> Inspecionar Respostas JSON Originais da API CISS Poder (Raw Data)
                        </summary>
                        <div style="margin-top: 0.85rem; display: flex; flex-direction: column; gap: 0.75rem;">
                            <div>
                                <strong style="font-size: 0.78rem; color: var(--color-text-offset);">1. CAD_PRODUTOS:</strong>
                                <pre class="json-code-box"><code>${JSON.stringify(cad.raw_data || cad.erro || {}, null, 2)}</code></pre>
                            </div>
                            <div>
                                <strong style="font-size: 0.78rem; color: var(--color-text-offset);">2. PRODUTOS_SALDO_ESTOQUE_EMPRESA:</strong>
                                <pre class="json-code-box"><code>${JSON.stringify(saldo.raw_data || saldo.erro || {}, null, 2)}</code></pre>
                            </div>
                            <div>
                                <strong style="font-size: 0.78rem; color: var(--color-text-offset);">3. PRECOS_CUSTOS_PRODUTOS_EMPRESA:</strong>
                                <pre class="json-code-box"><code>${JSON.stringify(custos.raw_data || custos.erro || {}, null, 2)}</code></pre>
                            </div>
                        </div>
                    </details>
                </div>
            `;

            integrimTestResults.innerHTML = html;
            showToast('Diagnóstico do Integrim executado com sucesso!', allSuccess ? 'success' : 'warning');

        } catch (err) {
            integrimTestResults.innerHTML = `
                <div class="empty-state" style="padding: 2rem 1rem; border: 1px solid rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.05);">
                    <div class="empty-state-icon" style="color: var(--color-danger); background: rgba(239, 68, 68, 0.15);">
                        <i class="fas fa-triangle-exclamation"></i>
                    </div>
                    <h3 style="color: var(--color-danger);">Falha na comunicação com o Integrim CISS</h3>
                    <p style="max-width: 600px; margin: 0 auto 1rem;">${err.message}</p>
                    <div style="font-size: 0.82rem; color: var(--color-text-offset); background: var(--color-surface); padding: 0.75rem; border-radius: var(--border-radius-sm); border: 1px solid var(--color-border); display: inline-block; text-align: left;">
                        💡 <strong>Dica de resolução:</strong> Verifique se a URL da API, Usuário e Senha do CISS Poder estão preenchidos corretamente no menu <strong>Integrações > ERPs (CISS Poder)</strong>.
                    </div>
                </div>
            `;
            showToast(`Erro no teste: ${err.message}`, 'error');
        } finally {
            if (integrimTestRunBtn) {
                integrimTestRunBtn.disabled = false;
                integrimTestRunBtn.innerHTML = '<i class="fas fa-play"></i> Testar 3 Endpoints';
            }
        }
    };

    /**
     * Modal de Criação e Edição de Agentes IA
     */
    const aiAgentModal = document.getElementById('ai-agent-modal');
    const openAIAgentModal = (agent = null) => {
        if (!aiAgentModal) return;
        const form = document.getElementById('ai-agent-form');
        if (form) form.reset();

        const titleEl = document.getElementById('ai-agent-modal-title');
        const subtitleEl = document.getElementById('ai-agent-modal-subtitle');
        const iconBadge = document.getElementById('ai-agent-modal-icon-badge');
        const headerIcon = document.getElementById('ai-agent-modal-header-icon');
        const previewIcon = document.getElementById('ai-agent-icon-preview');

        const idInput = document.getElementById('ai-agent-form-id');
        const nameInput = document.getElementById('ai-agent-form-name');
        const roleInput = document.getElementById('ai-agent-form-role');
        const slugInput = document.getElementById('ai-agent-form-slug');
        const modelSelect = document.getElementById('ai-agent-form-model');
        const iconInput = document.getElementById('ai-agent-form-icon');
        const colorInput = document.getElementById('ai-agent-form-color');
        const descInput = document.getElementById('ai-agent-form-desc');
        const promptInput = document.getElementById('ai-agent-form-prompt');
        const confirmCheck = document.getElementById('ai-agent-form-confirm');
        const activeCheck = document.getElementById('ai-agent-form-active');

        if (agent) {
            if (titleEl) titleEl.textContent = `Editar Agente: ${agent.name}`;
            if (subtitleEl) subtitleEl.textContent = 'Ajuste o modelo de IA, especialidade ou refine as regras e o Prompt de Sistema';
            if (idInput) idInput.value = agent.id;
            if (nameInput) nameInput.value = agent.name || '';
            if (roleInput) roleInput.value = agent.role_title || '';
            if (slugInput) {
                slugInput.value = agent.slug || '';
                slugInput.readOnly = true;
                slugInput.style.opacity = '0.7';
            }
            if (modelSelect) modelSelect.value = agent.model || 'gemini-3.6-flash';
            if (iconInput) iconInput.value = agent.avatar_icon || 'fa-robot';
            if (colorInput) colorInput.value = agent.avatar_color || '#3b82f6';
            if (descInput) descInput.value = agent.description || '';
            if (promptInput) promptInput.value = agent.system_prompt || '';
            if (confirmCheck) confirmCheck.checked = !!agent.require_confirmation;
            if (activeCheck) activeCheck.checked = agent.is_active !== undefined ? !!agent.is_active : true;

            if (headerIcon) headerIcon.className = `fas ${agent.avatar_icon || 'fa-robot'}`;
            if (iconBadge) {
                iconBadge.style.color = agent.avatar_color || '#3b82f6';
                iconBadge.style.background = `${agent.avatar_color || '#3b82f6'}22`;
            }
            if (previewIcon) {
                previewIcon.innerHTML = `<i class="fas ${agent.avatar_icon || 'fa-robot'}"></i>`;
                previewIcon.style.color = agent.avatar_color || '#3b82f6';
            }
        } else {
            if (titleEl) titleEl.textContent = 'Criar Novo Agente Inteligente';
            if (subtitleEl) subtitleEl.textContent = 'Configure um novo especialista autônomo com diretrizes personalizadas de negócio';
            if (idInput) idInput.value = '';
            if (nameInput) nameInput.value = '';
            if (roleInput) roleInput.value = '';
            if (slugInput) {
                slugInput.value = '';
                slugInput.readOnly = false;
                slugInput.style.opacity = '1';
            }
            if (modelSelect) modelSelect.value = 'gemini-3.6-flash';
            if (iconInput) iconInput.value = 'fa-robot';
            if (colorInput) colorInput.value = '#3b82f6';
            if (descInput) descInput.value = '';
            if (promptInput) {
                promptInput.value = `Você é um agente especialista do Integrador ERP.\nSua missão é atuar com precisão e ajudar o vendedor a tomar as melhores decisões.\n\nRegras de atuação:\n1. Analise dados reais antes de sugerir alterações.\n2. Seja claro, direto e use tabelas estruturadas quando apropriado.\n3. Sempre que necessário, consulte outros agentes especialistas do sistema.`;
            }
            if (confirmCheck) confirmCheck.checked = true;
            if (activeCheck) activeCheck.checked = true;

            if (headerIcon) headerIcon.className = 'fas fa-robot';
            if (iconBadge) {
                iconBadge.style.color = '#3b82f6';
                iconBadge.style.background = 'rgba(59, 130, 246, 0.15)';
            }
            if (previewIcon) {
                previewIcon.innerHTML = '<i class="fas fa-robot"></i>';
                previewIcon.style.color = '#3b82f6';
            }
        }

        aiAgentModal.style.display = 'flex';
    };

    const closeAIAgentModal = () => {
        if (aiAgentModal) aiAgentModal.style.display = 'none';
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

    if (integrimTestModalCloseBtns) {
        integrimTestModalCloseBtns.forEach(btn => {
            btn.addEventListener('click', closeIntegrimTestModal);
        });
    }

    if (integrimTestForm) {
        integrimTestForm.addEventListener('submit', (e) => {
            e.preventDefault();
            runIntegrimProductDiagnostic();
        });
    }

    if (meliCreateModalCloseBtns) {
        meliCreateModalCloseBtns.forEach(btn => btn.addEventListener('click', closeMeliCreateModal));
    }
    if (meliEditModalCloseBtns) {
        meliEditModalCloseBtns.forEach(btn => btn.addEventListener('click', closeMeliEditModal));
    }
    document.querySelectorAll('.ai-agent-modal-close').forEach(btn => {
        btn.addEventListener('click', closeAIAgentModal);
    });

    // Fechar modais ao clicar no backdrop ou pressionar ESC
    window.addEventListener('click', (e) => {
        if (e.target === modal || (e.target.classList && e.target.classList.contains('modal-backdrop') && e.target.closest('#form-modal'))) {
            closeModal();
        }
        if (e.target === supplierTestModal || (e.target.classList && e.target.classList.contains('modal-backdrop') && e.target.closest('#supplier-test-modal'))) {
            closeSupplierTestModal();
        }
        if (e.target === integrimTestModal || (e.target.classList && e.target.classList.contains('modal-backdrop') && e.target.closest('#integrim-test-modal'))) {
            closeIntegrimTestModal();
        }
        if (e.target === meliCreateModal || (e.target.classList && e.target.classList.contains('modal-backdrop') && e.target.closest('#meli-create-modal'))) {
            closeMeliCreateModal();
        }
        if (e.target === meliEditModal || (e.target.classList && e.target.classList.contains('modal-backdrop') && e.target.closest('#meli-edit-modal'))) {
            closeMeliEditModal();
        }
        if (e.target === aiAgentModal || (e.target.classList && e.target.classList.contains('modal-backdrop') && e.target.closest('#ai-agent-modal'))) {
            closeAIAgentModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (modal && modal.style.display === 'flex') closeModal();
            if (supplierTestModal && supplierTestModal.style.display === 'flex') closeSupplierTestModal();
            if (integrimTestModal && integrimTestModal.style.display === 'flex') closeIntegrimTestModal();
            if (meliCreateModal && meliCreateModal.style.display === 'flex') closeMeliCreateModal();
            if (meliEditModal && meliEditModal.style.display === 'flex') closeMeliEditModal();
            if (aiAgentModal && aiAgentModal.style.display === 'flex') closeAIAgentModal();
        }
    });

    // Submissão do Formulário de Agente IA
    const aiAgentForm = document.getElementById('ai-agent-form');
    if (aiAgentForm) {
        aiAgentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('ai-agent-form-id')?.value;
            const name = document.getElementById('ai-agent-form-name')?.value?.trim();
            const role_title = document.getElementById('ai-agent-form-role')?.value?.trim();
            const slug = document.getElementById('ai-agent-form-slug')?.value?.trim();
            const model = document.getElementById('ai-agent-form-model')?.value;
            const avatar_icon = document.getElementById('ai-agent-form-icon')?.value?.trim() || 'fa-robot';
            const avatar_color = document.getElementById('ai-agent-form-color')?.value || '#3b82f6';
            const description = document.getElementById('ai-agent-form-desc')?.value?.trim() || '';
            const system_prompt = document.getElementById('ai-agent-form-prompt')?.value?.trim();
            const require_confirmation = document.getElementById('ai-agent-form-confirm')?.checked;
            const is_active = document.getElementById('ai-agent-form-active')?.checked;

            if (!name || !system_prompt) {
                showToast('Preencha o Nome e o Prompt de Sistema do Agente.', 'warning');
                return;
            }

            const saveBtn = document.getElementById('ai-agent-save-btn');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
            }

            try {
                const payload = {
                    id: id ? parseInt(id, 10) : undefined,
                    name,
                    role_title,
                    slug: slug || undefined,
                    model,
                    avatar_icon,
                    avatar_color,
                    description,
                    system_prompt,
                    require_confirmation,
                    is_active
                };

                const res = await api('/api/ai/agents', 'POST', payload);
                showToast(res.mensagem || 'Agente salvo com sucesso!', 'success');
                closeAIAgentModal();
                renderAIAgentsHubView();
            } catch (err) {
                showToast(`Erro ao salvar agente: ${err.message}`, 'error');
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = '<i class="fas fa-check"></i> Salvar Agente';
                }
            }
        });
    }

    // Chips de ícones rápidos e cor no modal de agente
    document.querySelectorAll('.ai-icon-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const iconName = chip.dataset.icon;
            const iconInput = document.getElementById('ai-agent-form-icon');
            const previewIcon = document.getElementById('ai-agent-icon-preview');
            if (iconInput) iconInput.value = iconName;
            if (previewIcon) previewIcon.innerHTML = `<i class="fas ${iconName}"></i>`;
        });
    });

    document.getElementById('ai-agent-form-icon')?.addEventListener('input', (e) => {
        const previewIcon = document.getElementById('ai-agent-icon-preview');
        if (previewIcon) previewIcon.innerHTML = `<i class="fas ${e.target.value}"></i>`;
    });

    document.getElementById('ai-agent-form-color')?.addEventListener('input', (e) => {
        const previewIcon = document.getElementById('ai-agent-icon-preview');
        if (previewIcon) previewIcon.style.color = e.target.value;
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
                                <div style="display: flex; flex-direction: column; gap: 0.15rem;">
                                    <span class="price-text" style="font-size: 0.92rem; font-weight: 700;">R$ ${parseFloat(item.price).toFixed(2)}</span>
                                    ${isActive && item.catalog_price_to_win && item.catalog_price_to_win != item.price && (String(item.catalog_status).toLowerCase() === 'losing' || String(item.catalog_status).toLowerCase() === 'opportunity') ? `<small style="color: #f59e0b; font-weight: 600; font-size: 0.72rem;" title="Preço sugerido para ganhar a Buy Box"><i class="fas fa-bolt"></i> Ganhe: R$ ${parseFloat(item.catalog_price_to_win).toFixed(2)}</small>` : ''}
                                    ${item.net_amount !== null && item.net_amount !== undefined ? `<span class="net-amount-pill" title="Valor líquido estimado a receber por venda (descontando comissão ML e frete)"><i class="fas fa-coins"></i> Líquido: R$ ${parseFloat(item.net_amount).toFixed(2)}</span>` : ''}
                                    ${(() => {
                                        const costPrice = parseFloat(item.cost_price || item.source_data?.price || 0);
                                        const itemPrice = parseFloat(item.price) || 0;
                                        const netAmt = item.net_amount !== null && item.net_amount !== undefined ? parseFloat(item.net_amount) : null;
                                        if (netAmt !== null && costPrice > 0 && itemPrice > 0) {
                                            const netMargin = ((netAmt - costPrice) / itemPrice) * 100;
                                            const mClass = netMargin >= 25 ? 'margin-badge-high' : (netMargin >= 15 ? 'margin-badge-medium' : 'margin-badge-low');
                                            return `<span class="margin-badge ${mClass}" title="Margem Líquida estimada (${netMargin.toFixed(1)}%): R$ ${(netAmt - costPrice).toFixed(2)}"><i class="fas fa-chart-pie"></i> ${netMargin.toFixed(1)}% margem</span>`;
                                        } else if (item.markup_percent > 0) {
                                            return `<span class="margin-badge margin-badge-medium" title="Markup cadastrado"><i class="fas fa-arrow-trend-up"></i> +${item.markup_percent}% markup</span>`;
                                        }
                                        return '';
                                    })()}
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
                                ${isConnected ? `
                                <button class="btn btn-small btn-secondary" data-action="refresh-meli-token" data-id="${conn.id}" title="Forçar renovação imediata do token com o refresh_token">
                                    <i class="fas fa-arrows-rotate"></i> Renovar Token
                                </button>
                                ` : ''}
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
        headerActions.innerHTML = `
            <button class="btn btn-warning" data-action="open-integrim-test-modal" title="Testar importação de 1 produto nos 3 endpoints do Integrim (CISS Poder)" style="background: #f59e0b; color: #fff; border: none; font-weight: 600;">
                <i class="fas fa-flask"></i> Testar 1 Produto (Integrim)
            </button>
        `;

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

        // 4.1. Renovação Manual do Token do Mercado Livre
        if (action === 'refresh-meli-token') {
            actionButton.classList.add('loading');
            actionButton.disabled = true;
            try {
                const res = await api(`/api/marketplace-connections/${id}/refresh-token`, 'POST');
                showToast(res.mensagem || 'Token do Mercado Livre renovado com sucesso!', 'success');
                await renderMarketplaceConnections();
            } catch (refreshErr) {
                showToast(`Falha ao renovar token: ${refreshErr.message}`, 'error');
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

        // 5.1. Testar Diagnóstico de 1 Produto no Integrim CISS Poder
        if (action === 'open-integrim-test-modal') {
            e.preventDefault();
            e.stopPropagation();
            openIntegrimSingleProductTestModal(sku || '');
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
     * Helper para formatar Markdown avançado em HTML seguro (incluindo tabelas, listas e blocos de código)
     */
    function formatMarkdownText(text) {
        if (!text) return '';

        // 1. Extrai blocos de código com ``` para proteger seu conteúdo
        const codeBlocks = [];
        let processed = String(text).replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
            const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
            const escapedCode = code
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            codeBlocks.push(`<pre class="ai-code-block" style="background: rgba(0,0,0,0.06); padding: 0.75rem; border-radius: 6px; overflow-x: auto; margin: 0.5rem 0;"><code class="language-${lang || 'text'}">${escapedCode}</code></pre>`);
            return placeholder;
        });

        // 2. Escapa caracteres HTML no texto restante
        processed = processed
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // 3. Processa tabelas em Markdown (| Col 1 | Col 2 | \n | --- | --- | \n | Val 1 | Val 2 |)
        processed = processed.replace(/((?:\|[^\n]+\|\r?\n?)+)/g, (match) => {
            const lines = match.trim().split(/\r?\n/).map(l => l.trim()).filter(l => l.startsWith('|') && l.endsWith('|'));
            if (lines.length < 2) return match;

            const isHeaderSep = /^\|(?:\s*:?-+:?\s*\|)+$/.test(lines[1]);
            let tableHtml = '<div class="table-responsive" style="overflow-x: auto; margin: 0.75rem 0;"><table class="ai-table" style="width:100%; border-collapse: collapse; font-size: 0.82rem;">';
            let startRow = 0;

            if (isHeaderSep) {
                const headerCells = lines[0].slice(1, -1).split('|').map(c => c.trim());
                tableHtml += '<thead style="background: rgba(0,0,0,0.06);"><tr>';
                headerCells.forEach(c => {
                    tableHtml += `<th style="padding: 6px 10px; border: 1px solid var(--color-border); text-align: left; font-weight: 600;">${c}</th>`;
                });
                tableHtml += '</tr></thead>';
                startRow = 2;
            }

            tableHtml += '<tbody>';
            for (let i = startRow; i < lines.length; i++) {
                if (/^\|(?:\s*:?-+:?\s*\|)+$/.test(lines[i])) continue;
                const cells = lines[i].slice(1, -1).split('|').map(c => c.trim());
                tableHtml += '<tr>';
                cells.forEach(c => {
                    tableHtml += `<td style="padding: 6px 10px; border: 1px solid var(--color-border);">${c}</td>`;
                });
                tableHtml += '</tr>';
            }
            tableHtml += '</tbody></table></div>';
            return tableHtml;
        });

        // 4. Headers
        processed = processed.replace(/^### (.*$)/gim, '<h3 style="margin: 0.75rem 0 0.35rem; font-size: 0.95rem; font-weight: 700;">$1</h3>');
        processed = processed.replace(/^## (.*$)/gim, '<h2 style="margin: 0.9rem 0 0.4rem; font-size: 1.05rem; font-weight: 700;">$1</h2>');
        processed = processed.replace(/^# (.*$)/gim, '<h1 style="margin: 1rem 0 0.5rem; font-size: 1.15rem; font-weight: 700;">$1</h1>');

        // 5. Blockquotes (> texto)
        processed = processed.replace(/^>\s+(.*$)/gim, '<blockquote style="border-left: 3px solid var(--color-primary); padding-left: 0.75rem; margin: 0.5rem 0; color: var(--color-text-offset); font-style: italic;">$1</blockquote>');

        // 6. Bold & Italic
        processed = processed.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>');
        processed = processed.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
        processed = processed.replace(/\*(.*?)\*/gim, '<em>$1</em>');
        processed = processed.replace(/~~(.*?)~~/gim, '<del>$1</del>');

        // 7. Inline code (`code`)
        processed = processed.replace(/`([^`]+)`/gim, '<code>$1</code>');

        // 8. Listas não ordenadas (* item ou - item)
        processed = processed.replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>');
        processed = processed.replace(/(<li>.*<\/li>)/gim, '<ul style="margin: 0.4rem 0 0.6rem 1.25rem; padding-left: 0;">$1</ul>');
        processed = processed.replace(/<\/ul>\s*<ul[^>]*>/gim, '');

        // 9. Quebras de linha e parágrafos
        processed = processed.replace(/\n\n/gim, '</p><p style="margin-bottom: 0.5rem;">');
        processed = processed.replace(/\n/gim, '<br>');

        // 10. Restaura blocos de código
        codeBlocks.forEach((block, idx) => {
            processed = processed.replace(`__CODE_BLOCK_${idx}__`, block);
        });

        return `<div class="ai-rendered-markdown"><p style="margin-bottom: 0.5rem;">${processed}</p></div>`;
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
                                    <p>${activeAgent.description || 'Especialista pronto para realizar análises e automações.'}</p>
                                    <p style="margin-top: 0.5rem; font-size: 0.82rem; color: var(--color-text-offset);">
                                        <i class="fas fa-brain"></i> <strong>Autonomia de IA:</strong> Analiso e executo ferramentas automaticamente e posso consultar outros especialistas do sistema.
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
                                                ${m.tool_calls.map(tc => {
                                                    const toolName = tc.name || tc.functionCall?.name || 'ferramenta';
                                                    const toolArgs = tc.args || tc.functionCall?.args || {};
                                                    return toolName === 'consultar_outro_agente' ? `
                                                    <div class="ai-tool-call-card" style="background: rgba(99, 102, 241, 0.12); border-color: rgba(99, 102, 241, 0.35);">
                                                        <div class="ai-tool-call-info">
                                                            <i class="fas fa-handshake" style="color: #6366f1;"></i>
                                                            <span><strong>Colaboração Inter-Agentes:</strong> Consultou <code>${toolArgs.agent_slug || 'especialista'}</code></span>
                                                        </div>
                                                        <span class="ai-tool-call-badge" style="background: rgba(99, 102, 241, 0.25); color: #818cf8;">Parecer Recebido</span>
                                                    </div>
                                                ` : `
                                                    <div class="ai-tool-call-card">
                                                        <div class="ai-tool-call-info">
                                                            <i class="fas fa-check-circle" style="color: var(--color-success);"></i>
                                                            <span><strong>Ferramenta Autônoma:</strong> <code>${toolName}</code></span>
                                                        </div>
                                                        <span class="ai-tool-call-badge success">Executado</span>
                                                    </div>
                                                `;
                                                }).join('')}
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
                                        ${res.executed_actions.map(ea => {
                                            const toolName = ea.tool_name || ea.name || 'ferramenta';
                                            const toolArgs = ea.args || {};
                                            return toolName === 'consultar_outro_agente' ? `
                                            <div class="ai-tool-call-card" style="background: rgba(99, 102, 241, 0.12); border-color: rgba(99, 102, 241, 0.35);">
                                                <div class="ai-tool-call-info">
                                                    <i class="fas fa-handshake" style="color: #6366f1;"></i>
                                                    <span><strong>Colaboração Inter-Agentes:</strong> Consultou <code>${toolArgs.agent_slug || 'especialista'}</code></span>
                                                </div>
                                                <span class="ai-tool-call-badge" style="background: rgba(99, 102, 241, 0.25); color: #818cf8;">Parecer Recebido</span>
                                            </div>
                                        ` : `
                                            <div class="ai-tool-call-card">
                                                <div class="ai-tool-call-info">
                                                    <i class="fas fa-check-circle" style="color: var(--color-success);"></i>
                                                    <span><strong>Ferramenta Autônoma:</strong> <code>${toolName}</code></span>
                                                </div>
                                                <span class="ai-tool-call-badge success">Concluído</span>
                                            </div>
                                        `;
                                        }).join('')}
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
        mainSubtitle.textContent = 'Crie e configure agentes especialistas autônomos com modelos dedicados do Gemini';
        headerActions.innerHTML = `
            <button type="button" class="btn btn-primary" id="btn-create-agent-header">
                <i class="fas fa-plus"></i> Novo Agente
            </button>
        `;
        showLoading('Carregando agentes...');

        try {
            const res = await api('/api/ai/agents');
            const agents = res.agents || [];

            pageContent.innerHTML = `
                <div class="ai-page-header">
                    <div>
                        <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--color-text);">Especialistas Cadastrados (${agents.length})</h2>
                        <p style="font-size: 0.85rem; color: var(--color-text-offset);">Os agentes usam IA para identificar as ferramentas necessárias e podem colaborar entre si</p>
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
                                        <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
                                            <h3 style="margin: 0;">${a.name}</h3>
                                            ${!a.is_active ? '<span class="badge badge-secondary" style="font-size: 0.65rem;">Inativo</span>' : ''}
                                        </div>
                                        <div class="role">${a.role_title}</div>
                                        <div class="desc">${a.description || 'Sem descrição cadastrada.'}</div>
                                    </div>
                                </div>

                                <div style="margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
                                    <span class="badge badge-info" style="font-size: 0.72rem; font-family: monospace; display: inline-flex; align-items: center; gap: 0.35rem;">
                                        <i class="fas fa-microchip"></i> ${a.model || 'gemini-3.6-flash'}
                                    </span>
                                    <span class="badge ${a.require_confirmation ? 'badge-warning' : 'badge-success'}" style="font-size: 0.72rem; display: inline-flex; align-items: center; gap: 0.35rem;">
                                        <i class="fas ${a.require_confirmation ? 'fa-user-check' : 'fa-bolt'}"></i> ${a.require_confirmation ? 'Confirmação Manual' : 'Autônomo'}
                                    </span>
                                    <span class="badge badge-secondary" style="font-size: 0.72rem; display: inline-flex; align-items: center; gap: 0.35rem;">
                                        <i class="fas fa-code-branch"></i> ${a.slug}
                                    </span>
                                </div>
                            </div>

                            <div style="margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                                <div style="display: flex; gap: 0.35rem;">
                                    <button type="button" class="btn btn-secondary btn-sm btn-edit-agent" data-agent-id="${a.id}" title="Editar Prompt, Modelo ou Configurações">
                                        <i class="fas fa-edit"></i> Editar
                                    </button>
                                    <button type="button" class="btn btn-danger btn-sm btn-delete-agent" data-agent-id="${a.id}" data-agent-name="${a.name}" title="Excluir este agente">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                                <button type="button" class="btn btn-primary btn-sm btn-open-agent-chat" data-agent-id="${a.id}">
                                    <i class="fas fa-comments"></i> Conversar
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

            document.getElementById('btn-create-agent-header')?.addEventListener('click', () => {
                openAIAgentModal(null);
            });

            document.querySelectorAll('.btn-open-agent-chat').forEach(btn => {
                btn.addEventListener('click', () => {
                    const agentId = btn.dataset.agentId;
                    setActiveNavLink('nav-ai-chat');
                    renderAIChatView(parseInt(agentId, 10), null);
                });
            });

            document.querySelectorAll('.btn-edit-agent').forEach(btn => {
                btn.addEventListener('click', () => {
                    const agentId = parseInt(btn.dataset.agentId, 10);
                    const target = agents.find(ag => ag.id === agentId);
                    if (target) openAIAgentModal(target);
                });
            });

            document.querySelectorAll('.btn-delete-agent').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const agentId = btn.dataset.agentId;
                    const agentName = btn.dataset.agentName;
                    if (confirm(`Tem certeza que deseja excluir o agente "${agentName}"?\nTodas as conversas associadas a ele serão removidas.`)) {
                        try {
                            const delRes = await api(`/api/ai/agents/${agentId}`, 'DELETE');
                            showToast(delRes.mensagem || 'Agente excluído com sucesso!', 'success');
                            renderAIAgentsHubView();
                        } catch (delErr) {
                            showToast(`Erro ao excluir agente: ${delErr.message}`, 'error');
                        }
                    }
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
                                        <option value="gemini-3.6-flash" ${(!settings.default_model || settings.default_model === 'gemini-3.6-flash') ? 'selected' : ''}>gemini-3.6-flash (Recomendado - Mais Rápido & Inteligente)</option>
                                        <option value="gemini-3.5-flash-lite" ${settings.default_model === 'gemini-3.5-flash-lite' ? 'selected' : ''}>gemini-3.5-flash-lite (Ultra Leve & Econômico)</option>
                                        <option value="gemini-3.5-flash" ${settings.default_model === 'gemini-3.5-flash' ? 'selected' : ''}>gemini-3.5-flash (Alta Performance Flash)</option>
                                        <option value="gemini-3.7-flash" ${settings.default_model === 'gemini-3.7-flash' ? 'selected' : ''}>gemini-3.7-flash (Nova Geração 3.7)</option>
                                        <option value="gemini-flash-latest" ${settings.default_model === 'gemini-flash-latest' ? 'selected' : ''}>gemini-flash-latest (Versão Mais Recente)</option>
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
     * MÓDULO POWER BI & GESTÃO EXECUTIVA "A ELÉTRICA"
     * =================================================================
     */

    let biState = {
        empresa_id: '',
        data_inicio: '2025-01-01',
        data_fim: '2025-12-31',
        comparativo_tipo: 'ano_anterior'
    };

    let biChartInstances = {
        empresas: null,
        diarizado: null,
        sparkline: null
    };

    function destroyBiCharts() {
        if (biChartInstances.empresas) {
            biChartInstances.empresas.destroy();
            biChartInstances.empresas = null;
        }
        if (biChartInstances.diarizado) {
            biChartInstances.diarizado.destroy();
            biChartInstances.diarizado = null;
        }
        if (biChartInstances.sparkline) {
            biChartInstances.sparkline.destroy();
            biChartInstances.sparkline = null;
        }
    }

    function formatBRL(val) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val) || 0);
    }

    function formatPct(val) {
        return (Number(val) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
    }

    function formatInt(val) {
        return (Number(val) || 0).toLocaleString('pt-BR');
    }

    function renderBiSubtabs(activeTab = 'vendas-home') {
        const tabs = [
            { id: 'vendas-home', label: 'Vendas (Home)', icon: 'fa-chart-line', route: 'nav-bi-vendas-home' },
            { id: 'vendas-detalhada', label: 'Análise Detalhada', icon: 'fa-magnifying-glass-chart', route: 'nav-bi-vendas-detalhada' },
            { id: 'metas', label: 'Gestão de Metas', icon: 'fa-bullseye', route: 'nav-bi-metas' },
            { id: 'pvm', label: 'Análise PVM', icon: 'fa-scale-balanced', route: 'nav-bi-pvm' },
            { id: 'compras', label: 'Compras', icon: 'fa-cart-flatbed', route: 'nav-bi-compras' },
            { id: 'estoque', label: 'Estoque', icon: 'fa-warehouse', route: 'nav-bi-estoque' },
            { id: 'financeiro', label: 'Financeiro & DRE', icon: 'fa-sack-dollar', route: 'nav-bi-financeiro' }
        ];

        return `
            <div class="bi-subtabs-nav">
                ${tabs.map(t => `
                    <button class="bi-subtab-btn ${t.id === activeTab ? 'active' : ''}" data-bi-tab="${t.id}" data-nav-target="${t.route}">
                        <i class="fas ${t.icon}"></i> ${t.label}
                    </button>
                `).join('')}
            </div>
        `;
    }

    function renderBiFilterBar(companies = []) {
        const compLabel = biState.comparativo_tipo === 'ano_anterior' ? 'Ano Anterior' : 'Mês Anterior';

        return `
            <div class="bi-filter-bar">
                <div class="bi-filters-left">
                    <!-- Empresa Selector -->
                    <div class="bi-filter-group">
                        <label class="bi-filter-label"><i class="fas fa-building"></i> Empresa:</label>
                        <select id="bi-filter-company" class="bi-select">
                            <option value="" ${!biState.empresa_id ? 'selected' : ''}>Todas as Empresas (Consolidado)</option>
                            ${companies.map(c => `
                                <option value="${c.id}" ${biState.empresa_id == c.id ? 'selected' : ''}>${c.codigo_ciss || c.id} - ${c.nome_fantasia || c.razao_social}</option>
                            `).join('')}
                        </select>
                    </div>

                    <!-- Período Datas -->
                    <div class="bi-filter-group">
                        <label class="bi-filter-label"><i class="fas fa-calendar-days"></i> Período:</label>
                        <input type="date" id="bi-filter-start" class="bi-input-date" value="${biState.data_inicio}">
                        <span style="color: var(--color-text-offset); font-size: 0.8rem;">até</span>
                        <input type="date" id="bi-filter-end" class="bi-input-date" value="${biState.data_fim}">
                    </div>

                    <!-- Quick Chips -->
                    <div class="bi-quick-chips">
                        <button class="bi-chip-btn" data-period="este_mes">Este Mês</button>
                        <button class="bi-chip-btn" data-period="mes_passado">Mês Passado</button>
                        <button class="bi-chip-btn ${biState.data_inicio === '2025-01-01' && biState.data_fim === '2025-12-31' ? 'active' : ''}" data-period="ano_2025">Ano 2025</button>
                        <button class="bi-chip-btn ${biState.data_inicio === '2026-01-01' ? 'active' : ''}" data-period="ano_2026">Ano 2026</button>
                    </div>
                </div>

                <div style="display: flex; align-items: center; gap: 0.85rem;">
                    <!-- Toggle Comparativo -->
                    <div class="bi-filter-group">
                        <label class="bi-filter-label"><i class="fas fa-code-compare"></i> Comparar com:</label>
                        <div class="bi-toggle-group">
                            <button class="bi-toggle-option ${biState.comparativo_tipo === 'ano_anterior' ? 'active' : ''}" data-comp="ano_anterior">Ano Anterior</button>
                            <button class="bi-toggle-option ${biState.comparativo_tipo === 'mes_anterior' ? 'active' : ''}" data-comp="mes_anterior">Mês Anterior</button>
                        </div>
                    </div>

                    <!-- Refresh Button -->
                    <button class="btn btn-secondary" id="bi-btn-refresh" title="Recarregar Dados" style="padding: 0.45rem 0.85rem; height: 35px;">
                        <i class="fas fa-rotate"></i>
                    </button>
                </div>
            </div>
        `;
    }

    function setupBiFilterListeners(reloadFn) {
        const companySelect = document.getElementById('bi-filter-company');
        const startInput = document.getElementById('bi-filter-start');
        const endInput = document.getElementById('bi-filter-end');
        const refreshBtn = document.getElementById('bi-btn-refresh');

        companySelect?.addEventListener('change', (e) => {
            biState.empresa_id = e.target.value;
            reloadFn();
        });

        startInput?.addEventListener('change', (e) => {
            biState.data_inicio = e.target.value;
            reloadFn();
        });

        endInput?.addEventListener('change', (e) => {
            biState.data_fim = e.target.value;
            reloadFn();
        });

        refreshBtn?.addEventListener('click', () => {
            reloadFn();
        });

        document.querySelectorAll('.bi-toggle-option').forEach(btn => {
            btn.addEventListener('click', () => {
                biState.comparativo_tipo = btn.dataset.comp;
                reloadFn();
            });
        });

        document.querySelectorAll('.bi-chip-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const p = btn.dataset.period;
                const now = new Date();
                const y = now.getFullYear();
                const m = String(now.getMonth() + 1).padStart(2, '0');

                if (p === 'este_mes') {
                    biState.data_inicio = `${y}-${m}-01`;
                    const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
                    biState.data_fim = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
                } else if (p === 'mes_passado') {
                    const prevM = now.getMonth() === 0 ? 12 : now.getMonth();
                    const prevY = now.getMonth() === 0 ? y - 1 : y;
                    const prevMStr = String(prevM).padStart(2, '0');
                    const lastDay = new Date(prevY, prevM, 0).getDate();
                    biState.data_inicio = `${prevY}-${prevMStr}-01`;
                    biState.data_fim = `${prevY}-${prevMStr}-${String(lastDay).padStart(2, '0')}`;
                } else if (p === 'ano_2025') {
                    biState.data_inicio = '2025-01-01';
                    biState.data_fim = '2025-12-31';
                } else if (p === 'ano_2026') {
                    biState.data_inicio = '2026-01-01';
                    biState.data_fim = '2026-12-31';
                }
                reloadFn();
            });
        });

        document.querySelectorAll('.bi-subtab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetRoute = btn.dataset.navTarget;
                if (targetRoute) {
                    setActiveNavLink(targetRoute);
                    const handler = routes[targetRoute];
                    if (handler) handler();
                }
            });
        });
    }

    /**
     * TELA 1: POWER BI - VENDAS HOME (DASHBOARD PRINCIPAL)
     */
    async function renderBiVendasHome() {
        destroyBiCharts();
        mainTitle.textContent = 'A Elétrica - Power BI & Gestão';
        mainSubtitle.textContent = 'Painel Executivo de Faturamento, Margem Líquida e Performance de Vendas';
        headerActions.innerHTML = `
            <button class="btn btn-secondary" id="bi-seed-demo-btn" title="Recarregar Dados Demonstrativos CISS">
                <i class="fas fa-database"></i> Recarregar Dados Mock
            </button>
            <button class="btn btn-primary" onclick="window.print()">
                <i class="fas fa-file-arrow-down"></i> Exportar Relatório
            </button>
        `;

        const seedDemoBtn = document.getElementById('bi-seed-demo-btn');
        seedDemoBtn?.addEventListener('click', async () => {
            showToast('Recarregando dados de demonstração do CISS BI...', 'info');
            try {
                await api('/api/bi/seed-mock', 'POST');
                showToast('Dados de demonstração atualizados com sucesso!', 'success');
                renderBiVendasHome();
            } catch (err) {
                showToast(`Erro ao gerar mock: ${err.message}`, 'error');
            }
        });

        showLoading('Processando indicadores do Power BI...');

        try {
            // Buscar Empresas e Resumo
            const [compRes, summaryRes] = await Promise.all([
                api('/api/bi/companies').catch(() => ({ companies: [] })),
                api(`/api/bi/sales/summary?empresa_id=${biState.empresa_id}&data_inicio=${biState.data_inicio}&data_fim=${biState.data_fim}&comparativo_tipo=${biState.comparativo_tipo}`).catch(() => null)
            ]);

            const companies = compRes.companies || [];

            // Se banco estiver zerado, dispara mock automaticamente
            if (!summaryRes || summaryRes.total_registros_base === 0) {
                try {
                    await api('/api/bi/seed-mock', 'POST');
                    return renderBiVendasHome();
                } catch (e) {
                    console.error('Falha no auto-seed do BI:', e);
                }
            }

            const current = summaryRes?.atual || {};
            const comp = summaryRes?.comparativo || {};
            const deltas = summaryRes?.deltas || {};
            const sparklineData = summaryRes?.sparkline || [];
            const compLabel = biState.comparativo_tipo === 'ano_anterior' ? 'Ano Anterior' : 'Mês Anterior';

            const isFatPositive = deltas.faturamento_pct >= 0;
            const isLucroPositive = deltas.lucro_pct >= 0;
            const isTicketPositive = deltas.ticket_medio_pct >= 0;
            const isQtdPositive = deltas.qtd_tickets_pct >= 0;

            let html = `
                <div class="bi-container">
                    <!-- Sub-Abas do BI -->
                    ${renderBiSubtabs('vendas-home')}

                    <!-- Barra de Filtros -->
                    ${renderBiFilterBar(companies)}

                    <!-- 4 KPI Cards -->
                    <div class="bi-kpi-grid">
                        <!-- KPI 1: Faturamento -->
                        <div class="bi-kpi-card">
                            <div class="bi-kpi-header">
                                <span class="bi-kpi-title">Faturamento</span>
                                <div class="bi-kpi-icon"><i class="fas fa-coins"></i></div>
                            </div>
                            <div class="bi-kpi-main">
                                <div class="bi-kpi-value">${formatBRL(current.faturamento_liquido)}</div>
                                <div class="bi-sparkline-wrapper">
                                    <canvas id="bi-sparkline-fat"></canvas>
                                </div>
                            </div>
                            <div class="bi-kpi-footer">
                                <span class="bi-delta-badge ${isFatPositive ? 'positive' : 'negative'}">
                                    <i class="fas ${isFatPositive ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}"></i>
                                    ${formatPct(Math.abs(deltas.faturamento_pct))}
                                </span>
                                <span class="bi-kpi-comp-label">${formatBRL(comp.faturamento_liquido)} (${compLabel})</span>
                            </div>
                        </div>

                        <!-- KPI 2: % Lucratividade -->
                        <div class="bi-kpi-card kpi-profit">
                            <div class="bi-kpi-header">
                                <span class="bi-kpi-title">% Lucratividade</span>
                                <div class="bi-kpi-icon" style="background: rgba(16, 185, 129, 0.12); color: #059669;"><i class="fas fa-percent"></i></div>
                            </div>
                            <div class="bi-kpi-main">
                                <div class="bi-kpi-value">${formatPct(current.margem_lucro_pct)}</div>
                                <div style="font-size: 0.8rem; color: var(--color-text-offset); margin-top: 0.4rem;">
                                    Lucro Bruto: <strong style="color: var(--color-text);">${formatBRL(current.lucro_bruto)}</strong>
                                </div>
                            </div>
                            <div class="bi-kpi-footer">
                                <span class="bi-delta-badge ${isLucroPositive ? 'positive' : 'negative'}">
                                    <i class="fas ${isLucroPositive ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}"></i>
                                    ${formatPct(Math.abs(deltas.lucro_pct))}
                                </span>
                                <span class="bi-kpi-comp-label">${formatPct(comp.margem_lucro_pct)} (${compLabel})</span>
                            </div>
                        </div>

                        <!-- KPI 3: Ticket Médio -->
                        <div class="bi-kpi-card kpi-ticket">
                            <div class="bi-kpi-header">
                                <span class="bi-kpi-title">Ticket Médio</span>
                                <div class="bi-kpi-icon" style="background: rgba(245, 158, 11, 0.12); color: #d97706;"><i class="fas fa-receipt"></i></div>
                            </div>
                            <div class="bi-kpi-main">
                                <div class="bi-kpi-value">${formatBRL(current.ticket_medio)}</div>
                                <div style="font-size: 0.8rem; color: var(--color-text-offset); margin-top: 0.4rem;">
                                    Descontos Totais: <span style="color: var(--color-danger);">${formatBRL(current.total_descontos)}</span>
                                </div>
                            </div>
                            <div class="bi-kpi-footer">
                                <span class="bi-delta-badge ${isTicketPositive ? 'positive' : 'negative'}">
                                    <i class="fas ${isTicketPositive ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}"></i>
                                    ${formatPct(Math.abs(deltas.ticket_medio_pct))}
                                </span>
                                <span class="bi-kpi-comp-label">${formatBRL(comp.ticket_medio)} (${compLabel})</span>
                            </div>
                        </div>

                        <!-- KPI 4: Qtd de Tickets -->
                        <div class="bi-kpi-card kpi-count">
                            <div class="bi-kpi-header">
                                <span class="bi-kpi-title">Qtd de Tickets</span>
                                <div class="bi-kpi-icon" style="background: rgba(139, 92, 246, 0.12); color: #7c3aed;"><i class="fas fa-cart-shopping"></i></div>
                            </div>
                            <div class="bi-kpi-main">
                                <div class="bi-kpi-value">${formatInt(current.qtd_tickets)}</div>
                                <div style="font-size: 0.8rem; color: var(--color-text-offset); margin-top: 0.4rem;">
                                    Cupons & Notas Fiscais emitidas
                                </div>
                            </div>
                            <div class="bi-kpi-footer">
                                <span class="bi-delta-badge ${isQtdPositive ? 'positive' : 'negative'}">
                                    <i class="fas ${isQtdPositive ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}"></i>
                                    ${formatPct(Math.abs(deltas.qtd_tickets_pct))}
                                </span>
                                <span class="bi-kpi-comp-label">${formatInt(comp.qtd_tickets)} (${compLabel})</span>
                            </div>
                        </div>
                    </div>

                    <!-- Gráficos Grid (Empresas + Diarizado) -->
                    <div class="bi-charts-grid">
                        <!-- Gráfico 1: Faturamento por Empresa -->
                        <div class="bi-chart-card">
                            <div class="bi-chart-header">
                                <span class="bi-chart-title"><i class="fas fa-chart-column" style="color: #38bdf8;"></i> Faturamento por Empresa</span>
                                <div class="bi-chart-legend-custom">
                                    <span class="bi-legend-item"><span class="bi-legend-dot" style="background: #0284c7;"></span> Atual</span>
                                    <span class="bi-legend-item"><span class="bi-legend-dot" style="background: #94a3b8;"></span> ${compLabel}</span>
                                </div>
                            </div>
                            <div class="bi-canvas-container">
                                <canvas id="bi-chart-empresas-canvas"></canvas>
                            </div>
                        </div>

                        <!-- Gráfico 2: Faturamento Diarizado -->
                        <div class="bi-chart-card">
                            <div class="bi-chart-header">
                                <span class="bi-chart-title"><i class="fas fa-chart-area" style="color: #38bdf8;"></i> Faturamento Diarizado (Evolução Temporal)</span>
                                <div class="bi-chart-legend-custom">
                                    <span class="bi-legend-item"><span class="bi-legend-dot" style="background: #38bdf8;"></span> Período Atual</span>
                                    <span class="bi-legend-item"><span class="bi-legend-dot" style="background: #94a3b8;"></span> ${compLabel}</span>
                                </div>
                            </div>
                            <div class="bi-canvas-container">
                                <canvas id="bi-chart-diarizado-canvas"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            pageContent.innerHTML = html;
            setupBiFilterListeners(renderBiVendasHome);

            // Carregar dados complementares para os gráficos
            const [byCompanyRes, dailyRes] = await Promise.all([
                api(`/api/bi/sales/by-company?data_inicio=${biState.data_inicio}&data_fim=${biState.data_fim}&comparativo_tipo=${biState.comparativo_tipo}`).catch(() => ({ companies: [] })),
                api(`/api/bi/sales/daily?empresa_id=${biState.empresa_id}&data_inicio=${biState.data_inicio}&data_fim=${biState.data_fim}&comparativo_tipo=${biState.comparativo_tipo}`).catch(() => ({ current_daily: [], comparative_daily: [] }))
            ]);

            // Renderizar Sparkline no KPI 1
            renderSparklineChart(sparklineData);

            // Renderizar Gráficos Chart.js
            renderChartByCompany(byCompanyRes.companies || []);
            renderChartDaily(dailyRes.current_daily || [], dailyRes.comparative_daily || []);

        } catch (error) {
            renderError(error);
        }
    }

    /**
     * Gráfico Sparkline no KPI de Faturamento
     */
    function renderSparklineChart(dataPoints) {
        const canvas = document.getElementById('bi-sparkline-fat');
        if (!canvas || !window.Chart) return;

        const ctx = canvas.getContext('2d');
        const values = dataPoints && dataPoints.length > 0 ? dataPoints.map(p => Number(p.faturamento) || 0) : [10, 15, 12, 18, 22, 28, 25, 32, 38];
        const labels = values.map((_, i) => i);

        biChartInstances.sparkline = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    data: values,
                    borderColor: '#0284c7',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: {
                    x: { display: false },
                    y: { display: false }
                }
            }
        });
    }

    /**
     * Gráfico 1: Faturamento por Empresa (Horizontal / Bar)
     */
    function renderChartByCompany(companiesData) {
        const canvas = document.getElementById('bi-chart-empresas-canvas');
        if (!canvas || !window.Chart) return;

        const isDark = document.body.classList.contains('dark-mode');
        const textColor = isDark ? '#cbd5e1' : '#475569';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';

        const labels = companiesData.map(c => c.nome);
        const currentVals = companiesData.map(c => Number(c.faturamento_atual) || 0);
        const compVals = companiesData.map(c => Number(c.faturamento_comp) || 0);

        const ctx = canvas.getContext('2d');
        biChartInstances.empresas = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Período Atual',
                        data: currentVals,
                        backgroundColor: '#0284c7',
                        borderRadius: 6,
                        barPercentage: 0.65,
                        categoryPercentage: 0.7
                    },
                    {
                        label: biState.comparativo_tipo === 'ano_anterior' ? 'Ano Anterior' : 'Mês Anterior',
                        data: compVals,
                        backgroundColor: isDark ? '#475569' : '#cbd5e1',
                        borderRadius: 6,
                        barPercentage: 0.65,
                        categoryPercentage: 0.7
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                return ` ${ctx.dataset.label}: ${formatBRL(ctx.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: textColor, font: { size: 11, weight: '500' } },
                        grid: { color: gridColor }
                    },
                    y: {
                        ticks: {
                            color: textColor,
                            font: { size: 10 },
                            callback: function(v) {
                                return 'R$ ' + (v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : (v / 1000).toFixed(0) + 'k');
                            }
                        },
                        grid: { color: gridColor }
                    }
                }
            }
        });
    }

    /**
     * Gráfico 2: Faturamento Diarizado (Evolução Temporal - Spline Area)
     */
    function renderChartDaily(currentDaily, compDaily) {
        const canvas = document.getElementById('bi-chart-diarizado-canvas');
        if (!canvas || !window.Chart) return;

        const isDark = document.body.classList.contains('dark-mode');
        const textColor = isDark ? '#cbd5e1' : '#475569';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';

        // Montar labels baseados nas datas
        const labels = currentDaily.map(d => {
            const parts = d.data.split('-');
            return parts.length === 3 ? `${parts[2]}/${parts[1]}` : d.data;
        });

        const currentVals = currentDaily.map(d => Number(d.faturamento) || 0);
        const compVals = compDaily.map(d => Number(d.faturamento) || 0);

        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
        gradient.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

        biChartInstances.diarizado = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Período Atual',
                        data: currentVals,
                        borderColor: '#38bdf8',
                        backgroundColor: gradient,
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.35,
                        pointRadius: currentVals.length > 40 ? 0 : 2.5,
                        pointHoverRadius: 6
                    },
                    {
                        label: biState.comparativo_tipo === 'ano_anterior' ? 'Ano Anterior' : 'Mês Anterior',
                        data: compVals,
                        borderColor: isDark ? '#64748b' : '#94a3b8',
                        borderDash: [5, 5],
                        borderWidth: 1.8,
                        fill: false,
                        tension: 0.35,
                        pointRadius: 0,
                        pointHoverRadius: 5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                return ` ${ctx.dataset.label}: ${formatBRL(ctx.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: textColor,
                            font: { size: 10 },
                            maxTicksLimit: 15
                        },
                        grid: { display: false }
                    },
                    y: {
                        ticks: {
                            color: textColor,
                            font: { size: 10 },
                            callback: function(v) {
                                return 'R$ ' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v);
                            }
                        },
                        grid: { color: gridColor }
                    }
                }
            }
        });
    }

    /**
     * TELA 2: POWER BI - ANÁLISE DETALHADA (MIX / CATEGORIAS / PRODUTOS)
     */
    async function renderBiVendasDetalhada() {
        destroyBiCharts();
        mainTitle.textContent = 'Análise Detalhada de Vendas';
        mainSubtitle.textContent = 'Desdobramento de Faturamento, CMV e Margem por Categorias e Famílias de Produtos';
        headerActions.innerHTML = '';
        showLoading('Carregando demonstrativo detalhado...');

        try {
            const [compRes, summaryRes] = await Promise.all([
                api('/api/bi/companies').catch(() => ({ companies: [] })),
                api(`/api/bi/sales/summary?empresa_id=${biState.empresa_id}&data_inicio=${biState.data_inicio}&data_fim=${biState.data_fim}&comparativo_tipo=${biState.comparativo_tipo}`).catch(() => null)
            ]);

            const companies = compRes.companies || [];

            // Mock de categorias representativas para A Elétrica
            const categories = [
                { nome: 'Condutores & Cabos Elétricos', qtd: 4820, fat: 1850400.00, cmv: 1295280.00, margem: 30.0 },
                { nome: 'Iluminação LED & Luminárias', qtd: 3450, fat: 920500.00, cmv: 625940.00, margem: 32.0 },
                { nome: 'Disjuntores & Quadros de Distribuição', qtd: 2120, fat: 780300.00, cmv: 546210.00, margem: 30.0 },
                { nome: 'Interruptores & Tomadas', qtd: 5100, fat: 590000.00, cmv: 401200.00, margem: 32.0 },
                { nome: 'Eletrodutos, Canaletas & Conexões', qtd: 1980, fat: 340200.00, cmv: 244944.00, margem: 28.0 },
                { nome: 'Ferramentas & Instrumentos de Medição', qtd: 640, fat: 226804.41, cmv: 161031.13, margem: 29.0 }
            ];

            const totalFat = categories.reduce((sum, c) => sum + c.fat, 0);

            pageContent.innerHTML = `
                <div class="bi-container">
                    ${renderBiSubtabs('vendas-detalhada')}
                    ${renderBiFilterBar(companies)}

                    <div class="bi-chart-card">
                        <div class="bi-chart-header">
                            <span class="bi-chart-title"><i class="fas fa-layer-group" style="color: #38bdf8;"></i> Desempenho por Categoria de Materiais Elétricos</span>
                            <span style="font-size: 0.8rem; color: var(--color-text-offset);">Total: <strong>${formatBRL(totalFat)}</strong></span>
                        </div>
                        <div class="table-container" style="margin: 0; box-shadow: none; border: none;">
                            <table class="bi-ranking-table">
                                <thead>
                                    <tr>
                                        <th>Categoria</th>
                                        <th style="text-align: right;">Qtd Itens</th>
                                        <th style="text-align: right;">Faturamento Líquido</th>
                                        <th style="text-align: right;">CMV (Custo)</th>
                                        <th style="text-align: right;">Lucro Bruto</th>
                                        <th style="text-align: right;">Margem %</th>
                                        <th style="width: 160px;">Participação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${categories.map(c => {
                                        const lucro = c.fat - c.cmv;
                                        const partPct = totalFat > 0 ? (c.fat / totalFat) * 100 : 0;
                                        return `
                                            <tr>
                                                <td style="font-weight: 600;">${c.nome}</td>
                                                <td style="text-align: right;">${formatInt(c.qtd)}</td>
                                                <td style="text-align: right; font-weight: 700;">${formatBRL(c.fat)}</td>
                                                <td style="text-align: right; color: var(--color-text-offset);">${formatBRL(c.cmv)}</td>
                                                <td style="text-align: right; color: #10b981; font-weight: 700;">${formatBRL(lucro)}</td>
                                                <td style="text-align: right;"><span class="badge badge-success">${formatPct(c.margem)}</span></td>
                                                <td>
                                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                                        <div class="bi-progress-bar-bg" style="flex: 1;">
                                                            <div class="bi-progress-bar-fill" style="width: ${partPct.toFixed(1)}%;"></div>
                                                        </div>
                                                        <span style="font-size: 0.75rem; font-weight: 600; min-width: 38px;">${partPct.toFixed(1)}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;

            setupBiFilterListeners(renderBiVendasDetalhada);
        } catch (error) {
            renderError(error);
        }
    }

    /**
     * TELA 3: POWER BI - GESTÃO DE METAS
     */
    async function renderBiMetas() {
        destroyBiCharts();
        mainTitle.textContent = 'Gestão de Metas & Performance';
        mainSubtitle.textContent = 'Acompanhamento de metas de faturamento, margem e volume por unidade';
        headerActions.innerHTML = '';
        showLoading('Carregando metas...');

        try {
            const compRes = await api('/api/bi/companies').catch(() => ({ companies: [] }));
            const companies = compRes.companies || [];

            const metas = [
                { empresa: '1 - A Elétrica (Matriz)', meta_fat: 3000000.00, real_fat: 3060332.87, meta_margem: 29.0, real_margem: 29.5, projecao: 102.0 },
                { empresa: '2 - A Elétrica (Filial 2)', meta_fat: 1600000.00, real_fat: 1647871.54, meta_margem: 28.5, real_margem: 29.2, projecao: 103.0 }
            ];

            pageContent.innerHTML = `
                <div class="bi-container">
                    ${renderBiSubtabs('metas')}
                    ${renderBiFilterBar(companies)}

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1.25rem;">
                        ${metas.map(m => {
                            const atingimento = (m.real_fat / m.meta_fat) * 100;
                            const isMetaBated = atingimento >= 100;
                            return `
                                <div class="bi-chart-card">
                                    <div class="bi-chart-header">
                                        <span class="bi-chart-title"><i class="fas fa-bullseye" style="color: #38bdf8;"></i> ${m.empresa}</span>
                                        <span class="badge ${isMetaBated ? 'badge-success' : 'badge-warning'}">${isMetaBated ? 'Meta Atingida' : 'Em Andamento'}</span>
                                    </div>
                                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                                        <div>
                                            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.35rem;">
                                                <span>Faturamento Realizado vs Meta:</span>
                                                <strong>${atingimento.toFixed(1)}%</strong>
                                            </div>
                                            <div class="bi-progress-bar-bg" style="height: 10px;">
                                                <div class="bi-progress-bar-fill" style="width: ${Math.min(atingimento, 100)}%; background: ${isMetaBated ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #f59e0b, #d97706)'};"></div>
                                            </div>
                                            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--color-text-offset); margin-top: 0.35rem;">
                                                <span>Realizado: <strong>${formatBRL(m.real_fat)}</strong></span>
                                                <span>Meta: ${formatBRL(m.meta_fat)}</span>
                                            </div>
                                        </div>

                                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; background: var(--color-bg-offset); padding: 0.85rem; border-radius: var(--border-radius-sm);">
                                            <div>
                                                <span style="font-size: 0.72rem; color: var(--color-text-offset); display: block;">Margem Real vs Meta</span>
                                                <span style="font-size: 1.1rem; font-weight: 700; color: #10b981;">${formatPct(m.real_margem)}</span>
                                                <span style="font-size: 0.72rem; color: var(--color-text-offset);"> (Meta: ${formatPct(m.meta_margem)})</span>
                                            </div>
                                            <div>
                                                <span style="font-size: 0.72rem; color: var(--color-text-offset); display: block;">Projeção Fechamento</span>
                                                <span style="font-size: 1.1rem; font-weight: 700; color: #0284c7;">${m.projecao.toFixed(1)}%</span>
                                                <span style="font-size: 0.72rem; color: var(--color-text-offset);"> da Meta</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;

            setupBiFilterListeners(renderBiMetas);
        } catch (error) {
            renderError(error);
        }
    }

    /**
     * TELA 4: POWER BI - ANÁLISE PVM (PREÇO x VOLUME x MIX)
     */
    async function renderBiPVM() {
        destroyBiCharts();
        mainTitle.textContent = 'Análise PVM (Preço x Volume x Mix)';
        mainSubtitle.textContent = 'Identifique a causa raiz do crescimento: variação de preço unitário, volume ou composição da cesta de compras';
        headerActions.innerHTML = '';
        showLoading('Calculando efeitos PVM...');

        try {
            const compRes = await api('/api/bi/companies').catch(() => ({ companies: [] }));
            const companies = compRes.companies || [];

            pageContent.innerHTML = `
                <div class="bi-container">
                    ${renderBiSubtabs('pvm')}
                    ${renderBiFilterBar(companies)}

                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon-wrapper stat-icon-green"><i class="fas fa-tag"></i></div>
                            <div class="stat-info">
                                <span class="stat-value">+R$ 184.200,00</span>
                                <span class="stat-label">Efeito Preço (+3.9%)</span>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon-wrapper stat-icon-blue"><i class="fas fa-box-open"></i></div>
                            <div class="stat-info">
                                <span class="stat-value">+R$ 210.004,41</span>
                                <span class="stat-label">Efeito Volume (+4.5%)</span>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon-wrapper stat-icon-amber"><i class="fas fa-layer-group"></i></div>
                            <div class="stat-info">
                                <span class="stat-value">+R$ 140.000,00</span>
                                <span class="stat-label">Efeito Mix (+3.0%)</span>
                            </div>
                        </div>
                    </div>

                    <div class="bi-chart-card">
                        <div class="bi-chart-header">
                            <span class="bi-chart-title"><i class="fas fa-circle-info" style="color: #38bdf8;"></i> Mapeamento CISS BI & Fórmula PVM</span>
                        </div>
                        <div style="padding: 0.5rem; font-size: 0.88rem; line-height: 1.6; color: var(--color-text-offset);">
                            <p>A análise PVM isola as 3 forças que compõem o delta de faturamento de <strong>+12.8% (R$ +534.204,41)</strong> entre períodos:</p>
                            <ul style="margin-left: 1.25rem; margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
                                <li><strong>Efeito Preço:</strong> Ganho obtido pelo ajuste nos preços médios unitários de venda mantendo o volume anterior.</li>
                                <li><strong>Efeito Volume:</strong> Ganho obtido pelo aumento absoluto na quantidade de produtos comercializados.</li>
                                <li><strong>Efeito Mix:</strong> Ganho gerado pela migração de clientes para produtos e cabos de maior valor agregado.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `;

            setupBiFilterListeners(renderBiPVM);
        } catch (error) {
            renderError(error);
        }
    }

    /**
     * TELA 5: POWER BI - COMPRAS
     */
    async function renderBiCompras() {
        destroyBiCharts();
        mainTitle.textContent = 'Compras & Aquisições';
        mainSubtitle.textContent = 'Ordens de compra, condições comerciais e índice de reposição';
        headerActions.innerHTML = '';
        const compRes = await api('/api/bi/companies').catch(() => ({ companies: [] }));
        const companies = compRes.companies || [];

        pageContent.innerHTML = `
            <div class="bi-container">
                ${renderBiSubtabs('compras')}
                ${renderBiFilterBar(companies)}
                <div class="empty-state" style="padding: 3rem 1rem;">
                    <div class="empty-state-icon" style="background: rgba(56, 189, 248, 0.15); color: #0284c7;"><i class="fas fa-cart-flatbed"></i></div>
                    <h3>Módulo de Compras CISS ERP</h3>
                    <p>Mapeamento dos pedidos de compra, cotações com distribuidores (Dismatal, Prysmian, Schneider) e curva ABC de compras.</p>
                </div>
            </div>
        `;
        setupBiFilterListeners(renderBiCompras);
    }

    /**
     * =========================================================================
     * MÓDULO POWER BI - ESTOQUE & PRODUTOS ("A ELÉTRICA")
     * =========================================================================
     */

    let biEstoqueState = {
        empresa_id: '',
        tipo_custo: 'custo_medio_fiscal',
        agrupador: 'subgrupo',
        curva_a: 20,
        curva_b: 30,
        situacao: '',
        busca: '',
        page: 1,
        limit: 50
    };

    function renderBiEstoqueSubtabs(activeSubTab = 'home') {
        return `
            <div class="bi-subtabs-nav">
                <button class="bi-subtab-btn ${activeSubTab === 'vendas' ? 'active' : ''}" data-nav-target="nav-bi-vendas-home">
                    <i class="fas fa-chart-line"></i> Vendas (Home)
                </button>
                <button class="bi-subtab-btn ${activeSubTab === 'home' ? 'active' : ''}" data-nav-target="nav-bi-estoque">
                    <i class="fas fa-warehouse"></i> Estoque (Home)
                </button>
                <button class="bi-subtab-btn ${activeSubTab === 'curva-abc' ? 'active' : ''}" data-nav-target="nav-bi-estoque-curva-abc">
                    <i class="fas fa-chart-pie"></i> Estoque (Curva ABC)
                </button>
                <button class="bi-subtab-btn ${activeSubTab === 'detalhada' ? 'active' : ''}" data-nav-target="nav-bi-estoque-detalhada">
                    <i class="fas fa-list-check"></i> Estoque (Análise Detalhada)
                </button>
                <button class="bi-subtab-btn ${activeSubTab === 'compras' ? 'active' : ''}" data-nav-target="nav-bi-compras">
                    <i class="fas fa-cart-flatbed"></i> Compras
                </button>
                <button class="bi-subtab-btn ${activeSubTab === 'financeiro' ? 'active' : ''}" data-nav-target="nav-bi-financeiro">
                    <i class="fas fa-sack-dollar"></i> Financeiro
                </button>
            </div>
        `;
    }

    function renderBiEstoqueFilterBar(companies = []) {
        return `
            <div class="bi-filter-bar">
                <div class="bi-filters-left">
                    <!-- Empresa Selector -->
                    <div class="bi-filter-group">
                        <label class="bi-filter-label"><i class="fas fa-building"></i> Empresa:</label>
                        <select id="bi-estoque-filter-company" class="bi-select">
                            <option value="" ${!biEstoqueState.empresa_id ? 'selected' : ''}>Todas as Empresas (Consolidado)</option>
                            ${companies.map(c => `
                                <option value="${c.id}" ${biEstoqueState.empresa_id == c.id ? 'selected' : ''}>${c.codigo_ciss || c.id} - ${c.nome_fantasia || c.razao_social}</option>
                            `).join('')}
                        </select>
                    </div>

                    <!-- Tipo de Custo CISS -->
                    <div class="bi-filter-group">
                        <label class="bi-filter-label"><i class="fas fa-calculator"></i> Tipo Custo:</label>
                        <select id="bi-estoque-filter-custo" class="bi-select">
                            <option value="custo_medio_fiscal" ${biEstoqueState.tipo_custo === 'custo_medio_fiscal' ? 'selected' : ''}>Custo Médio Fiscal (Padrão)</option>
                            <option value="custo_gerencial" ${biEstoqueState.tipo_custo === 'custo_gerencial' ? 'selected' : ''}>Custo Gerencial</option>
                            <option value="custo_medio" ${biEstoqueState.tipo_custo === 'custo_medio' ? 'selected' : ''}>Custo Médio</option>
                            <option value="custo_reposicao" ${biEstoqueState.tipo_custo === 'custo_reposicao' ? 'selected' : ''}>Custo de Reposição (Última Compra)</option>
                            <option value="custo_nota_fiscal" ${biEstoqueState.tipo_custo === 'custo_nota_fiscal' ? 'selected' : ''}>Custo Nota Fiscal</option>
                            <option value="preco_venda_varejo" ${biEstoqueState.tipo_custo === 'preco_venda_varejo' ? 'selected' : ''}>Preço de Venda (Varejo)</option>
                        </select>
                    </div>

                    <!-- Local de Estoque -->
                    <div class="bi-filter-group">
                        <label class="bi-filter-label"><i class="fas fa-boxes-stacked"></i> Local:</label>
                        <select class="bi-select" style="min-width: 120px;">
                            <option value="todos">Todos os Locais</option>
                            <option value="deposito">Depósito Principal</option>
                            <option value="loja">Loja Física / Salão</option>
                        </select>
                    </div>
                </div>

                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <!-- Botão de Teste de 1 Produto (Temporário / Diagnóstico) -->
                    <button class="btn" id="bi-btn-test-single-product" data-action="open-integrim-test-modal" title="Testar importação de 1 produto nos 3 endpoints do Integrim (CISS Poder)" style="padding: 0.45rem 0.85rem; height: 35px; font-size: 0.82rem; background: rgba(245, 158, 11, 0.15); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.4); font-weight: 600;">
                        <i class="fas fa-flask"></i> Testar 1 Produto
                    </button>

                    <!-- Botão Sincronizar Integrim -->
                    <button class="btn btn-primary" id="bi-btn-sync-integrim" title="Sincronizar dados em tempo real com Integrim CISS Poder" style="padding: 0.45rem 0.85rem; height: 35px; font-size: 0.82rem;">
                        <i class="fas fa-rotate"></i> Sincronizar Integrim
                    </button>

                    <!-- Botão Recarregar / Refresh -->
                    <button class="btn btn-secondary" id="bi-estoque-btn-refresh" title="Atualizar Painel" style="padding: 0.45rem 0.85rem; height: 35px;">
                        <i class="fas fa-arrow-rotate-right"></i>
                    </button>
                </div>
            </div>
        `;
    }

    function setupBiEstoqueListeners(reloadFn) {
        document.getElementById('bi-estoque-filter-company')?.addEventListener('change', (e) => {
            biEstoqueState.empresa_id = e.target.value;
            reloadFn();
        });

        document.getElementById('bi-estoque-filter-custo')?.addEventListener('change', (e) => {
            biEstoqueState.tipo_custo = e.target.value;
            reloadFn();
        });

        document.getElementById('bi-estoque-btn-refresh')?.addEventListener('click', () => {
            reloadFn();
        });

        document.getElementById('bi-btn-test-single-product')?.addEventListener('click', () => {
            openIntegrimSingleProductTestModal();
        });

        document.getElementById('bi-btn-sync-integrim')?.addEventListener('click', async () => {
            const btn = document.getElementById('bi-btn-sync-integrim');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sincronizando...';
            }
            showToast('Conectando ao Integrim CISS Poder (CAD_PRODUTOS, SALDO_ESTOQUE, PRECOS_CUSTOS)...', 'info');

            try {
                const res = await api('/api/bi/stock/sync-integrim', 'POST');
                showToast(res.mensagem || 'Sincronização com CISS Poder concluída com sucesso!', 'success');
                reloadFn();
            } catch (err) {
                showToast(`Falha na sincronização ao vivo: ${err.message}. Carregando base demonstrativa...`, 'warning');
                // Se falhar a conexão remota, dispara o mock para nunca deixar a tela vazia
                await api('/api/bi/stock/seed-mock', 'POST').catch(() => {});
                reloadFn();
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-rotate"></i> Sincronizar Integrim';
                }
            }
        });

        document.querySelectorAll('.bi-subtab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetRoute = btn.dataset.navTarget;
                if (targetRoute) {
                    setActiveNavLink(targetRoute);
                    const handler = routes[targetRoute];
                    if (handler) handler();
                }
            });
        });
    }

    /**
     * TELA 6: POWER BI - ESTOQUE HOME
     */
    async function renderBiEstoqueHome() {
        destroyBiCharts();
        mainTitle.textContent = 'A Elétrica - Estoque Home';
        mainSubtitle.textContent = 'Posição Física, Valorização de Estoque, Cobertura e Alertas de Ruptura';
        headerActions.innerHTML = `
            <button class="btn btn-secondary" id="bi-estoque-seed-btn" title="Recarregar Dados Demonstrativos CISS">
                <i class="fas fa-database"></i> Recarregar Dados CISS
            </button>
            <button class="btn btn-primary" onclick="window.print()">
                <i class="fas fa-file-arrow-down"></i> Exportar
            </button>
        `;

        document.getElementById('bi-estoque-seed-btn')?.addEventListener('click', async () => {
            showToast('Recarregando dados de demonstração de estoque CISS...', 'info');
            try {
                await api('/api/bi/stock/seed-mock', 'POST');
                showToast('Dados de estoque atualizados!', 'success');
                renderBiEstoqueHome();
            } catch (e) {
                showToast(`Erro: ${e.message}`, 'error');
            }
        });

        showLoading('Processando indicadores de estoque...');

        try {
            const [compRes, summaryRes] = await Promise.all([
                api('/api/bi/companies').catch(() => ({ companies: [] })),
                api(`/api/bi/stock/summary?empresa_id=${biEstoqueState.empresa_id}&tipo_custo=${biEstoqueState.tipo_custo}`).catch(() => null)
            ]);

            const companies = compRes.companies || [];

            // Se estoque estiver vazio, popula automaticamente
            if (!summaryRes || !summaryRes.kpis || summaryRes.kpis.mix_produtos === 0) {
                try {
                    await api('/api/bi/stock/seed-mock', 'POST');
                    return renderBiEstoqueHome();
                } catch (e) {
                    console.error('Falha no auto-seed do estoque:', e);
                }
            }

            const kpi = summaryRes?.kpis || {};
            const empresasData = summaryRes?.grafico_empresas || [];
            const estruturaData = summaryRes?.grafico_estrutura || [];
            const fornecedoresData = summaryRes?.grafico_fornecedores || [];

            let html = `
                <div class="bi-container">
                    <!-- Sub-Abas do Módulo Estoque -->
                    ${renderBiEstoqueSubtabs('home')}

                    <!-- Barra de Filtros Inteligente -->
                    ${renderBiEstoqueFilterBar(companies)}

                    <!-- 5 KPI Cards Oficiais do CISS BI -->
                    <div class="bi-kpi-grid-5">
                        <!-- KPI 1: Valor de Estoque -->
                        <div class="bi-kpi-card">
                            <div class="bi-kpi-header">
                                <span class="bi-kpi-title">Valor de Estoque</span>
                                <div class="bi-kpi-icon"><i class="fas fa-calculator"></i></div>
                            </div>
                            <div class="bi-kpi-main">
                                <div class="bi-kpi-value">${formatBRL(kpi.valor_estoque)}</div>
                            </div>
                            <div class="bi-kpi-footer">
                                <span style="font-size: 0.75rem; color: var(--color-text-offset);">Base: <strong>${biEstoqueState.tipo_custo.replace(/_/g, ' ').toUpperCase()}</strong></span>
                            </div>
                        </div>

                        <!-- KPI 2: Quantidade Total -->
                        <div class="bi-kpi-card kpi-qtd">
                            <div class="bi-kpi-header">
                                <span class="bi-kpi-title">Quantidade</span>
                                <div class="bi-kpi-icon" style="background: rgba(99, 102, 241, 0.12); color: #4f46e5;"><i class="fas fa-boxes-stacked"></i></div>
                            </div>
                            <div class="bi-kpi-main">
                                <div class="bi-kpi-value">${formatInt(kpi.quantidade_estoque)}</div>
                            </div>
                            <div class="bi-kpi-footer">
                                <span style="font-size: 0.75rem; color: var(--color-text-offset);">Unidades físicas em estoque</span>
                            </div>
                        </div>

                        <!-- KPI 3: Cobertura -->
                        <div class="bi-kpi-card kpi-cobertura">
                            <div class="bi-kpi-header">
                                <span class="bi-kpi-title">Cobertura</span>
                                <div class="bi-kpi-icon" style="background: rgba(14, 165, 233, 0.12); color: #0284c7;"><i class="fas fa-calendar-check"></i></div>
                            </div>
                            <div class="bi-kpi-main">
                                <div class="bi-kpi-value">${kpi.dias_cobertura || 179} dias</div>
                            </div>
                            <div class="bi-kpi-footer">
                                <span style="font-size: 0.75rem; color: var(--color-text-offset);">Média de Giro por Qtd</span>
                            </div>
                        </div>

                        <!-- KPI 4: Mix de Produtos -->
                        <div class="bi-kpi-card kpi-mix">
                            <div class="bi-kpi-header">
                                <span class="bi-kpi-title">Mix de Produtos</span>
                                <div class="bi-kpi-icon" style="background: rgba(139, 92, 246, 0.12); color: #7c3aed;"><i class="fas fa-cart-shopping"></i></div>
                            </div>
                            <div class="bi-kpi-main">
                                <div class="bi-kpi-value">${formatInt(kpi.mix_produtos)}</div>
                            </div>
                            <div class="bi-kpi-footer">
                                <span style="font-size: 0.75rem; color: var(--color-text-offset);">SKUs Ativos Cadastrados</span>
                            </div>
                        </div>

                        <!-- KPI 5: Ruptura Estoque -->
                        <div class="bi-kpi-card kpi-ruptura">
                            <div class="bi-kpi-header">
                                <span class="bi-kpi-title">Ruptura Estoque</span>
                                <div class="bi-kpi-icon" style="background: rgba(239, 68, 68, 0.12); color: #dc2626;"><i class="fas fa-triangle-exclamation"></i></div>
                            </div>
                            <div class="bi-kpi-main">
                                <div class="bi-kpi-value" style="color: #dc2626;">${kpi.ruptura_itens} Itens</div>
                            </div>
                            <div class="bi-kpi-footer">
                                <span class="badge badge-danger" style="font-size: 0.72rem;">Necessita Reposição</span>
                            </div>
                        </div>
                    </div>

                    <!-- 3 Gráficos Oficiais do CISS BI -->
                    <div class="bi-stock-charts-grid">
                        <!-- Gráfico 1: Empresa -->
                        <div class="bi-chart-card">
                            <div class="bi-chart-header">
                                <span class="bi-chart-title"><i class="fas fa-building" style="color: #38bdf8;"></i> Empresa</span>
                                <span style="font-size: 0.75rem; color: var(--color-text-offset);">Participação</span>
                            </div>
                            <div class="bi-canvas-container" style="height: 280px;">
                                <canvas id="bi-chart-estoque-empresa-canvas"></canvas>
                            </div>
                        </div>

                        <!-- Gráfico 2: Estrutura Mercadológica -->
                        <div class="bi-chart-card">
                            <div class="bi-chart-header">
                                <span class="bi-chart-title"><i class="fas fa-sitemap" style="color: #38bdf8;"></i> Estrutura Mercadológica</span>
                                <span style="font-size: 0.75rem; color: var(--color-text-offset);">Grupo</span>
                            </div>
                            <div class="bi-canvas-container" style="height: 280px;">
                                <canvas id="bi-chart-estoque-estrutura-canvas"></canvas>
                            </div>
                        </div>

                        <!-- Gráfico 3: Fornecedor / Grupo Econômico -->
                        <div class="bi-chart-card">
                            <div class="bi-chart-header">
                                <span class="bi-chart-title"><i class="fas fa-truck-field" style="color: #38bdf8;"></i> Fornecedor / Grupo Econômico</span>
                                <span style="font-size: 0.75rem; color: var(--color-text-offset);">Top 10</span>
                            </div>
                            <div class="bi-canvas-container" style="height: 280px;">
                                <canvas id="bi-chart-estoque-fornecedores-canvas"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            pageContent.innerHTML = html;
            setupBiEstoqueListeners(renderBiEstoqueHome);

            // Renderiza os 3 Gráficos
            renderChartEstoqueEmpresas(empresasData);
            renderChartEstoqueEstrutura(estruturaData);
            renderChartEstoqueFornecedores(fornecedoresData);

        } catch (error) {
            renderError(error);
        }
    }

    /**
     * Gráfico 1 de Estoque: Faturamento por Empresa
     */
    function renderChartEstoqueEmpresas(data) {
        const canvas = document.getElementById('bi-chart-estoque-empresa-canvas');
        if (!canvas || !window.Chart) return;

        const isDark = document.body.classList.contains('dark-mode');
        const textColor = isDark ? '#cbd5e1' : '#475569';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';

        const labels = data.map(d => d.nome);
        const values = data.map(d => d.valor);

        const ctx = canvas.getContext('2d');
        biChartInstances.estoqueEmpresas = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Valor de Estoque',
                    data: values,
                    backgroundColor: ['#1e3a8a', '#3b82f6'],
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (c) => ` ${formatBRL(c.raw)}`
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: textColor,
                            callback: (v) => 'R$ ' + (v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : (v / 1000).toFixed(0) + 'k')
                        },
                        grid: { color: gridColor }
                    },
                    y: {
                        ticks: { color: textColor, font: { weight: '600' } },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    /**
     * Gráfico 2 de Estoque: Estrutura Mercadológica
     */
    function renderChartEstoqueEstrutura(data) {
        const canvas = document.getElementById('bi-chart-estoque-estrutura-canvas');
        if (!canvas || !window.Chart) return;

        const isDark = document.body.classList.contains('dark-mode');
        const textColor = isDark ? '#cbd5e1' : '#475569';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';

        const labels = data.map(d => d.nome.length > 25 ? d.nome.slice(0, 25) + '...' : d.nome);
        const values = data.map(d => d.valor);

        const ctx = canvas.getContext('2d');
        biChartInstances.estoqueEstrutura = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Valor',
                    data: values,
                    backgroundColor: '#0284c7',
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: (c) => ` ${formatBRL(c.raw)}` } }
                },
                scales: {
                    x: {
                        ticks: {
                            color: textColor,
                            callback: (v) => 'R$ ' + (v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : (v / 1000).toFixed(0) + 'k')
                        },
                        grid: { color: gridColor }
                    },
                    y: {
                        ticks: { color: textColor, font: { size: 10 } },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    /**
     * Gráfico 3 de Estoque: Ranking Fornecedores
     */
    function renderChartEstoqueFornecedores(data) {
        const canvas = document.getElementById('bi-chart-estoque-fornecedores-canvas');
        if (!canvas || !window.Chart) return;

        const isDark = document.body.classList.contains('dark-mode');
        const textColor = isDark ? '#cbd5e1' : '#475569';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';

        const labels = data.map(d => d.fornecedor.length > 25 ? d.fornecedor.slice(0, 25) + '...' : d.fornecedor);
        const values = data.map(d => d.valor);

        const ctx = canvas.getContext('2d');
        biChartInstances.estoqueFornecedores = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Valor de Estoque',
                    data: values,
                    backgroundColor: '#1e293b',
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: (c) => ` ${formatBRL(c.raw)}` } }
                },
                scales: {
                    x: {
                        ticks: {
                            color: textColor,
                            callback: (v) => 'R$ ' + (v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : (v / 1000).toFixed(0) + 'k')
                        },
                        grid: { color: gridColor }
                    },
                    y: {
                        ticks: { color: textColor, font: { size: 9 } },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    /**
     * TELA: POWER BI - ESTOQUE CURVA ABC (PARETO, DONUTS E 5 CUSTOS CISS)
     */
    async function renderBiEstoqueCurvaABC() {
        destroyBiCharts();
        mainTitle.textContent = 'Estoque - Curva ABC & Custos Múltiplos';
        mainSubtitle.textContent = 'Classificação de Pareto (20/30/50) e Tabela Comparativa dos 5 Tipos de Custos do CISS Poder';
        headerActions.innerHTML = '';
        showLoading('Processando cálculo de Curva ABC e Pareto...');

        try {
            const [compRes, abcRes] = await Promise.all([
                api('/api/bi/companies').catch(() => ({ companies: [] })),
                api(`/api/bi/stock/curva-abc?empresa_id=${biEstoqueState.empresa_id}&tipo_custo=${biEstoqueState.tipo_custo}`).catch(() => null)
            ]);

            const companies = compRes.companies || [];
            const tabelaCustos = abcRes?.tabela_custos || [];
            const totais = abcRes?.totais || {};
            const donuts = abcRes?.donuts || { qtd: [], valor: [] };
            const pareto = abcRes?.pareto || [];

            let html = `
                <div class="bi-container">
                    <!-- Sub-Abas -->
                    ${renderBiEstoqueSubtabs('curva-abc')}

                    <!-- Filtros -->
                    ${renderBiEstoqueFilterBar(companies)}

                    <!-- Gráficos de Curva ABC: Pareto + 2 Donuts -->
                    <div style="display: grid; grid-template-columns: 1.8fr 1fr 1fr; gap: 1.25rem;">
                        <!-- Gráfico 1: Pareto (Barras + Linha %) -->
                        <div class="bi-chart-card">
                            <div class="bi-chart-header">
                                <span class="bi-chart-title"><i class="fas fa-chart-line" style="color: #38bdf8;"></i> Pareto: Qtd. por Subgrupo & % Acumulado</span>
                            </div>
                            <div class="bi-canvas-container" style="height: 260px;">
                                <canvas id="bi-pareto-canvas"></canvas>
                            </div>
                        </div>

                        <!-- Gráfico 2: Donut Qtd Estoque Curva -->
                        <div class="bi-chart-card">
                            <div class="bi-chart-header">
                                <span class="bi-chart-title"><i class="fas fa-chart-pie" style="color: #10b981;"></i> Qtd. Estoque (Un.)</span>
                            </div>
                            <div class="bi-canvas-container" style="height: 260px;">
                                <canvas id="bi-donut-qtd-canvas"></canvas>
                            </div>
                        </div>

                        <!-- Gráfico 3: Donut Valor Selecionado Curva -->
                        <div class="bi-chart-card">
                            <div class="bi-chart-header">
                                <span class="bi-chart-title"><i class="fas fa-coins" style="color: #38bdf8;"></i> Valor Selecionado</span>
                            </div>
                            <div class="bi-canvas-container" style="height: 260px;">
                                <canvas id="bi-donut-valor-canvas"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- Tabela Oficial de 5 Custos CISS BI -->
                    <div class="bi-chart-card">
                        <div class="bi-chart-header">
                            <span class="bi-chart-title"><i class="fas fa-table" style="color: #38bdf8;"></i> Tabela Comparativa de Custos por Curva ABC</span>
                        </div>
                        <div class="table-container" style="margin: 0; box-shadow: none; border: none; overflow-x: auto;">
                            <table class="bi-ranking-table">
                                <thead>
                                    <tr>
                                        <th style="width: 100px;">Curva ABC</th>
                                        <th style="text-align: right;">Contagem Itens</th>
                                        <th style="text-align: right;">Qtd. Atual Estoque</th>
                                        <th style="text-align: right;">Custo Gerencial</th>
                                        <th style="text-align: right;">Custo Médio</th>
                                        <th style="text-align: right; background: rgba(56, 189, 248, 0.08);">Custo Médio Fiscal</th>
                                        <th style="text-align: right;">Custo Última Compra</th>
                                        <th style="text-align: right;">Valor Nota Fiscal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${tabelaCustos.map(t => {
                                        const badgeClass = t.curva_abc === 'A' ? 'badge-curva-a' : (t.curva_abc === 'B' ? 'badge-curva-b' : 'badge-curva-c');
                                        return `
                                            <tr>
                                                <td><span class="badge-curva ${badgeClass}">${t.curva_abc}</span></td>
                                                <td style="text-align: right; font-weight: 600;">${formatInt(t.contagem_itens)}</td>
                                                <td style="text-align: right; font-weight: 700;">${formatInt(t.qtd_atual_estoque)} un</td>
                                                <td style="text-align: right;">${formatBRL(t.valor_gerencial)}</td>
                                                <td style="text-align: right;">${formatBRL(t.valor_medio)}</td>
                                                <td style="text-align: right; font-weight: 800; color: #0284c7; background: rgba(56, 189, 248, 0.08);">${formatBRL(t.valor_fiscal)}</td>
                                                <td style="text-align: right;">${formatBRL(t.valor_reposicao)}</td>
                                                <td style="text-align: right;">${formatBRL(t.valor_nota_fiscal)}</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                    <tr style="background: var(--color-bg-offset); font-weight: 800; border-top: 2px solid var(--color-border);">
                                        <td><strong>TOTAL</strong></td>
                                        <td style="text-align: right;">${formatInt(totais.contagem_itens)}</td>
                                        <td style="text-align: right;">${formatInt(totais.qtd_atual_estoque)} un</td>
                                        <td style="text-align: right;">${formatBRL(totais.valor_gerencial)}</td>
                                        <td style="text-align: right;">${formatBRL(totais.valor_medio)}</td>
                                        <td style="text-align: right; color: #0284c7; font-size: 0.95rem; background: rgba(56, 189, 248, 0.08);">${formatBRL(totais.valor_fiscal)}</td>
                                        <td style="text-align: right;">${formatBRL(totais.valor_reposicao)}</td>
                                        <td style="text-align: right;">${formatBRL(totais.valor_nota_fiscal)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;

            pageContent.innerHTML = html;
            setupBiEstoqueListeners(renderBiEstoqueCurvaABC);

            // Renderiza Pareto e Donuts
            renderParetoChart(pareto);
            renderDonutCurva(donuts);

        } catch (error) {
            renderError(error);
        }
    }

    /**
     * Gráfico de Pareto (Barras + Linha Acumulada)
     */
    function renderParetoChart(data) {
        const canvas = document.getElementById('bi-pareto-canvas');
        if (!canvas || !window.Chart) return;

        const isDark = document.body.classList.contains('dark-mode');
        const textColor = isDark ? '#cbd5e1' : '#475569';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';

        const labels = data.map(d => d.nome.length > 15 ? d.nome.slice(0, 15) + '...' : d.nome);
        const qtdVals = data.map(d => d.qtd);
        const lineVals = data.map(d => d.pct_acumulado);

        const ctx = canvas.getContext('2d');
        biChartInstances.pareto = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        type: 'line',
                        label: '% Acumulado',
                        data: lineVals,
                        borderColor: '#38bdf8',
                        borderWidth: 2,
                        borderDash: [4, 4],
                        pointRadius: 3,
                        yAxisID: 'y1',
                        fill: false
                    },
                    {
                        type: 'bar',
                        label: 'Qtd Estoque',
                        data: qtdVals,
                        backgroundColor: '#1e3a8a',
                        borderRadius: 4,
                        yAxisID: 'y'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        ticks: { color: textColor, font: { size: 9 }, maxRotation: 45 },
                        grid: { display: false }
                    },
                    y: {
                        ticks: {
                            color: textColor,
                            callback: (v) => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v
                        },
                        grid: { color: gridColor }
                    },
                    y1: {
                        position: 'right',
                        min: 0,
                        max: 100,
                        ticks: {
                            color: '#38bdf8',
                            callback: (v) => v + '%'
                        },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    /**
     * Gráficos Donut de Curva ABC (Qtd e Valor)
     */
    function renderDonutCurva(donuts) {
        const canvasQtd = document.getElementById('bi-donut-qtd-canvas');
        const canvasVal = document.getElementById('bi-donut-valor-canvas');
        if (!canvasQtd || !canvasVal || !window.Chart) return;

        const isDark = document.body.classList.contains('dark-mode');
        const textColor = isDark ? '#cbd5e1' : '#475569';

        const labels = ['Curva A', 'Curva B', 'Curva C'];
        const colors = ['#1e3a8a', '#38bdf8', '#cbd5e1'];

        // Donut Qtd
        const qtdValues = [
            donuts.qtd.find(d => d.curva === 'A')?.pct || 20.67,
            donuts.qtd.find(d => d.curva === 'B')?.pct || 29.61,
            donuts.qtd.find(d => d.curva === 'C')?.pct || 49.72
        ];

        new Chart(canvasQtd.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{ data: qtdValues, backgroundColor: colors, borderWidth: 0 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: textColor, font: { size: 10 } } },
                    tooltip: { callbacks: { label: (c) => ` ${c.label}: ${formatPct(c.raw)}` } }
                },
                cutout: '65%'
            }
        });

        // Donut Valor
        const valValues = [
            donuts.valor.find(d => d.curva === 'A')?.pct || 20.67,
            donuts.valor.find(d => d.curva === 'B')?.pct || 29.61,
            donuts.valor.find(d => d.curva === 'C')?.pct || 49.72
        ];

        new Chart(canvasVal.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{ data: valValues, backgroundColor: colors, borderWidth: 0 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: textColor, font: { size: 10 } } },
                    tooltip: { callbacks: { label: (c) => ` ${c.label}: ${formatPct(c.raw)}` } }
                },
                cutout: '65%'
            }
        });
    }

    /**
     * TELA: POWER BI - ESTOQUE (ANÁLISE DETALHADA / RUPTURA)
     */
    async function renderBiEstoqueDetalhado() {
        destroyBiCharts();
        mainTitle.textContent = 'Estoque - Análise Detalhada de Produtos';
        mainSubtitle.textContent = 'Consulta individual de SKUs, saldos por filial, cobertura e alertas de reposição';
        headerActions.innerHTML = `
            <button class="btn btn-warning" data-action="open-integrim-test-modal" title="Testar importação de 1 produto nos 3 endpoints do Integrim (CISS Poder)" style="background: #f59e0b; color: #fff; border: none; font-weight: 600;">
                <i class="fas fa-flask"></i> Testar 1 Produto (Integrim)
            </button>
        `;
        showLoading('Carregando catálogo de produtos e saldos...');

        try {
            const [compRes, prodRes] = await Promise.all([
                api('/api/bi/companies').catch(() => ({ companies: [] })),
                api(`/api/bi/stock/products?empresa_id=${biEstoqueState.empresa_id}&busca=${encodeURIComponent(biEstoqueState.busca)}&curva_abc=${biEstoqueState.curva_abc}&situacao=${biEstoqueState.situacao}&page=${biEstoqueState.page}&limit=50`).catch(() => ({ products: [], total: 0, pages: 1 }))
            ]);

            const companies = compRes.companies || [];
            const products = prodRes.products || [];
            const total = prodRes.total || 0;
            const pages = prodRes.pages || 1;

            let html = `
                <div class="bi-container">
                    ${renderBiEstoqueSubtabs('detalhada')}
                    ${renderBiEstoqueFilterBar(companies)}

                    <!-- Filtros Rápidos da Tabela -->
                    <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; justify-content: space-between; background: var(--color-card-bg); padding: 0.85rem 1rem; border-radius: var(--border-radius-md); border: 1px solid var(--color-border);">
                        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; flex: 1;">
                            <div style="position: relative; flex: 1; min-width: 250px;">
                                <input type="text" id="bi-prod-search" class="form-control" placeholder="Buscar por nome, SKU, código de barras ou marca..." value="${biEstoqueState.busca}" style="padding-left: 2.2rem;">
                                <i class="fas fa-search" style="position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: var(--color-text-offset);"></i>
                            </div>

                            <!-- Filtro Curva ABC -->
                            <select id="bi-prod-filter-abc" class="bi-select">
                                <option value="" ${!biEstoqueState.curva_abc ? 'selected' : ''}>Todas as Curvas (A, B, C)</option>
                                <option value="A" ${biEstoqueState.curva_abc === 'A' ? 'selected' : ''}>Apenas Curva A</option>
                                <option value="B" ${biEstoqueState.curva_abc === 'B' ? 'selected' : ''}>Apenas Curva B</option>
                                <option value="C" ${biEstoqueState.curva_abc === 'C' ? 'selected' : ''}>Apenas Curva C</option>
                            </select>

                            <!-- Filtro Situação -->
                            <select id="bi-prod-filter-situacao" class="bi-select">
                                <option value="" ${!biEstoqueState.situacao ? 'selected' : ''}>Todas as Situações</option>
                                <option value="disponivel" ${biEstoqueState.situacao === 'disponivel' ? 'selected' : ''}>Saldo Disponível (> 0)</option>
                                <option value="ruptura" ${biEstoqueState.situacao === 'ruptura' ? 'selected' : ''}>🚨 Em Ruptura (Zerado)</option>
                                <option value="baixo" ${biEstoqueState.situacao === 'baixo' ? 'selected' : ''}>⚠️ Estoque Crítico (<= Mínimo)</option>
                            </select>
                        </div>

                        <span style="font-size: 0.82rem; color: var(--color-text-offset); white-space: nowrap;">
                            Exibindo <strong>${products.length}</strong> de <strong>${total}</strong> produtos
                        </span>
                    </div>

                    <!-- Tabela de Produtos e Estoque -->
                    <div class="bi-chart-card" style="padding: 0; overflow: hidden;">
                        <div class="table-container" style="margin: 0; box-shadow: none; border: none; overflow-x: auto;">
                            <table class="bi-ranking-table">
                                <thead>
                                    <tr>
                                        <th style="width: 50px;">Curva</th>
                                        <th>SKU / Código</th>
                                        <th>Descrição do Produto</th>
                                        <th>Marca / Fabricante</th>
                                        <th>Grupo / Subgrupo</th>
                                        <th style="text-align: right;">Saldo Atual</th>
                                        <th style="text-align: right;">Disponível</th>
                                        <th style="text-align: right;">Custo Fiscal</th>
                                        <th style="text-align: right;">Preço Venda</th>
                                        <th style="text-align: center;">Cobertura</th>
                                        <th style="text-align: center;">Status</th>
                                        <th style="text-align: center; width: 60px;">Teste</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${products.length === 0 ? `
                                        <tr>
                                            <td colspan="12" style="text-align: center; color: var(--color-text-offset); padding: 2.5rem;">
                                                 Nenhum produto encontrado com os filtros selecionados.
                                            </td>
                                        </tr>
                                    ` : products.map(p => {
                                        const badgeClass = p.curva_abc === 'A' ? 'badge-curva-a' : (p.curva_abc === 'B' ? 'badge-curva-b' : 'badge-curva-c');
                                        const isRuptura = p.saldo_atual <= 0;
                                        const isBaixo = !isRuptura && p.saldo_atual <= p.estoque_minimo;
                                        const statusBadge = isRuptura ? '<span class="badge badge-danger">Ruptura</span>' : (isBaixo ? '<span class="badge badge-warning">Baixo</span>' : '<span class="badge badge-success">OK</span>');

                                        return `
                                            <tr>
                                                <td><span class="badge-curva ${badgeClass}">${p.curva_abc}</span></td>
                                                <td><code>${p.idsubproduto}</code></td>
                                                <td style="font-weight: 600;" title="${p.descricao}">${p.descricao}</td>
                                                <td>${p.marca || '-'}</td>
                                                <td style="font-size: 0.78rem; color: var(--color-text-offset);">${p.subgrupo || p.grupo || '-'}</td>
                                                <td style="text-align: right; font-weight: 700; ${isRuptura ? 'color: var(--color-danger);' : ''}">${formatInt(p.saldo_atual)} ${p.unidade}</td>
                                                <td style="text-align: right; font-weight: 600;">${formatInt(p.saldo_disponivel)}</td>
                                                <td style="text-align: right; color: var(--color-text-offset);">${formatBRL(p.custo_fiscal)}</td>
                                                <td style="text-align: right; font-weight: 700;">${formatBRL(p.preco_venda)}</td>
                                                <td style="text-align: center;">${p.dias_cobertura}d</td>
                                                <td style="text-align: center;">${statusBadge}</td>
                                                <td style="text-align: center;">
                                                    <button type="button" class="card-action-btn" data-action="open-integrim-test-modal" data-sku="${p.idsubproduto}" title="Testar SKU ${p.idsubproduto} diretamente na API CISS">
                                                        <i class="fas fa-flask" style="color: #f59e0b;"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;

            pageContent.innerHTML = html;
            setupBiEstoqueListeners(renderBiEstoqueDetalhado);

            // Listeners de busca e filtro da tabela
            const searchInput = document.getElementById('bi-prod-search');
            let searchTimeout;
            searchInput?.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    biEstoqueState.busca = e.target.value;
                    biEstoqueState.page = 1;
                    renderBiEstoqueDetalhado();
                }, 400);
            });

            document.getElementById('bi-prod-filter-abc')?.addEventListener('change', (e) => {
                biEstoqueState.curva_abc = e.target.value;
                biEstoqueState.page = 1;
                renderBiEstoqueDetalhado();
            });

            document.getElementById('bi-prod-filter-situacao')?.addEventListener('change', (e) => {
                biEstoqueState.situacao = e.target.value;
                biEstoqueState.page = 1;
                renderBiEstoqueDetalhado();
            });

        } catch (error) {
            renderError(error);
        }
    }

    /**
     * TELA 7: POWER BI - FINANCEIRO
     */
    async function renderBiFinanceiro() {
        destroyBiCharts();
        mainTitle.textContent = 'Financeiro & DRE Gerencial';
        mainSubtitle.textContent = 'Fluxo de caixa, recebíveis de cartão, boletos e demonstrativo de resultado';
        headerActions.innerHTML = '';
        const compRes = await api('/api/bi/companies').catch(() => ({ companies: [] }));
        const companies = compRes.companies || [];

        pageContent.innerHTML = `
            <div class="bi-container">
                ${renderBiSubtabs('financeiro')}
                ${renderBiFilterBar(companies)}
                <div class="empty-state" style="padding: 3rem 1rem;">
                    <div class="empty-state-icon" style="background: rgba(16, 185, 129, 0.15); color: #059669;"><i class="fas fa-sack-dollar"></i></div>
                    <h3>Módulo Financeiro & DRE CISS ERP</h3>
                    <p>Demonstrativo de Resultado do Exercício consolidado por filial com receitas, deduções, CMV e margem de contribuição líquida.</p>
                </div>
            </div>
        `;
        setupBiFilterListeners(renderBiFinanceiro);
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
        'nav-bi-vendas-home': renderBiVendasHome,
        'nav-bi-vendas-detalhada': renderBiVendasDetalhada,
        'nav-bi-metas': renderBiMetas,
        'nav-bi-pvm': renderBiPVM,
        'nav-bi-compras': renderBiCompras,
        'nav-bi-estoque': renderBiEstoqueHome,
        'nav-bi-estoque-home': renderBiEstoqueHome,
        'nav-bi-estoque-curva-abc': renderBiEstoqueCurvaABC,
        'nav-bi-estoque-detalhada': renderBiEstoqueDetalhado,
        'nav-bi-financeiro': renderBiFinanceiro,
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
            renderBiVendasHome();
        }
    });

    if (brandLink) {
        brandLink.addEventListener('click', (e) => {
            e.preventDefault();
            setActiveNavLink('nav-bi-vendas-home');
            renderBiVendasHome();
        });
    }

    // Inicialização da interface
    initializeThemeSwitcher();
    initializeSidebar();

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

    // Carregar tela inicial (Power BI Vendas Home)
    setActiveNavLink('nav-bi-vendas-home');
    renderBiVendasHome();
});

