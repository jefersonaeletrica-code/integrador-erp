import { getLogger, createRequestId } from './logger.js';
import { findSelector } from '../scrapers/parsers.js';
import { initBrowser } from './browser.js'; // Importa a função de inicialização
import ora from 'ora';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

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
    const { maxAttempts = 3, delayMs = 1000, onRetry, context = {} } = options;
    let attempt = 1;
    let lastError = null;
    while (attempt <= maxAttempts) {
        try {
            // Passa o contexto para a função a ser executada
            return await fn(attempt, lastError, context);
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
const DEFAULT_LOGIN_SELECTORS = {
    loginButton: ['p.login-btn__hello', 'a.login-btn', '#drawer-header-btn', '[data-testid="login-btn"]', 'button.btn-login'],
    usernameInput: ['input[formcontrolname="usuario"]', 'input[placeholder="CNPJ"]', 'input[name="usuario"]'],
    passwordInput: ['input[formcontrolname="senha"]', 'input[placeholder="Senha"]', 'input[type="password"]'],
    submitButton: ['button.btn-login', 'button[type="submit"]'],
    loginModal: ['[role="dialog"]', '.modal', '.login-modal'],
    logoutLink: ['a[href*="sair"]', '[data-testid="logout"]'],
    cookieAcceptButton: ['button[data-test="COOKIE-POPUP-CLOSE-BTN"]', '.cookie-popup__button', '#onetrust-accept-btn-handler'],
    welcomeModalCloseButton: ['button.welcome-modal__bottom-button', 'button.welcome-modal-close-button', 'button:has-text("Continuar e fechar")', 'button[aria-label*="Fechar"]', '.modal-close'],
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
    // Clica no botão de submit e espera por um indicador de que a página mudou (login bem-sucedido).
    // Em vez de esperar por uma navegação completa, que pode ser instável,
    // esperamos que o botão de login original desapareça.
    try {
        logger.debug('[Auth] Formulário enviado. Aguardando navegação e validação de sucesso...');
        // A abordagem mais robusta para um clique que causa navegação.
        // Executa o clique e espera a navegação resultante ao mesmo tempo.
        await Promise.all([
            page.click(submitSelector),
            page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 120000 }),
        ]);

        // Após a navegação, a nova página está carregada. Agora podemos validar o sucesso.
        logger.debug('[Auth] Navegação pós-login concluída. Login considerado bem-sucedido.');

        // Salva um screenshot da página logada para depuração.
        try {
            const screenshotDir = path.join(process.cwd(), 'debug_screenshots');
            fs.mkdirSync(screenshotDir, { recursive: true });
            const screenshotPath = path.join(screenshotDir, `dismatal-login-success-${Date.now()}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: true });
            logger.info(`[Auth] Screenshot de login bem-sucedido salvo em: ${screenshotPath}`);
        } catch (screenshotError) {
            logger.error('[Auth] Falha ao capturar screenshot de sucesso.', screenshotError);
        }

    } catch (e) {
        throw new Error(`Validação de login falhou. O login pode não ter sido bem-sucedido ou a página demorou para responder. Causa: ${e.message}`);
    }
    logger.debug('[Auth] Validação de login bem-sucedida.');

    // PASSO 5: Extrair cookies
    logger.debug('[Auth] Extraindo cookies de sessão...');
    const sessionData = await page.evaluate(() => {
        const localStorageData = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            localStorageData[key] = localStorage.getItem(key);
        }
        // sessionStorage é mais difícil de extrair de forma genérica,
        // mas o localStorage geralmente contém os tokens persistentes.
        return { localStorage: localStorageData };
    });

    sessionData.cookies = await page.cookies();

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

    return { page, sessionData }; // Retorna a página e os dados completos da sessão
}

/**
 * Tenta autenticar usando dados de sessão (cookies, localStorage).
 * @param {import('puppeteer').Page} page
 * @param {string} url
 * @param {object} sessionData
 * @param {object} selectors
 * @returns {Promise<{page: import('puppeteer').Page, sessionData: object}>}
 */
export async function tryCookieAuth(page, url, sessionData, selectors) {
    const spinner = ora(chalk.cyan('[Auth] Validando sessão com cookies...')).start();
    const logger = getLogger();

    // O requestHandler deve ser definido fora do try/finally para que o page.off funcione
    const requestHandler = (req) => {
        if (req.isInterceptResolutionHandled()) return;
        const resourceType = req.resourceType();
        if (['image', 'font', 'media'].includes(resourceType)) {
            req.abort();
        } else {
            req.continue();
        }
    };

    try {
        if (!sessionData || !sessionData.cookies || sessionData.cookies.length === 0) {
            spinner.warn(chalk.yellow('[Auth] Nenhum dado de sessão encontrado.'));
            throw new Error("Nenhum dado de sessão fornecido para validação.");
        }

        // OTIMIZAÇÃO: Bloqueia recursos desnecessários para acelerar a validação.
        await page.setRequestInterception(true);
        page.on('request', requestHandler);

        // More robust session restoration logic:
        // 1. Go to a blank page to ensure we have a clean context
        // before setting cookies for a specific domain.
        await page.goto('about:blank');

        // 2. Set cookies for the target domain.
        await page.setCookie(...sessionData.cookies);

        // 3. Now, navigate to the URL. The browser will send the cookies with the request.
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });

        // 4. After the page loads with the cookie-based session, restore localStorage.
        if (sessionData.localStorage) {
            await page.evaluate(savedLocalStorage => {
                for (const key in savedLocalStorage) {
                    localStorage.setItem(key, savedLocalStorage[key]);
                }
            }, sessionData.localStorage);
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 }); // Reload for the JS to pick up localStorage
    }

    // Salva um screenshot da página após tentar restaurar a sessão para depuração.
    try {
        const screenshotDir = path.join(process.cwd(), 'debug_screenshots');
        fs.mkdirSync(screenshotDir, { recursive: true });
        const screenshotPath = path.join(screenshotDir, `dismatal-cookie-validation-attempt-${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        logger.info(`[Auth] Screenshot da tentativa de validação com cookies salvo em: ${screenshotPath}`);
    } catch (screenshotError) {
        logger.error('[Auth] Falha ao capturar screenshot da validação com cookies.', screenshotError);
    }

    // Validação definitiva: Se o login com cookies funcionou, um elemento de saudação
    // (como "Olá, [Nome]") deve estar visível.
    logger.debug('[Auth] Verificando se o indicador de usuário logado está visível...');
    await page.waitForSelector(selectors.loginButton.join(','), { visible: true, timeout: 15000 });
    
    spinner.succeed(chalk.green('[Auth] Sessão com cookies validada com sucesso.'));
    return { page, sessionData }; // Retorna a página e os dados de sessão originais, pois são válidos
    } catch (error) {
        spinner.fail(chalk.yellow(`[Auth] Validação de sessão com cookies falhou: ${error.message}`));
        throw error; // Re-lança o erro para que o fluxo de login completo seja acionado
    } finally {
        // Desativa a interceptação após a conclusão, seja sucesso ou falha.
        page.off('request', requestHandler);
        if (!page.isClosed()) await page.setRequestInterception(false);
    }
}

/**
 * Executa o fluxo de login completo com usuário e senha, com retentativas.
 * @param {import('puppeteer').Page} page
 * @param {object} options
 * @param {object} selectors
 * @returns {Promise<{page: import('puppeteer').Page, sessionData: object}>}
 */
export async function tryPasswordLogin(page, options, selectors) {
    const spinner = ora(chalk.cyan('[Auth] Iniciando login com usuário e senha...')).start();
    const logger = getLogger();
    const { url, credentials, retryAttempts, retryDelayMs, browserConfig, requestId } = options;

    const authResult = await withRetry(
        async (attempt) => {
            spinner.text = chalk.cyan(`[Auth] Tentativa de login ${attempt}/${retryAttempts}...`);
            logger.info(`[Auth] Tentativa de login completo ${attempt}: navegando para a URL.`);

            // **LÓGICA DE RECUPERAÇÃO COMPLETA**
            // Se a página foi fechada (por erro ou desconexão), reinicia tudo.
            if (attempt > 1 && page.isClosed()) {
                logger.warn(`[Auth] A página está fechada. Reiniciando a conexão do navegador para a tentativa ${attempt}...`);
                const newInstance = await initBrowser(browserConfig);
                page = newInstance.page; // Usa a nova página e o novo browser
            }

            // Otimização de Performance: Bloqueia recursos desnecessários durante o login
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                if (req.isInterceptResolutionHandled()) return;
                const resourceType = req.resourceType();
                if (['image', 'font', 'media'].includes(resourceType)) {
                    req.abort();
                } else {
                    req.continue();
                }
            });
            // Desativa o cache para garantir que o fluxo de login não use dados antigos
            await page.setCacheEnabled(false);

            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
            // A função performLogin retorna { page, sessionData }
            const result = await performLogin(page, credentials, selectors);
            // Retorna o resultado completo, incluindo a instância da página usada.
            return { ...result, page };
        },
        {
            maxAttempts: retryAttempts,
            delayMs: retryDelayMs,
            onRetry: (attempt, error) => spinner.text = chalk.yellow(`[Auth] Tentativa ${attempt} falhou. Retentando... Causa: ${error.message}`),
        }
    );
    
    page = authResult.page; // Garante que a variável `page` externa seja a final
    spinner.succeed(chalk.green('[Auth] Autenticação com senha bem-sucedida!'));
    return authResult;
}

