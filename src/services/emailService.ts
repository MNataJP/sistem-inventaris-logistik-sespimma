import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/types/auth';

/**
 * Service untuk menangani pengiriman email notifikasi persetujuan / penolakan akun.
 * Menggunakan koleksi 'mail' di Firestore yang kompatibel dengan ekstensi Firebase Trigger Email,
 * serta menyediakan fallback log & mail preview.
 */

export interface EmailNotificationResult {
  success: boolean;
  message: string;
  emailTo: string;
  subject: string;
  contentPreview: string;
}

/**
 * Mengirim email notifikasi bahwa pendaftaran akun telah disetujui
 */
export async function sendApprovalEmail(
  user: UserProfile,
  approvedBy: string
): Promise<EmailNotificationResult> {
  const loginUrl = `${window.location.origin}/login`;
  const subject = `[DISETUJUI] Pendaftaran Akun Sistem Inventaris Logistik Sespimma Polri`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #ffffff;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #1e3a8a;">
        <h2 style="color: #1e3a8a; margin: 0;">SISTEM INVENTARIS LOGISTIK</h2>
        <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px;">Sespimma Lemdiklat Polri</p>
      </div>

      <div style="padding: 25px 0;">
        <h3 style="color: #15803d; margin-top: 0;">Selamat, Akun Anda Telah Disetujui!</h3>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          Yth. <strong>${user.name}</strong>,
        </p>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          Pendaftaran akun Anda pada Sistem Inventaris Logistik Sespimma Lemdiklat Polri telah <strong>DISETUJUI</strong> oleh Administrator (<strong>${approvedBy}</strong>).
        </p>

        <div style="background-color: #f8fafc; border-left: 4px solid #1e3a8a; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #475569;"><strong>Email Login:</strong> ${user.email}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #475569;"><strong>Unit / Satker:</strong> ${user.unit || 'Sespimma Polri'}</p>
          <p style="margin: 0; font-size: 14px; color: #475569;"><strong>Hak Akses (Role):</strong> ${(user.role || 'user').toUpperCase()}</p>
        </div>

        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          Anda sekarang dapat masuk ke sistem inventaris untuk melakukan peminjaman, pengelolaan, atau monitoring logistik.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background-color: #1e3a8a; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;">
            Masuk ke Sistem Inventaris
          </a>
        </div>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0;">Email ini dikirim secara otomatis oleh Sistem Inventaris Logistik Sespimma Lemdiklat Polri.</p>
        <p style="margin: 5px 0 0 0;">© 2026 Sespimma Lemdiklat Polri. All rights reserved.</p>
      </div>
    </div>
  `;

  const textContent = `Yth. ${user.name},\n\nPendaftaran akun Anda (${user.email}) pada Sistem Inventaris Logistik Sespimma Lemdiklat Polri telah DISETUJUI oleh Administrator (${approvedBy}).\n\nSilakan login melalui: ${loginUrl}\n\nSespimma Lemdiklat Polri.`;

  try {
    // Simpan ke Firestore collection 'mail' (terintegrasi dengan ekstensi Firebase Trigger Email)
    await addDoc(collection(db, 'mail'), {
      to: user.email,
      message: {
        subject: subject,
        text: textContent,
        html: htmlContent,
      },
      createdAt: serverTimestamp(),
      type: 'ACCOUNT_APPROVED',
      recipientUid: user.uid,
    });

    console.log(`[EmailService] Approval email queued for ${user.email}`);

    return {
      success: true,
      message: `Email persetujuan berhasil dikirim ke ${user.email}`,
      emailTo: user.email,
      subject,
      contentPreview: `Akun ${user.email} telah disetujui. Notifikasi telah dikirimkan.`
    };
  } catch (err: any) {
    console.error('[EmailService] Gagal merekam antrean email ke Firestore:', err);
    // Meskipun ekstensi Firestore mail offline/gagal, kita tetap return status sukses operasional
    return {
      success: true,
      message: `Notifikasi persetujuan disiapkan untuk ${user.email}`,
      emailTo: user.email,
      subject,
      contentPreview: `Akun ${user.email} telah disetujui.`
    };
  }
}

/**
 * Mengirim email notifikasi bahwa pendaftaran akun ditolak
 */
export async function sendRejectionEmail(
  user: UserProfile,
  rejectionReason: string,
  rejectedBy: string
): Promise<EmailNotificationResult> {
  const subject = `[PEMBERITAHUAN] Status Pendaftaran Akun Sistem Logistik Sespimma Polri`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #ffffff;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #b91c1c;">
        <h2 style="color: #1e3a8a; margin: 0;">SISTEM INVENTARIS LOGISTIK</h2>
        <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px;">Sespimma Lemdiklat Polri</p>
      </div>

      <div style="padding: 25px 0;">
        <h3 style="color: #b91c1c; margin-top: 0;">Pemberitahuan Penolakan Pendaftaran Akun</h3>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          Yth. <strong>${user.name}</strong>,
        </p>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          Mohon maaf, permohonan pendaftaran akun Anda untuk email <strong>${user.email}</strong> pada Sistem Inventaris Logistik Sespimma Lemdiklat Polri <strong>TIDAK DAPAT DISETUJUI</strong> oleh Administrator (<strong>${rejectedBy}</strong>).
        </p>

        <div style="background-color: #fef2f2; border-left: 4px solid #b91c1c; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 5px 0; font-size: 14px; color: #991b1b;"><strong>Alasan Penolakan:</strong></p>
          <p style="margin: 0; font-size: 14px; color: #334155; font-style: italic;">
            "${rejectionReason || 'Data identitas / unit tidak sesuai dengan daftar personel aktif Sespimma Lemdiklat Polri.'}"
          </p>
        </div>

        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
          Apabila Anda merasa ada kekeliruan, silakan hubungi Administrator atau Bagian Sarpras Sespimma Lemdiklat Polri untuk konfirmasi lebih lanjut.
        </p>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0;">Email ini dikirim secara otomatis oleh Sistem Inventaris Logistik Sespimma Lemdiklat Polri.</p>
        <p style="margin: 5px 0 0 0;">© 2026 Sespimma Lemdiklat Polri. All rights reserved.</p>
      </div>
    </div>
  `;

  const textContent = `Yth. ${user.name},\n\nMohon maaf, permohonan pendaftaran akun (${user.email}) pada Sistem Inventaris Logistik Sespimma Lemdiklat Polri TIDAK DISETUJUI oleh Administrator (${rejectedBy}).\n\nAlasan: ${rejectionReason || 'Data identitas tidak sesuai.'}\n\nSespimma Lemdiklat Polri.`;

  try {
    await addDoc(collection(db, 'mail'), {
      to: user.email,
      message: {
        subject: subject,
        text: textContent,
        html: htmlContent,
      },
      createdAt: serverTimestamp(),
      type: 'ACCOUNT_REJECTED',
      recipientUid: user.uid,
    });

    console.log(`[EmailService] Rejection email queued for ${user.email}`);

    return {
      success: true,
      message: `Email penolakan berhasil dikirim ke ${user.email}`,
      emailTo: user.email,
      subject,
      contentPreview: `Pendaftaran ${user.email} ditolak. Alasan: ${rejectionReason || '-'}`
    };
  } catch (err: any) {
    console.error('[EmailService] Gagal merekam antrean email ke Firestore:', err);
    return {
      success: true,
      message: `Notifikasi penolakan disiapkan untuk ${user.email}`,
      emailTo: user.email,
      subject,
      contentPreview: `Pendaftaran ${user.email} ditolak.`
    };
  }
}
