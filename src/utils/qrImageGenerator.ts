import QRCode from 'qrcode';
import { InventoryItem } from '@/types/inventory';

/**
 * Helper to draw a rounded rectangle on Canvas 2D
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Helper to wrap text into multiple lines for Canvas
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 2
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      lines.push(currentLine);
      currentLine = words[i];
      if (lines.length >= maxLines) {
        break;
      }
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Generates and downloads a complete, high-resolution Label Card Image (PNG)
 * containing header, QR code, detailed inventory metadata, and official footer.
 */
export async function downloadSingleQRImage(
  item: Partial<InventoryItem> & { inventoryCode: string },
  filename?: string
): Promise<void> {
  const baseUrl = window.location.origin;
  const targetUrl = item.qrUrl || `${baseUrl}/item/${item.inventoryCode}`;
  const resolvedFilename = filename || `Label_QR_${item.inventoryCode}.png`;

  // 1. Generate high quality QR code data URL (400x400 px)
  const qrDataUrl = await QRCode.toDataURL(targetUrl, {
    width: 400,
    margin: 1,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });

  // Load QR image into Image object
  const qrImg = new Image();
  await new Promise<void>((resolve, reject) => {
    qrImg.onload = () => resolve();
    qrImg.onerror = (err) => reject(err);
    qrImg.src = qrDataUrl;
  });

  // 2. Setup Canvas with Hi-DPI Crisp Dimensions
  const width = 860;
  const height = 520;
  const cardX = 12;
  const cardY = 12;
  const cardW = width - 24;
  const cardH = height - 24;
  const cardRadius = 22;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context is not supported in this browser.');

  // Enable crisp text rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 3. Draw Card Base Background
  ctx.save();
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.clip();

  // 4. Header Bar (Navy Header: #1e3a8a)
  const headerHeight = 58;
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(cardX, cardY, cardW, headerHeight);

  // Header Left: "SESPIMMA LEMDIKLAT POLRI"
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px "Segoe UI", Roboto, Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('SESPIMMA LEMDIKLAT POLRI', cardX + 24, cardY + headerHeight / 2);

  // Header Right: "ASET LOGISTIK"
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = '600 15px "Segoe UI", Roboto, Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('ASET LOGISTIK', cardX + cardW - 24, cardY + headerHeight / 2);

  // 5. Left Box (QR Code Preview Box)
  const qrBoxX = cardX + 22;
  const qrBoxY = cardY + headerHeight + 20;
  const qrBoxW = 270;
  const qrBoxH = 345;
  const qrBoxRadius = 14;

  drawRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxW, qrBoxH, qrBoxRadius);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Draw QR Image (centered inside qrBox)
  const qrSize = 224;
  const qrPosX = qrBoxX + (qrBoxW - qrSize) / 2;
  const qrPosY = qrBoxY + 22;
  ctx.drawImage(qrImg, qrPosX, qrPosY, qrSize, qrSize);

  // Text under QR Code: "SCAN UNTUK DETAIL"
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 13.5px "Segoe UI", Roboto, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SCAN UNTUK DETAIL', qrBoxX + qrBoxW / 2, qrPosY + qrSize + 32);

  // 6. Right Column: Inventory Metadata
  const infoX = qrBoxX + qrBoxW + 28;
  let currentY = cardY + headerHeight + 36;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Kode Inventaris
  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 28px "Consolas", "Courier New", monospace';
  ctx.fillText(item.inventoryCode || '-', infoX, currentY);
  currentY += 40;

  // Nama Barang
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 23px "Segoe UI", Roboto, Arial, sans-serif';
  const nameLines = wrapText(ctx, item.name || '-', 470, 2);
  for (const line of nameLines) {
    ctx.fillText(line, infoX, currentY);
    currentY += 30;
  }
  currentY += 4;

  // Merk & Model
  if (item.brand || item.model) {
    ctx.fillStyle = '#475569';
    ctx.font = '500 18px "Segoe UI", Roboto, Arial, sans-serif';
    const brandText = `${item.brand || ''} ${item.model ? `(${item.model})` : ''}`.trim();
    ctx.fillText(brandText, infoX, currentY);
    currentY += 30;
  }

  // Kategori
  const catLabel = 'Kat: ';
  ctx.font = 'normal 17.5px "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(catLabel, infoX, currentY);
  const catLabelWidth = ctx.measureText(catLabel).width;
  ctx.font = 'bold 17.5px "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#1e293b';
  const catName = item.categoryNameSnapshot || item.categoryId || '-';
  ctx.fillText(catName, infoX + catLabelWidth, currentY);
  currentY += 28;

  // Lokasi
  const locLabel = 'Lok: ';
  ctx.font = 'normal 17.5px "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(locLabel, infoX, currentY);
  const locLabelWidth = ctx.measureText(locLabel).width;
  ctx.font = 'bold 17.5px "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#1e293b';
  const buildingText = item.building || 'Gedung Utama Sespimma';
  const roomText = item.room ? ` (${item.room})` : '';
  ctx.fillText(`${buildingText}${roomText}`, infoX + locLabelWidth, currentY);
  currentY += 28;

  // Kondisi
  const condLabel = 'Kondisi: ';
  ctx.font = 'normal 17.5px "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(condLabel, infoX, currentY);
  const condLabelWidth = ctx.measureText(condLabel).width;
  ctx.font = 'bold 17.5px "Segoe UI", Roboto, Arial, sans-serif';
  if (item.condition === 'Baik') {
    ctx.fillStyle = '#15803d'; // Green
  } else if (item.condition === 'Rusak Ringan') {
    ctx.fillStyle = '#b45309'; // Amber
  } else {
    ctx.fillStyle = '#b91c1c'; // Red
  }
  ctx.fillText(item.condition || 'Baik', infoX + condLabelWidth, currentY);

  // 7. Footer Notice Strip
  const footerHeight = 44;
  const footerY = cardY + cardH - footerHeight;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(cardX, footerY, cardW, footerHeight);

  // Divider Line above footer
  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cardX, footerY);
  ctx.lineTo(cardX + cardW, footerY);
  ctx.stroke();

  // Footer Text
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'italic 600 13.5px "Segoe UI", Roboto, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    'BARANG MILIK NEGARA - DILARANG MEMINDAHTANGANKAN TANPA IZIN',
    cardX + cardW / 2,
    footerY + footerHeight / 2
  );

  ctx.restore();

  // 8. Outer Card Border
  ctx.save();
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = 3.5;
  ctx.stroke();
  ctx.restore();

  // 9. Download Data URL as PNG Image
  const finalPngUrl = canvas.toDataURL('image/png', 1.0);
  const link = document.createElement('a');
  link.href = finalPngUrl;
  link.download = resolvedFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
