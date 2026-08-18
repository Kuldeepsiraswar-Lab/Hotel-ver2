export function formatCurrency(amount: number, symbol: string = "₹"): string {
  if (isNaN(amount)) return `${symbol}0.00`;
  return `${symbol}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(dateString?: string): string {
  if (!dateString) return "N/A";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString?: string): string {
  if (!dateString) return "N/A";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

export function generateNextInvoiceNumber(existingOrders: { invoiceNumber: string }[], prefix: string = "INV-"): string {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `${prefix}${currentYear}-`;
  
  const numbers = existingOrders
    .map(o => o.invoiceNumber)
    .filter(num => num && num.startsWith(yearPrefix))
    .map(num => {
      const part = num.replace(yearPrefix, '');
      const parsed = parseInt(part, 10);
      return isNaN(parsed) ? 0 : parsed;
    });

  const nextNum = (numbers.length > 0 ? Math.max(...numbers) : 0) + 1;
  return `${yearPrefix}${String(nextNum).padStart(4, '0')}`;
}

export function generateNextReceiptNumber(existingOrders: { invoiceNumber: string }[], prefix: string = "RCP-"): string {
  const date = new Date();
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const rcpPrefix = `${prefix}${datePart}-`;

  const numbers = existingOrders
    .map(o => o.invoiceNumber)
    .filter(num => num && num.startsWith(rcpPrefix))
    .map(num => {
      const part = num.replace(rcpPrefix, '');
      const parsed = parseInt(part, 10);
      return isNaN(parsed) ? 0 : parsed;
    });

  const nextNum = (numbers.length > 0 ? Math.max(...numbers) : 0) + 1;
  return `${rcpPrefix}${String(nextNum).padStart(3, '0')}`;
}
