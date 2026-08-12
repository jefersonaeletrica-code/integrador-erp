const express = require('express');
const productService = require('../services/productService');

const router = express.Router();

module.exports = (db) => {
    router.get('/produtos-importados', (req, res) => {
        res.json({ sucesso: true, produtos: productService.produtosImportados });
    });

    router.post('/produtos-importados', (req, res) => {
        const produtosParaSalvar = Array.isArray(req.body.produtos) ? req.body.produtos : [];
        productService.saveProdutosImportados(produtosParaSalvar, db);
        res.json({ sucesso: true, mensagem: 'Produtos importados salvos com sucesso!' });
    });

    return router;
};