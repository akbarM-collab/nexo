export function genId(prefix: string = 'id'): string {
  const rand = Math.random().toString(36).substring(2, 8);
  const time = Date.now().toString(36);
  return `${prefix}_${time}_${rand}`;
}

export const FX_RATES_TO_IDR: Record<string, number> = {
  IDR: 1,
  USD: 16200,
  SGD: 12100,
  EUR: 17400,
  GBP: 20500,
  JPY: 105,
};

export function formatMoney(
  amount: number,
  currency: string = 'IDR',
  hideAmounts: boolean = false
): string {
  if (hideAmounts) {
    return '••••••';
  }

  const isNegative = amount < 0;
  const abs = Math.abs(amount);

  if (currency === 'IDR') {
    const formatted = new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
    }).format(abs);
    return `${isNegative ? '-' : ''}Rp${formatted}`;
  }

  if (currency === 'USD') {
    // For USD, assuming minor units or dollars: if < 10000 and has decimals, format appropriately
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(abs / (abs > 100000 ? 1 : 100));
    return `${isNegative ? '-' : ''}${formatted}`;
  }

  if (currency === 'SGD') {
    const formatted = new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 2,
    }).format(abs / (abs > 100000 ? 1 : 100));
    return `${isNegative ? '-' : ''}${formatted}`;
  }

  // Generic fallback
  try {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(abs);
    return `${isNegative ? '-' : ''}${formatted}`;
  } catch {
    return `${isNegative ? '-' : ''}${currency} ${abs.toLocaleString()}`;
  }
}

export function formatDate(dateStr: string, style: 'short' | 'medium' | 'long' | 'relative' = 'medium'): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    if (style === 'relative') {
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays === -1) return 'Tomorrow';
      if (diffDays > 0 && diffDays < 7) return `${diffDays}d ago`;
      if (diffDays < 0 && diffDays > -7) return `in ${Math.abs(diffDays)}d`;
    }

    if (style === 'short') {
      return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
      }).format(date);
    }

    if (style === 'long') {
      return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date);
    }

    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function getCurrentMonthStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getTodayIso(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
