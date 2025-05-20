const express = require('express');
const cors = require('cors');
const app = express();

const propostaRoutes = require('./routes/proposal');
const exportRoutes = require('./routes/export');

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use('/proposal', propostaRoutes);
app.use('/exportar', exportRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
