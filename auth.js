import { getLogger, createRequestId } from './logger.js';
import { findSelector } from './parsers.js';
import { initBrowser } from './browser.js'; // Importa a função de inicialização
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
    // Clica no botão de submit e espera por um indicador de que a página mudou (login bem-sucedido).
    // Em vez de esperar por uma navegação completa, que pode ser instável,
    // esperamos que o botão de login original desapareça.
    try {
        logger.debug('[Auth] Formulário enviado. Aguardando navegação e validação de sucesso...');
        // A abordagem correta para um clique que causa navegação.
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 }),
            page.click(submitSelector),
        ]);

        // A validação de sucesso é esperar o botão de login sumir.
        // Usamos `waitForSelector` com a opção `hidden: true`.
        await page.waitForSelector(selectors.loginButton.join(','), { hidden: true, timeout: 25000 });
        logger.debug('[Auth] Botão de login não está mais visível. Login considerado bem-sucedido.');

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

    return { page, cookies }; // Retorna a página e os cookies extraídos
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
    let { url, credentials, cookies, retryAttempts, retryDelayMs, browserConfig } = options;
    const requestId = createRequestId();    

    logger.info('[Auth] Iniciando orquestração de autenticação...', {
        action: 'auth_start',
        requestId,
        retryAttempts,
    });

    try {
        // ETAPA 1: Tentar usar cookies existentes, se disponíveis
        if (cookies && cookies.length > 0) {
            logger.info('[Auth] Tentando validar sessão com cookies existentes...');
            try {
                await page.setCookie(...cookies);
                await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });

                // Valida se o login está ativo verificando se o botão de login NÃO existe.
                await page.waitForSelector(selectors.loginButton.join(','), { hidden: true, timeout: 10000 });

                logger.info('[Auth] Sessão com cookies validada com sucesso.');
                // Salva um screenshot da página logada com cookies para depuração.
                try {
                    const screenshotDir = path.join(process.cwd(), 'debug_screenshots');
                    fs.mkdirSync(screenshotDir, { recursive: true });
                    const screenshotPath = path.join(screenshotDir, `dismatal-cookie-login-success-${Date.now()}.png`);
                    await page.screenshot({ path: screenshotPath, fullPage: true });
                    logger.info(`[Auth] Screenshot de login com cookies bem-sucedido salvo em: ${screenshotPath}`);
                } catch (screenshotError) {
                    logger.error('[Auth] Falha ao capturar screenshot de login com cookies.', screenshotError);
                }
                return { page, cookies }; // Retorna a página e os cookies originais, pois são válidos
            } catch (e) {
                logger.warn(`[Auth] Sessão com cookies falhou ou expirou. Causa: ${e.message}. Prosseguindo para login completo.`);
                // Limpa os cookies inválidos antes de tentar o login completo
                try {
                    const client = await page.target().createCDPSession();
                    await client.send('Network.clearBrowserCookies');
                } catch (clearError) {
                    logger.warn('[Auth] Não foi possível limpar os cookies do navegador. Pode ser que a página já tenha sido fechada.', clearError);
                }
            }
        } else {
            logger.info('[Auth] Nenhum cookie para validar. Prosseguindo para login completo.');
        }

        // ETAPA 2: Se os cookies falharam ou não existem, fazer login completo
        logger.info('[Auth] Executando fluxo de login completo com usuário e senha.');
        const authResult = await withRetry(
            async (attempt) => {
                logger.info(`[Auth] Tentativa de login completo ${attempt}: navegando para a URL.`);
                
                // **LÓGICA DE RECUPERAÇÃO COMPLETA**
                // Se a conexão com o browser caiu, reinicia tudo.
                if (attempt > 1 && (!page.browser() || !page.browser().isConnected())) {
                    logger.warn(`[Auth] Conexão com o navegador perdida. Reiniciando a conexão para a tentativa ${attempt}...`);
                    const newInstance = await initBrowser(browserConfig);
                    page = newInstance.page; // Usa a nova página e o novo browser
                } else if (attempt > 1 || page.isClosed()) {
                    // Se for apenas a página que fechou (ou por precaução), recria só a página.
                    logger.warn(`[Auth] A página está fechada ou é uma nova tentativa. Recriando a página para garantir estabilidade.`);
                    try {
                        // Tenta fechar a página anterior se ela ainda estiver aberta
                        if (!page.isClosed()) {
                            await page.close();
                        }
                    } catch (e) { /* Ignora erros ao fechar uma página já problemática */ }
                    page = await page.browser().newPage();
                }

                await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
                // A função performLogin retorna { page, cookies }
                const result = await performLogin(page, credentials, selectors);
                // Retorna o resultado completo, incluindo a instância da página usada.
                return { ...result, page };
            },
            {
                maxAttempts: retryAttempts,
                delayMs: retryDelayMs,
                onRetry: (attempt, error) => logger.warn(`[Auth] Tentativa ${attempt} de login completo falhou. Causa: ${error.message}.`, { requestId, attempt }),
            }
        );
        
        page = authResult.page; // Garante que a variável `page` externa seja a final
        logger.info('[Auth] Autenticação completa bem-sucedida.', { action: 'auth_success', requestId });
        return authResult; // Retorna { page, cookies }

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