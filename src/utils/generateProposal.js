const fs = require("fs");
const path = require("path");
const { PDFDocument, rgb } = require("pdf-lib");
const { createCanvas, loadImage } = require("canvas");

async function generateProposalPdf({ cliente, semInti, comInti, economiaMes, economiaAno }) {
  const templatePath = path.join(__dirname, "../../public/assets/Slide-template.png");
  const outputPath = path.join(__dirname, "../../public/assets/proposta-final.pdf");

  const imageBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([1240, 3508]); // Tamanho vertical da imagem original (em px)

  const pngImage = await pdfDoc.embedPng(imageBytes);
  page.drawImage(pngImage, {
    x: 0,
    y: 0,
    width: 1240,
    height: 3508,
  });

  const fontSize = 38;
  const fontColor = rgb(0, 0, 0); // preto

  const drawText = (text, x, y) => {
    page.drawText(text, {
      x,
      y,
      size: fontSize,
      color: fontColor,
    });
  };

  drawText(cliente, 80, 3275); // Nome do cliente
  drawText(`R$ ${semInti}`, 180, 2955); // Sem a Inti
  drawText(`R$ ${comInti}`, 460, 2955); // Com a Inti
  drawText(`R$ ${economiaMes}`, 380, 2640); // Economia mês
  drawText(`R$ ${economiaAno}`, 380, 2550); // Economia ano
  drawText("Válida por 10 dias corridos", 440, 210); // Validade

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
  return outputPath;
}

module.exports = generateProposalPdf;
