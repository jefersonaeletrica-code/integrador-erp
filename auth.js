import { getLogger, createRequestId } from './logger.js';
import { findSelector } from './parsers.js';

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
    loginButton: ['a.login-btn', '#drawer-header-btn', '[data-testid="login-btn"]', 'button.btn-login'],
    usernameInput: ['input[formcontrolname="usuario"]', 'input[name="usuario"]', 'input[placeholder*="Usuário"]'],
    passwordInput: ['input[formcontrolname="senha"]', 'input[name="senha"]', 'input[type="password"]'],
    submitButton: ['button.btn-login', 'button[type="submit"]'],
    loginModal: ['[role="dialog"]', '.modal', '.login-modal'],
    logoutLink: ['a[href*="sair"]', '[data-testid="logout"]'],
    cookieAcceptButton: ['button[data-test="COOKIE-POPUP-CLOSE-BTN"]', '.cookie-popup__button'],
};

/**
 * Executa o fluxo de login.
 */
async function performLogin(page, credentials, selectors) {
    const logger = getLogger();

    // 1. Fechar pop-up de cookies, se existir
    try {
        const cookieBtnSelector = await findSelector(page, selectors.cookieAcceptButton);
        if (cookieBtnSelector) {
            logger.debug('[Auth] Fechando pop-up de cookies.');
            await page.click(cookieBtnSelector);
            await new Promise(resolve => setTimeout(resolve, 1500)); // Espera para estabilizar
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

    // 3. Aguardar o modal de login e preencher os campos
    const modalSelector = await findSelector(page, selectors.loginModal);
    if (!modalSelector) {
        throw new Error('Modal de login não apareceu.');
    }
    logger.debug('[Auth] Modal de login visível.');

    const usernameSelector = await findSelector(page, selectors.usernameInput);
    if (!usernameSelector) throw new Error('Input de usuário não encontrado no modal.');

    const passwordSelector = await findSelector(page, selectors.passwordInput);
    if (!passwordSelector) throw new Error('Input de senha não encontrado no modal.');

    logger.debug('[Auth] Preenchendo credenciais...');
    await page.type(usernameSelector, credentials.username);
    await page.type(passwordSelector, credentials.password);

    // 4. Clicar no botão de submit e aguardar a navegação
    const submitSelector = await findSelector(page, selectors.submitButton);
    if (!submitSelector) throw new Error('Botão de submit não encontrado no modal.');

    logger.debug('[Auth] Submetendo formulário de login...');
    await page.click(submitSelector);

    // Abordagem híbrida: espera por uma navegação OU por um indicador de sucesso/erro.
    // Isso lida tanto com SPAs quanto com redirecionamentos tradicionais, e evita timeouts de inatividade.
    try {
        logger.debug('[Auth] Aguardando resultado do login (sucesso ou erro)...');
        const abortController = new AbortController();
        const signal = abortController.signal;
        const errorSelector = '.message-label.error'; // Seletor para mensagens de erro no modal

        const result = await Promise.race([
            page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000, signal }).then(() => 'navigation'),
            page.waitForSelector(selectors.logoutLink.join(', '), { visible: true, timeout: 25000, signal }).then(() => 'success'),
            page.waitForSelector(errorSelector, { visible: true, timeout: 25000, signal }).then(async () => {
                const errorMessage = await page.$eval(errorSelector, el => el.innerText);
                return `error: ${errorMessage}`;
            }),
        ]);

        abortController.abort(); // Cancela todas as outras esperas pendentes de forma limpa.

        if (result.startsWith('error')) {
            throw new Error(`Erro de login retornado pelo site: ${result.replace('error: ', '')}`);
        }
        logger.debug(`[Auth] Login processado com resultado: ${result}. Verificando estado final...`);
    } catch (e) {
        throw new Error(`Login falhou. Nenhum indicador de sucesso ou erro conhecido apareceu. Causa: ${e.message}`);
    }
    logger.debug('[Auth] Validação de login bem-sucedida.');

    // Adiciona uma pausa extra para garantir que qualquer script pós-login (ex: tracking, modais) seja carregado.
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 6. Fechar modal de boas-vindas (se houver)
    try {
        const closeModalSelectors = [
            'button:has-text("Continuar e fechar")',
            'button[aria-label*="Fechar"]',
            '.modal-close',
        ];
        const closeModalSelector = await findSelector(page, closeModalSelectors);
        if (closeModalSelector) {
            logger.debug('[Auth] Fechando modal de boas-vindas.');
            await page.click(closeModalSelector);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    } catch (e) {
        logger.debug('[Auth] Nenhum modal de boas-vindas encontrado.');
    }
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

    let browserInstance = null;
    const { initBrowser, closeBrowser } = await import('./browser.js');

    try {
        const { initBrowser, closeBrowser } = await import('./browser.js');

        browserInstance = await withRetry(
            async (attempt, lastError) => {
                // Se houve um erro anterior, fecha a instância antiga antes de criar uma nova.
                if (attempt > 1 && browserInstance) {
                    logger.info('[Auth] Fechando instância de navegador anterior para retentativa.');
                    await closeBrowser(browserInstance);
                }

                logger.info(`[Auth] Tentativa ${attempt}: inicializando navegador.`);
                const instance = await initBrowser(browserConfig);
                const { page } = instance;

                await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
                await performLogin(page, credentials, selectors);

                logger.info('[Auth] Extraindo cookies de sessão...');
                const cookies = await page.cookies();

                await closeBrowser(instance); // Fecha o navegador de autenticação
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
        return browserInstance; // Agora contém os cookies
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);

        logger.error('[Auth] Extração de cookies falhou após todas as tentativas.', error, {
            action: 'auth_failed',
            requestId,
        });

        throw new AuthenticationError(`Falha de autenticação: ${errorMsg}`, {
            requestId,
            credentials: { username: credentials.username },
        });
    }
}