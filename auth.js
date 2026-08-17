import { getLogger, createRequestId } from './logger.js';
import { findSelector } from './parsers.js';
import { initBrowser, closeBrowser } from './browser.js'; // Importação estática

/**
 * Erro customizado para falhas de autenticação.
 */
export class AuthenticationError extends Error {
    constructor(message, context) {
        super(message);
        this.name = 'AuthenticationError';
        this.context = context;
    }
}

/**
 * Utilitário para executar uma função com retentativas.
 */
async function withRetry(fn, options) {
    const { maxAttempts = 3, delayMs = 1000, onRetry } = options;
    let attempt = 1;
    let lastError = null;
    while (attempt <= maxAttempts) {
        try {
            return await fn(attempt, lastError);
        } catch (error) {
            lastError = error;
            if (attempt === maxAttempts) {
                throw error;
            }
            if (onRetry) {
                onRetry(attempt, error);
            }
            await new Promise(resolve => setTimeout(resolve, delayMs * attempt)); // Aumenta o delay a cada tentativa
            attempt++;
        }
    }
}

/**
 * Seletores padrão para o fluxo de login.
 */
export const DEFAULT_LOGIN_SELECTORS = {
    loginButton: ['p.login-btn__hello', 'a.login-btn', '#drawer-header-btn', '[data-testid="login-btn"]', 'button.btn-login'],
    usernameInput: ['input[formcontrolname="usuario"]', 'input[placeholder="CNPJ"]', 'input[name="usuario"]'],
    passwordInput: ['input[formcontrolname="senha"]', 'input[placeholder="Senha"]', 'input[type="password"]'],
    submitButton: ['button.btn-login', 'button[type="submit"]'],
    loginModal: ['[role="dialog"]', '.modal', '.login-modal'],
    logoutLink: ['a[href*="sair"]', '[data-testid="logout"]'],
    cookieAcceptButton: ['button[data-test="COOKIE-POPUP-CLOSE-BTN"]', '.cookie-popup__button', '#onetrust-accept-btn-handler'],
    welcomeModalCloseButton: ['button:has-text("Continuar e fechar")', 'button[aria-label*="Fechar"]', '.modal-close'],
};

/**
 * Executa o fluxo de login.
 */
