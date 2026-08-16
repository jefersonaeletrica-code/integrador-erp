import { getLogger, createRequestId } from './logger.js';

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
    while (attempt <= maxAttempts) {
        try {
            return await fn();
        } catch (error) {
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
 * Encontra o primeiro seletor visível de uma lista.
 */
async function findSelector(page, selectors) {
    for (const selector of selectors) {
        try {
            await page.waitForSelector(selector, { visible: true, timeout: 3000 });
            return selector;
        } catch (e) {
            // Continua para o próximo seletor
        }
    }
    return null;
}

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
            await page.waitForTimeout(1500); // Espera para estabilizar
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
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 20000 }),
        page.click(submitSelector),
    ]);

    // 5. Validar se o login foi bem-sucedido
    const logoutSelector = await findSelector(page, selectors.logoutLink);
    if (!logoutSelector) {
        const pageContent = await page.content();
        if (pageContent.includes('usuário ou senha inválidos')) {
            throw new Error('Credenciais inválidas.');
        }
        throw new Error('Login falhou. Indicador de sucesso (botão de logout) não encontrado após o login.');
    }
    logger.debug('[Auth] Validação de login bem-sucedida.');

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
            await page.waitForTimeout(1000);
        }
    } catch (e) {
        logger.debug('[Auth] Nenhum modal de boas-vindas encontrado.');
    }
}

/**
 * Orquestra a autenticação com retentativas.
 * @param {import('puppeteer').Browser} browser - A instância do browser.
 * @param {import('puppeteer').Page} initialPage - A página inicial (pode ser substituída em retentativas).
 * @param {object} options
 * @param {string} options.url - A URL base para a qual retornar em caso de redirecionamento.
 * @param {object} options.credentials
 * @param {number} options.retryAttempts
 * @param {number} options.retryDelayMs
 * @param {object} [selectors]
 * @returns {Promise<{success: boolean, timestamp: Date, page: import('puppeteer').Page}>}
 */
export async function authenticate(browser, initialPage, options, selectors = DEFAULT_LOGIN_SELECTORS) {
    const logger = getLogger();
    const requestId = createRequestId();
    const { url, credentials, retryAttempts, retryDelayMs } = options;

    logger.info('[Auth] Iniciando autenticação...', {
        action: 'auth_start',
        requestId,
        retryAttempts,
    });

    let page = initialPage;

    try {
        await withRetry(
            async () => {
                // Garante que a página esteja aberta e válida para a tentativa.
                if (!page || page.isClosed()) {
                    logger.debug('[Auth] A página está fechada. Criando uma nova página para a retentativa.');
                    page = await browser.newPage();
                    await page.setViewport({ width: 1280, height: 800 });
                }
                // Garante que cada tentativa comece da página inicial para um estado limpo.
                await page.goto(url, { waitUntil: 'networkidle0', timeout: 20000 });
                await performLogin(page, credentials, selectors);
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

        logger.info('[Auth] Autenticação bem-sucedida.', {
            action: 'auth_success',
            requestId,
        });

        return {
            success: true,
            timestamp: new Date(),
            page, // Retorna a página potencialmente nova
        };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);

        logger.error('[Auth] Autenticação falhou após todas as tentativas.', error, {
            action: 'auth_failed',
            requestId,
        });

        throw new AuthenticationError(`Falha de autenticação: ${errorMsg}`, {
            requestId,
            credentials: { username: credentials.username },
        });
    }
}