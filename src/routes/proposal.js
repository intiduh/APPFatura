const express = require('express');
const axios = require('axios');
const gerarPropostaPDF = require('../utils/generateProposal');
const router = express.Router();

router.get('/distribuidoras', async (req, res) => {
  const sql = `
    SELECT DISTINCT "SigAgente"
    FROM "fcf2906c-7c32-4b9b-a637-054e7a5234f4"
    ORDER BY "SigAgente"
  `;
  const encodedSql = encodeURIComponent(sql);
  const url = `https://dadosabertos.aneel.gov.br/api/3/action/datastore_search_sql?sql=${encodedSql}`;
  try {
    const response = await axios.get(url);
    const nomes = response.data.result.records.map(r => r.SigAgente);
    res.json(nomes);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao buscar distribuidoras');
  }
});

router.post('/', async (req, res) => {
  const { distribuidora, grupo, currentBill, publicLighting, desconto, email } = req.body;

  const resourceId = 'fcf2906c-7c32-4b9b-a637-054e7a5234f4';
  const sql = `
    SELECT * FROM "${resourceId}" 
    WHERE "SigAgente" = '${distribuidora}' 
    AND "CodGrupoTarifario" = '${grupo}'
    ORDER BY "DatInicioVigencia" DESC 
    LIMIT 1
  `;
  const encodedSql = encodeURIComponent(sql);
  const url = `https://dadosabertos.aneel.gov.br/api/3/action/datastore_search_sql?sql=${encodedSql}`;

  try {
    const response = await axios.get(url);
    const record = response.data.result.records[0];
    const tarifa = parseFloat(record.VlTarifa || 0);

    const parteComercial = currentBill - publicLighting;
    const valorComDesconto = parteComercial * (1 - desconto / 100);
    const valorFinal = valorComDesconto + publicLighting;
    const economiaMensal = currentBill - valorFinal;
    const economiaAnual = economiaMensal * 12;
    const consumo = tarifa > 0 ? parteComercial / tarifa : 0;
    const precoMedio = consumo > 0 ? valorComDesconto / consumo : 0;

    const proposta = {
      distribuidora,
      grupo,
      tarifa: tarifa.toFixed(4),
      consumo: consumo.toFixed(2),
      valorOriginal: currentBill.toFixed(2),
      valorIluminacao: publicLighting.toFixed(2),
      valorEnergia: parteComercial.toFixed(2),
      descontoAplicado: (parteComercial * desconto / 100).toFixed(2),
      valorComDesconto: valorFinal.toFixed(2),
      precoMedio: precoMedio.toFixed(4),
      economiaAnual: economiaAnual.toFixed(2),
      email
    };

    await gerarPropostaPDF({
      nomeCliente: email.split('@')[0], // ou outro campo se quiser o nome
      currentBill,
      discountedBill: valorComDesconto,
      monthlySavings: economiaMensal,
      annualSavings: economiaAnual
    });

    res.json(proposta);
  } catch (error) {
    console.error('Erro ao consultar a API da ANEEL:', error.message);
    res.status(500).send('Erro ao gerar a proposta');
  }
});

module.exports = router;
