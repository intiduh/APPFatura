const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { fromPath } = require('pdf2pic');
const { createCanvas, loadImage } = require('canvas');

const exportarProposta = async (dados) => {
  const imagePath = path.join(__dirname, '..', '..', 'public', 'assets', 'Slide-template.png');
  const image = await loadImage(imagePath);

  const canvas = createCanvas(1920, 1080);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(image, 0, 0, 1920, 1080);

  ctx.font = 'bold 38px Arial';
  ctx.fillStyle = '#ffffff';

  // Nome do cliente
  ctx.fillText(`${dados.nomeCliente}`, 142, 140);

  // Valores
  const bill = parseFloat(dados.currentBill);
  const publicCharges = parseFloat(dados.publicLighting);
  const discount = parseFloat(dados.desconto) / 100;
  const base = bill - publicCharges;
  const discounted = base * (1 - discount) + publicCharges;
  const economiaMensal = bill - discounted;
  const economiaAnual = economiaMensal * 12;

  ctx.fillText(`R$ ${bill.toFixed(2)}`, 435, 394);       // Sem a Inti
  ctx.fillText(`R$ ${discounted.toFixed(2)}`, 435, 471);  // Com a Inti
  ctx.fillText(`R$ ${economiaMensal.toFixed(2)}`, 435, 549); // Economia Mensal
  ctx.fillText(`R$ ${economiaAnual.toFixed(2)}`, 435, 627);  // Economia Anual

  // Data automática
  const data = new Date().toLocaleDateString('pt-BR');
  ctx.fillText(`${data}`, 435, 705);

  const buffer = canvas.toBuffer('image/png');

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([1920, 1080]);
  const pngImage = await pdfDoc.embedPng(buffer);
  page.drawImage(pngImage, { x: 0, y: 0, width: 1920, height: 1080 });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};

module.exports = { exportarProposta };
