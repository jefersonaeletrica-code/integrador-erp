import express from 'express';
import * as productService from './productService.js';

const router = express.Router();

export default (db) => {
    router.get('/produtos-importados', (req, res) => {
        res.json({ sucesso: true, produtos: productService.produtosImportados });
    });

    router.post('/produtos-importados', (req, res) => {
        const produtosParaSalvar = Array.isArray(req.body.produtos) ? req.body.produtos : [];
        productService.saveProdutosImportados(produtosParaSalvar, db); // A função saveProdutosImportados já atualiza o estado local
        res.json({ sucesso: true, mensagem: 'Produtos importados salvos com sucesso!' });
    });

    return router;
};