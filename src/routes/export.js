const express = require('express');
const router = express.Router();
const { exportarProposta } = require('../services/exportService');

router.post('/pdf', async (req, res) => {
  try {
    const buffer = await exportarProposta(req.body);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="proposta.pdf"',
      'Content-Length': buffer.length
    });
    res.send(buffer);
  } catch (error) {
    console.error('Erro ao exportar proposta:', error);
    res.status(500).send('Erro ao gerar PDF');
  }
});

module.exports = router;