async function performLogin(page, credentials, selectors) {
    const logger = getLogger();

    // PASSO 1: Fechar pop-up de cookies, se existir
    try {
        const cookieBtnSelector = await findSelector(page, selectors.cookieAcceptButton);
        if (cookieBtnSelector) {
            logger.debug('[Auth] Fechando pop-up de cookies.');
            await page.click(cookieBtnSelector);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Espera para estabilizar
        }
    } catch (e) {
        logger.debug('[Auth] Pop-up de cookies não encontrado ou já fechado.');
    }

    // 2. Clicar no botão de login para abrir o modal
    logger.debug('[Auth] Procurando botão de login...');
    const loginButtonSelector = await findSelector(page, selectors.loginButton);
    if (!loginButtonSelector) {
        throw new Error('Botão de login não encontrado.');
    }
    await page.click(loginButtonSelector);
    logger.debug(`[Auth] Botão de login clicado: ${loginButtonSelector}`);

    // PASSO 3: Aguardar o modal de login e preencher os campos
    try {
        logger.debug('[Auth] Aguardando o modal de login aparecer...');
        await page.waitForSelector(selectors.loginModal.join(','), { visible: true, timeout: 10000 });
    } catch (e) {
        throw new Error('Modal de login não apareceu após clicar no botão.');
    }
    logger.debug('[Auth] Modal de login visível.');

    // Aguarda um pequeno delay para garantir que os campos dentro do modal estejam prontos para receber input.
    await new Promise(resolve => setTimeout(resolve, 1000));

    const usernameSelector = await findSelector(page, selectors.usernameInput);
    if (!usernameSelector) throw new Error('Input de usuário não encontrado no modal.');

    const passwordSelector = await findSelector(page, selectors.passwordInput);
    if (!passwordSelector) throw new Error('Input de senha não encontrado no modal.');

    logger.debug('[Auth] Preenchendo credenciais...');
    await page.type(usernameSelector, credentials.username);
    await page.type(passwordSelector, credentials.password);

    // PASSO 4: Clicar no botão de submit e aguardar o resultado
    const submitSelector = await findSelector(page, selectors.submitButton);
    if (!submitSelector) throw new Error('Botão de submit não encontrado no modal.');

    logger.debug('[Auth] Submetendo formulário de login...');
    // Clica no botão de submit, mas não espera pela navegação aqui.
    await page.click(submitSelector);

    // Abordagem mais robusta: Após o clique, aguarda um tempo para a requisição ser processada
    // e então recarrega a página para validar o estado de login.
    try {
        logger.debug('[Auth] Aguardando processamento do login e recarregando a página para validar o estado...');
        await new Promise(resolve => setTimeout(resolve, 3000)); // Espera 3s para a requisição de login processar
        await page.reload({ waitUntil: 'networkidle0', timeout: 45000 });

        // A validação de sucesso agora é verificar se o botão de login DESAPARECEU.
        // Usamos um timeout curto. Se o botão ainda estiver lá, o login falhou.
        try {
            await page.waitForSelector(selectors.loginButton.join(','), { visible: true, timeout: 5000 });
            // Se o seletor foi encontrado, significa que o login falhou, pois o botão ainda está visível.
            const pageContent = await page.content();
            const errorHint = pageContent.match(/class="[^"]*error[^"]*".*?>([^<]+)/i);
            const errorMessage = errorHint ? errorHint[1].trim() : 'Botão de login ainda visível.';
            throw new Error(`Login falhou: ${errorMessage}`);
        } catch (e) {
            // Se `waitForSelector` deu timeout, é um SUCESSO! O botão de login não foi encontrado.
            logger.debug('[Auth] Botão de login não encontrado após recarregar. Login considerado bem-sucedido.');
        }

    } catch (e) {
        // Captura o erro do bloco try/catch interno ou o timeout do reload.
        throw new Error(`Validação de login falhou após recarregar a página. Causa: ${e.message}`);
    }
    logger.debug('[Auth] Validação de login bem-sucedida.');

    // PASSO 5: Extrair cookies
    logger.debug('[Auth] Extraindo cookies de sessão...');
    const cookies = await page.cookies();

    // PASSO 6: Fechar modal de boas-vindas (se houver)
    // Adiciona uma pausa para dar tempo ao modal de aparecer.
    await new Promise(resolve => setTimeout(resolve, 1500));
    try {
        const closeModalSelector = await findSelector(page, selectors.welcomeModalCloseButton);
        if (closeModalSelector) {
            logger.debug('[Auth] Fechando modal de boas-vindas.');
            await page.click(closeModalSelector);
            // Espera um pouco para o modal fechar completamente
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    } catch (e) {
        logger.debug('[Auth] Nenhum modal de boas-vindas encontrado.');
    }

    return cookies;
}

/**
 * Orquestra a autenticação com retentativas.
 * @param {object} browserConfig - Configuração para inicializar o browser.
 * @param {object} options
 * @param {string} options.url - A URL base para a qual retornar em caso de redirecionamento.
 * @param {object} options.credentials
 * @param {number} options.retryAttempts
 * @param {number} options.retryDelayMs
 * @param {object} [selectors]
 * @returns {Promise<object[]>} Um array de objetos de cookie do Puppeteer.
 */
export async function authenticate(browserConfig, options, selectors = DEFAULT_LOGIN_SELECTORS) {
    const logger = getLogger();
    const requestId = createRequestId();
    const { url, credentials, retryAttempts, retryDelayMs } = options;

    logger.info('[Auth] Iniciando autenticação...', {
        action: 'auth_start',
        requestId,
        retryAttempts,
    });

    let browserInstance = null; // Variável para manter a instância entre as tentativas
    try {
        const cookies = await withRetry(
            async (attempt, lastError) => {
                // Se houve um erro anterior, fecha a instância antiga antes de criar uma nova.
                if (attempt > 1 && browserInstance) {
                    logger.info('[Auth] Fechando instância de navegador anterior para retentativa.');
                    await closeBrowser(browserInstance);
                    browserInstance = null; // Reseta a variável
                }

                logger.info(`[Auth] Tentativa ${attempt}: inicializando navegador.`);
                browserInstance = await initBrowser(browserConfig);
                const { page } = browserInstance;

                await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
                const cookies = await performLogin(page, credentials, selectors);

                await closeBrowser(browserInstance); // Fecha o navegador de autenticação após o sucesso
                browserInstance = null;
                return cookies; // Retorna apenas os cookies
            },
            {
                maxAttempts: retryAttempts,
                delayMs: retryDelayMs,
                onRetry: (attempt, error) => {
                    logger.warn(`[Auth] Tentativa ${attempt} de login falhou. Causa: ${error.message}.`, {
                        requestId,
                        attempt,
                    });
                },
            }
        );

        logger.info('[Auth] Autenticação e extração de cookies bem-sucedidas.', { action: 'auth_success', requestId });
        return cookies; // Retorna os cookies obtidos
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);

        logger.error('[Auth] Extração de cookies falhou após todas as tentativas.', error, {
            action: 'auth_failed',
            requestId,
        });

        // Garante que a última instância do navegador seja fechada em caso de falha final
        if (browserInstance) {
            await closeBrowser(browserInstance);
        }

        throw new AuthenticationError(`Falha de autenticação: ${errorMsg}`, {
            requestId,
            credentials: { username: credentials.username },
        });
    }
}