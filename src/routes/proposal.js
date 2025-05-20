const express = require('express');
const axios = require('axios');
const router = express.Router();

const reservasMinimas = {
  monofasico: 30,
  bifasico: 50,
  trifasico: 100
};

const valoresBandeiras = {
  verde: 0,
  amarela: 0.01885,
  vermelha1: 0.04463,
  vermelha2: 0.07877
};

const descontosBandeiras = {
  verde: 10,
  amarela: 12,
  vermelha1: 15,
  vermelha2: 20
};

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
  const {
    distribuidora,
    grupo,
    currentBill,
    publicLighting,
    desconto,
    email,
    tipoLigacao,
    bandeira,
    valorKwh,
    nomeCliente
  } = req.body;

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

    const consumoMinimo = reservasMinimas[tipoLigacao] || 0;
    const valorReserva = consumoMinimo * valorKwh;
    const parteComercialBruta = currentBill - publicLighting;
    const parteComercial = Math.max(parteComercialBruta - valorReserva, 0);
    const valorComDesconto = parteComercial * (1 - desconto / 100);
    const valorFinal = valorComDesconto + publicLighting;
    const economiaMensal = currentBill - valorFinal;
    const economiaAnual = economiaMensal * 12;
    const consumo = tarifa > 0 ? parteComercial / tarifa : 0;
    const precoMedio = consumo > 0 ? valorComDesconto / consumo : 0;

    const calcDescontoBandeira = (b) => {
      const acrescimo = valoresBandeiras[b] * parteComercialBruta;
      return acrescimo * (descontosBandeiras[b] / 100);
    };

    const proposta = {
      distribuidora,
      grupo,
      tarifa: tarifa.toFixed(4),
      consumo: consumo.toFixed(2),
      valorOriginal: currentBill.toFixed(2),
      valorIluminacao: publicLighting.toFixed(2),
      valorEnergia: parteComercial.toFixed(2),
      valorReserva: valorReserva.toFixed(2),
      descontoAplicado: (parteComercial * desconto / 100).toFixed(2),
      valorComDesconto: valorFinal.toFixed(2),
      precoMedio: precoMedio.toFixed(4),
      economiaAnual: economiaAnual.toFixed(2),
      tipoLigacao,
      bandeira,
      percentualDescontoVerde: descontosBandeiras.verde,
      valorDescontoVerde: calcDescontoBandeira('verde').toFixed(2),
      percentualDescontoAmarela: descontosBandeiras.amarela,
      valorDescontoAmarela: calcDescontoBandeira('amarela').toFixed(2),
      percentualDescontoVermelha1: descontosBandeiras.vermelha1,
      valorDescontoVermelha1: calcDescontoBandeira('vermelha1').toFixed(2),
      percentualDescontoVermelha2: descontosBandeiras.vermelha2,
      valorDescontoVermelha2: calcDescontoBandeira('vermelha2').toFixed(2),
      email,
      nomeCliente,
      data_proposta: new Date().toLocaleDateString("pt-BR")
    };

    // Envio para Make
    const webhookURL = 'https://hook.us2.make.com/kl5n1t0om7ogrfhak8ockoy44b1yalwe';
    await axios.post(webhookURL, proposta);

    res.json(proposta);
  } catch (error) {
    console.error('Erro ao consultar a API da ANEEL ou enviar ao Make:', error.message);
    res.status(500).send('Erro ao gerar a proposta');
  }
});

module.exports = router;
