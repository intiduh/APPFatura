const express = require('express');
const router = express.Router();

router.post('/pdf', async (req, res) => {
  try {
    // Remova o código relacionado à exportação de PDF
    res.status(200).send('Função de exportação de PDF removida');
  } catch (error) {
    console.error('Erro ao exportar proposta:', error);
    res.status(500).send('Erro ao gerar PDF');
  }
});

module.exports = router;
