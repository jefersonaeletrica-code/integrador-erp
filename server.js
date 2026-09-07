import('./src/server.js').catch(err => {
    console.error('Erro fatal ao iniciar servidor:', err);
    process.exit(1);
});
