import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { InventoryItem } from '@/types/inventory';

/**
 * Menghasilkan dan mengunduh file PDF label QR Code kolektif untuk kertas A4
 * Format: 1 baris berisi 2 label QR Code (2 kolom per baris)
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

  // Konfigurasi Grid A4: 2 Kolom x 5 Baris = 10 label per halaman A4
  const marginLeft = 10;
  const marginTop = 12;
  const cardWidth = 92;
  const cardHeight = 50;
  const colGap = 6;
  const rowGap = 5;

  const cols = 2; // 1 baris berisi 2 QR Code
  const rowsPerPage = 5;
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
    doc.setLineWidth(0.35);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    // 2. Header Bar Label (Navy Header)
    doc.setFillColor(30, 58, 138); // #1e3a8a
    doc.roundedRect(x, y, cardWidth, 8, 1.5, 1.5, 'F');
    // Tutup lengkungan bawah header agar rata
    doc.rect(x, y + 5, cardWidth, 3, 'F');

    // Teks Header
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('SESPIMMA LEMDIKLAT POLRI', x + 3, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text('ASET LOGISTIK', x + cardWidth - 3, y + 4.5, { align: 'right' });

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

      const qrSize = 31;
      const qrX = x + 3;
      const qrY = y + 10;

      doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

      // Label mini di bawah QR Code
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(4.5);
      doc.text('SCAN UNTUK DETAIL', qrX + qrSize / 2, qrY + qrSize + 2.5, { align: 'center' });
    } catch (qrErr) {
      console.error('Error generating QR code for PDF:', qrErr);
    }

    // 4. Informasi Spesifikasi Barang (Kolom Kanan)
    const infoX = x + 36;
    let currentY = y + 13;

    // Kode Inventaris (Utama)
    doc.setTextColor(30, 58, 138);
    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.text(item.inventoryCode || '-', infoX, currentY);

    // Garis pemisah tipis di bawah kode
    currentY += 2;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(infoX, currentY, x + cardWidth - 3, currentY);

    // Nama Barang (Maksimal 2 baris)
    currentY += 4;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    const splitName = doc.splitTextToSize(item.name || '-', cardWidth - 39);
    doc.text(splitName.slice(0, 2), infoX, currentY);
    currentY += Math.min(splitName.length, 2) * 3.5;

    // Merk & Model
    if (item.brand || item.model) {
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      const brandText = `${item.brand || ''} ${item.model ? `(${item.model})` : ''}`.trim();
      const splitBrand = doc.splitTextToSize(brandText, cardWidth - 39);
      doc.text(splitBrand[0], infoX, currentY);
      currentY += 3;
    }

    // Kategori
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(`Kat: `, infoX, currentY);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    const catName = item.categoryNameSnapshot || item.categoryId || '-';
    doc.text(catName, infoX + 6, currentY);

    // Lokasi Penempatan
    currentY += 3.2;
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(`Lok: `, infoX, currentY);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    const locText = `${item.building || 'Sespimma'} (Lt.${item.floor || '1'} - ${item.room || '-'})`;
    const splitLoc = doc.splitTextToSize(locText, cardWidth - 45);
    doc.text(splitLoc[0], infoX + 6, currentY);

    // Kondisi
    currentY += 3.2;
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(`Kondisi: `, infoX, currentY);
    if (item.condition === 'Baik') {
      doc.setTextColor(21, 128, 61); // Green
    } else {
      doc.setTextColor(185, 28, 28); // Red
    }
    doc.setFont('helvetica', 'bold');
    doc.text(item.condition || 'Baik', infoX + 11, currentY);

    // 5. Garis Footer Kartu
    doc.setDrawColor(241, 245, 249);
    doc.line(x + 2, y + cardHeight - 3.5, x + cardWidth - 2, y + cardHeight - 3.5);

    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(4.8);
    doc.text('BARANG MILIK NEGARA - DILARANG MEMINDAHTANGANKAN TANPA IZIN', x + cardWidth / 2, y + cardHeight - 1.2, { align: 'center' });
  }

  // Simpan dan unduh PDF langsung ke browser user
  doc.save(filename);
}
