/**
 * Utility functions for borrowing and return timeliness analysis
 */

export interface ReturnTimelinessInfo {
  type: 'on_time' | 'early' | 'late' | 'overdue' | 'due_today' | 'active';
  label: string;
  badgeClass: string;
  badgeStyle: React.CSSProperties;
  days: number;
  description: string;
}

/**
 * Calculate difference in whole days between dateStr1 and dateStr2 (dateStr1 - dateStr2).
 * Formats expected: YYYY-MM-DD
 */
export function getDaysDifference(dateStr1: string, dateStr2: string): number {
  if (!dateStr1 || !dateStr2) return 0;
  const d1 = new Date(dateStr1 + 'T00:00:00');
  const d2 = new Date(dateStr2 + 'T00:00:00');
  const diffTime = d1.getTime() - d2.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format date to Indonesian localized format (e.g., 03 Sep 2026)
 */
export function formatIndoDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr + 'T00:00:00');
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

/**
 * Analyze return timeliness vs expected return date
 */
export function getReturnTimeliness(
  expectedReturnDate: string,
  actualReturnDate?: string,
  status: string = 'borrowed'
): ReturnTimelinessInfo {
  // Case 1: Item is already returned
  if (status === 'returned' && actualReturnDate) {
    const diff = getDaysDifference(actualReturnDate, expectedReturnDate);
    if (diff === 0) {
      return {
        type: 'on_time',
        label: 'Pengembalian Sesuai',
        badgeClass: 'badge-success',
        badgeStyle: {
          backgroundColor: '#dcfce7',
          color: '#15803d',
          border: '1px solid #86efac',
          fontWeight: 600,
        },
        days: 0,
        description: `Tepat waktu sesuai estimasi (${formatIndoDate(expectedReturnDate)})`,
      };
    } else if (diff < 0) {
      const daysEarly = Math.abs(diff);
      return {
        type: 'early',
        label: `Lebih Cepat (${daysEarly} Hari)`,
        badgeClass: 'badge-info',
        badgeStyle: {
          backgroundColor: '#e0f2fe',
          color: '#0369a1',
          border: '1px solid #7dd3fc',
          fontWeight: 600,
        },
        days: daysEarly,
        description: `Dikembalikan ${daysEarly} hari lebih cepat dari estimasi (${formatIndoDate(expectedReturnDate)})`,
      };
    } else {
      return {
        type: 'late',
        label: `Terlambat / Telat (${diff} Hari)`,
        badgeClass: 'badge-danger',
        badgeStyle: {
          backgroundColor: '#fee2e2',
          color: '#b91c1c',
          border: '1px solid #fca5a5',
          fontWeight: 600,
        },
        days: diff,
        description: `Telat ${diff} hari dari estimasi (${formatIndoDate(expectedReturnDate)})`,
      };
    }
  }

  // Case 2: Item is still borrowed (ongoing)
  const todayStr = new Date().toISOString().split('T')[0];
  const diffFromToday = getDaysDifference(todayStr, expectedReturnDate);

  if (diffFromToday > 0) {
    return {
      type: 'overdue',
      label: `Lewat Tempo (Telat ${diffFromToday} Hari)`,
      badgeClass: 'badge-danger',
      badgeStyle: {
        backgroundColor: '#fee2e2',
        color: '#b91c1c',
        border: '1px solid #fca5a5',
        fontWeight: 600,
      },
      days: diffFromToday,
      description: `Batas pengembalian terlewati sejak ${diffFromToday} hari yang lalu`,
    };
  } else if (diffFromToday === 0) {
    return {
      type: 'due_today',
      label: 'Jatuh Tempo Hari Ini',
      badgeClass: 'badge-warning',
      badgeStyle: {
        backgroundColor: '#fef3c7',
        color: '#b45309',
        border: '1px solid #fcd34d',
        fontWeight: 600,
      },
      days: 0,
      description: `Harus dikembalikan hari ini (${formatIndoDate(expectedReturnDate)})`,
    };
  } else {
    const daysLeft = Math.abs(diffFromToday);
    return {
      type: 'active',
      label: `Sedang Dipinjam (Sisa ${daysLeft} Hari)`,
      badgeClass: 'badge-info',
      badgeStyle: {
        backgroundColor: '#eff6ff',
        color: '#1d4ed8',
        border: '1px solid #bfdbfe',
        fontWeight: 600,
      },
      days: daysLeft,
      description: `Estimasi kembali: ${formatIndoDate(expectedReturnDate)}`,
    };
  }
}
