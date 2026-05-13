export function formatAmount(
  value: number | null | undefined,
  currency = '',
  locale = 'hr-HR'
): string {
  if (value == null) return '0,00' + (currency ? ' ' + currency : '');
  return (
    value.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + (currency ? ' ' + currency : '')
  );
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}

export function b64FileSize(b64: string): string {
  const bytes = Math.round((b64.length * 3) / 4);
  return formatFileSize(bytes);
}

export function mimeIcon(mime: string): string {
  if (!mime) return '📎';
  if (mime.includes('pdf'))   return '📄';
  if (mime.includes('image')) return '🖼️';
  if (mime.includes('xml'))   return '📋';
  if (mime.includes('zip'))   return '🗜️';
  if (mime.includes('excel') || mime.includes('spreadsheet')) return '📊';
  return '📎';
}

export function displayDate(iso?: string): string {
  if (!iso) return '—';
  // Convert ISO 2026-05-05 → 05.05.2026
  const parts = iso.split('-');
  if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
  return iso;
}

export function orDash(val?: string | null): string {
  return val?.trim() || '—';
}
