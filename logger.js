import crypto from 'crypto';

let loggerInstance;

const getTimestamp = () => new Date().toISOString();

const log = (level, message, context = {}) => {
    const logEntry = {
        level,
        timestamp: getTimestamp(),
        message,
        ...context,
    };
    console.log(JSON.stringify(logEntry));
};

const logger = {
    info: (message, context) => log('INFO', message, context),
    warn: (message, context) => log('WARN', message, context),
    error: (message, error, context) => {
        const errorContext = {
            ...context,
            errorMessage: error.message,
            stack: error.stack,
        };
        log('ERROR', message, errorContext);
    },
    debug: (message, context) => {
        if (process.env.LOG_LEVEL === 'debug') {
            log('DEBUG', message, context);
        }
    },
};

export const initLogger = () => {
    if (!loggerInstance) loggerInstance = logger;
    return loggerInstance;
};

export const getLogger = () => {
    if (!loggerInstance) return initLogger();
    return loggerInstance;
};

export const createRequestId = () => crypto.randomBytes(8).toString('hex');