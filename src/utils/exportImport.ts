import * as XLSX from 'xlsx';
import { InventoryItem } from '@/types/inventory';

/**
 * Export inventory items array to downloadable Excel (.xlsx) file
 */
export function exportItemsToExcel(items: InventoryItem[], fileName = 'Data_Inventaris_Logistik_Sespimma.xlsx') {
  const exportData = items.map(item => ({
    'Kode Inventaris': item.inventoryCode,
    'Nama Barang': item.name,
    'Kategori': item.categoryNameSnapshot || '',
    'Merk': item.brand || '',
    'Model': item.model || '',
    'Nomor Seri': item.serialNumber || '',
    'Kondisi': item.condition,
    'Status': item.status,
    'Gedung': item.building || '',
    'Lantai': item.floor || '',
    'Ruangan': item.room || '',
    'Detail Lokasi': item.locationDetail || '',
    'Penanggung Jawab': item.responsiblePersonNameSnapshot || '',
    'Tanggal Perolehan': item.purchaseDate || '',
    'Harga Perolehan': item.purchasePrice || 0,
    'Sumber Dana': item.fundingSource || '',
    'Vendor': item.vendor || '',
    'Nomor Dokumen BAST': item.documentNumber || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventaris Logistik');

  XLSX.writeFile(workbook, fileName);
}
