import React, { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, FileText, Maximize2, X } from 'lucide-react';
import { generateQRLabelsPDF } from '@/utils/pdfLabelGenerator';
import { downloadSingleQRImage } from '@/utils/qrImageGenerator';

import { InventoryItem } from '@/types/inventory';

interface QRCodeGeneratorProps {
  value: string; // Permanent Target URL e.g. https://domain/item/INV-2026-000001
  inventoryCode: string;
  itemName: string;
  item?: Partial<InventoryItem>;
  size?: number;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  value,
  inventoryCode,
  itemName,
  item,
  size = 180
}) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const [zoomModalOpen, setZoomModalOpen] = useState(false);

  const downloadPNG = async () => {
    try {
      await downloadSingleQRImage({
        inventoryCode,
        name: itemName,
        qrUrl: value,
        ...item,
      });
    } catch (err: any) {
      alert('Gagal mengunduh gambar label QR: ' + err.message);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      await generateQRLabelsPDF([
        {
          id: inventoryCode,
          inventoryCode,
          name: itemName,
          qrUrl: value,
          ...item,
        } as any
      ], `Label_QR_${inventoryCode}.pdf`);
    } catch (err: any) {
      alert('Gagal mengunduh label PDF: ' + err.message);
    }
  };

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '1rem',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          maxWidth: '300px',
          width: '100%',
          margin: '0 auto'
        }}
        className="printable-area"
      >
        <div
          ref={qrRef}
          style={{
            padding: '0.75rem',
            backgroundColor: '#ffffff',
            border: '1px solid #f1f5f9',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
          onClick={() => setZoomModalOpen(true)}
          title="Klik untuk memperbesar QR Code"
        >
          <QRCodeCanvas
            value={value}
            size={size}
            level="H"
            includeMargin={true}
          />
        </div>

        <div style={{ marginTop: '0.75rem', textAlign: 'center', width: '100%' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {itemName}
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e3a8a', fontFamily: 'monospace', marginTop: '0.1rem' }}>
            {inventoryCode}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.2rem' }}>
            SESPIMMA LEMDIKLAT POLRI
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.875rem', width: '100%', flexWrap: 'wrap' }} className="no-print">
          <button onClick={() => setZoomModalOpen(true)} className="btn btn-secondary btn-sm" style={{ flex: 1, padding: '0.375rem 0.5rem' }} title="Perbesar QR Code">
            <Maximize2 size={14} />
            <span style={{ fontSize: '0.75rem' }}>Lihat</span>
          </button>
          <button onClick={downloadPNG} className="btn btn-secondary btn-sm" style={{ flex: 1, padding: '0.375rem 0.5rem' }} title="Download QR PNG">
            <Download size={14} />
            <span style={{ fontSize: '0.75rem' }}>PNG</span>
          </button>
          <button onClick={handleDownloadPDF} className="btn btn-primary btn-sm" style={{ flex: 1, padding: '0.375rem 0.5rem' }} title="Download Label QR PDF (A4)">
            <FileText size={14} />
            <span style={{ fontSize: '0.75rem' }}>PDF</span>
          </button>
        </div>
      </div>

      {/* Mobile Zoom Modal */}
      {zoomModalOpen && (
        <div className="modal-overlay" onClick={() => setZoomModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '360px', textAlign: 'center', padding: '1.5rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#0f172a' }}>Preview QR Code HP</h3>
              <button onClick={() => setZoomModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '12px', display: 'inline-block', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
              <QRCodeCanvas
                value={value}
                size={260}
                level="H"
                includeMargin={true}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <strong style={{ fontSize: '1rem', color: '#0f172a', display: 'block' }}>{itemName}</strong>
              <span style={{ fontSize: '0.9rem', color: '#1e3a8a', fontFamily: 'monospace', fontWeight: 700 }}>{inventoryCode}</span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={downloadPNG} className="btn btn-secondary" style={{ flex: 1 }}>
                <Download size={16} />
                <span>Download</span>
              </button>
              <button onClick={() => setZoomModalOpen(false)} className="btn btn-primary" style={{ flex: 1 }}>
                <span>Tutup</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