/**
 * Orquestra a autenticação com retentativas.
 * @param {import('puppeteer').Page} page - A página do Puppeteer para executar o login.
 * @param {object} options
 * @returns {Promise<boolean>}
 * @returns {Promise<import('puppeteer').Page>} A instância da página autenticada.
 */
export async function authenticate(page, options, selectors = DEFAULT_LOGIN_SELECTORS) {
    const logger = getLogger();
    let { url, credentials, sessionData, retryAttempts, retryDelayMs, browserConfig } = options;
    const requestId = createRequestId();    

    logger.info('[Auth] Iniciando orquestração de autenticação...', {
        action: 'auth_start',
        requestId,
        retryAttempts,
    });

    try {
        // ETAPA 1: Tentar usar cookies existentes, se disponíveis
        if (sessionData && sessionData.cookies && sessionData.cookies.length > 0) {
            try {
                return await tryCookieAuth(page, url, sessionData, selectors);
            } catch (e) {
                logger.warn(`[Auth] Sessão com cookies inválida. Prosseguindo para login completo.`);
                try {
                    const client = await page.target().createCDPSession();
                    await client.send('Network.clearBrowserCookies');
                } catch (clearError) {
                    logger.warn('[Auth] Não foi possível limpar os cookies do navegador. Pode ser que a página já tenha sido fechada.', clearError);
                }
            }
        } else {
            logger.info('[Auth] Nenhum dado de sessão para validar. Prosseguindo para login completo.');
        }

        // ETAPA 2: Se os cookies falharam ou não existem, fazer login completo.
        return await tryPasswordLogin(page, { url, credentials, retryAttempts, retryDelayMs, browserConfig, requestId }, selectors);

    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error('[Auth] Orquestração de autenticação falhou após todas as tentativas.', error, {
            action: 'auth_failed',
            requestId,
        });
        throw new AuthenticationError(`Falha de autenticação: ${errorMsg}`, {
            requestId,
            credentials: { username: credentials.username },
        });
    }
}