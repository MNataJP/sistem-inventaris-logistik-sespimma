import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { InventoryItem } from '@/types/inventory';

/**
 * Menghasilkan dan mengunduh file PDF label QR Code kolektif untuk kertas A4
 * Format: 1 baris berisi 3 label QR Code (3 kolom per baris)
 */
export async function generateQRLabelsPDF(items: InventoryItem[], filename = 'Label_QR_Inventaris_Sespimma.pdf') {
  if (!items || items.length === 0) {
    alert('Tidak ada data barang yang dipilih untuk dicetak labelnya.');
    return;
  }

  // Inisialisasi dokumen jsPDF ukuran A4 (portrait, satuan mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Konfigurasi Grid A4: 3 Kolom x 7 Baris = 21 label per halaman A4
  const marginLeft = 7;
  const marginTop = 10;
  const cardWidth = 63;
  const cardHeight = 35.5;
  const colGap = 3.5;
  const rowGap = 3.5;

  const cols = 3; // 1 baris berisi 3 QR Code
  const rowsPerPage = 7;
  const itemsPerPage = cols * rowsPerPage;

  const baseUrl = window.location.origin;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Buat halaman baru jika melewati batas per halaman
    if (i > 0 && i % itemsPerPage === 0) {
      doc.addPage();
    }

    const indexOnPage = i % itemsPerPage;
    const colIndex = indexOnPage % cols;
    const rowIndex = Math.floor(indexOnPage / cols);

    const x = marginLeft + colIndex * (cardWidth + colGap);
    const y = marginTop + rowIndex * (cardHeight + rowGap);

    // 1. Gambar Kotak Kartu Label
    doc.setDrawColor(30, 58, 138); // #1e3a8a
    doc.setLineWidth(0.3);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, cardWidth, cardHeight, 1.2, 1.2, 'FD');

    // 2. Header Bar Label (Navy Header)
    const headerH = 5.2;
    doc.setFillColor(30, 58, 138); // #1e3a8a
    doc.roundedRect(x, y, cardWidth, headerH, 1.2, 1.2, 'F');
    // Tutup lengkungan bawah header agar rata
    doc.rect(x, y + headerH - 1.5, cardWidth, 1.5, 'F');

    // Teks Header
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.0);
    doc.text('SESPIMMA LEMDIKLAT POLRI', x + 2, y + 3.6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.0);
    doc.text('ASET LOGISTIK', x + cardWidth - 2, y + 3.6, { align: 'right' });

    // 3. Generate QR Code Image data URL
    const targetUrl = item.qrUrl || `${baseUrl}/item/${item.inventoryCode}`;
    try {
      const qrDataUrl = await QRCode.toDataURL(targetUrl, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 140,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });

      const qrSize = 18;
      const qrX = x + 2;
      const qrY = y + 6.8;

      doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

      // Label mini di bawah QR Code
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(3.2);
      doc.text('SCAN UNTUK DETAIL', qrX + qrSize / 2, qrY + qrSize + 2.0, { align: 'center' });
    } catch (qrErr) {
      console.error('Error generating QR code for PDF:', qrErr);
    }

    // 4. Informasi Spesifikasi Barang (Kolom Kanan)
    const infoX = x + 22.5;
    const maxInfoWidth = cardWidth - 24; // 39mm
    let currentY = y + 8.2;

    // Kode Inventaris (Utama)
    doc.setTextColor(30, 58, 138);
    doc.setFont('courier', 'bold');
    doc.setFontSize(6.2);
    doc.text(item.inventoryCode || '-', infoX, currentY);

    // Garis pemisah tipis di bawah kode
    currentY += 1.3;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.15);
    doc.line(infoX, currentY, x + cardWidth - 2, currentY);

    // Nama Barang (Maksimal 1 baris)
    currentY += 2.4;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.8);
    const splitName = doc.splitTextToSize(item.name || '-', maxInfoWidth);
    doc.text(splitName[0], infoX, currentY);

    // Merk & Model
    if (item.brand || item.model) {
      currentY += 2.1;
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(4.0);
      const brandText = `${item.brand || ''} ${item.model ? `(${item.model})` : ''}`.trim();
      const splitBrand = doc.splitTextToSize(brandText, maxInfoWidth);
      doc.text(splitBrand[0], infoX, currentY);
    }

    // No. Seri (Serial Number)
    if (item.serialNumber) {
      currentY += 2.1;
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(4.0);
      doc.text('No Seri: ', infoX, currentY);
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      const splitSN = doc.splitTextToSize(item.serialNumber, maxInfoWidth - 6);
      doc.text(splitSN[0], infoX + 6, currentY);
    }

    // Kategori
    currentY += 2.1;
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.0);
    doc.text(`Kat: `, infoX, currentY);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    const catName = item.categoryNameSnapshot || item.categoryId || '-';
    const splitCat = doc.splitTextToSize(catName, maxInfoWidth - 4);
    doc.text(splitCat[0], infoX + 4, currentY);

    // Lokasi Penempatan
    currentY += 2.1;
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.0);
    doc.text(`Lok: `, infoX, currentY);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    const locText = `${item.building || 'Sespimma'}${item.room ? ` (${item.room})` : ''}`;
    const splitLoc = doc.splitTextToSize(locText, maxInfoWidth - 4);
    doc.text(splitLoc[0], infoX + 4, currentY);

    // Kondisi
    currentY += 2.1;
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.0);
    doc.text(`Kondisi: `, infoX, currentY);
    if (item.condition === 'Baik') {
      doc.setTextColor(21, 128, 61); // Green
    } else {
      doc.setTextColor(185, 28, 28); // Red
    }
    doc.setFont('helvetica', 'bold');
    doc.text(item.condition || 'Baik', infoX + 6.5, currentY);

    // 5. Garis Footer Kartu
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.15);
    doc.line(x + 2, y + cardHeight - 2.8, x + cardWidth - 2, y + cardHeight - 2.8);

    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(3.0);
    doc.text('BARANG MILIK NEGARA - DILARANG MEMINDAHTANGANKAN TANPA IZIN', x + cardWidth / 2, y + cardHeight - 0.9, { align: 'center' });
  }

  // Simpan dan unduh PDF langsung ke browser user
  doc.save(filename);
}
