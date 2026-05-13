import { Pipe, PipeTransform } from '@angular/core';
import { INVOICE_TYPE_LABELS } from '../../core/models/invoice.model';

@Pipe({ name: 'hrCurrency', standalone: true, pure: true })
export class HrCurrencyPipe implements PipeTransform {
  transform(value: number | string | null | undefined, currency = 'EUR'): string {
    if (value === null || value === undefined || value === '') return '—';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '—';
    const formatted = num.toLocaleString('hr-HR', { minimumFractionDigits:2, maximumFractionDigits:2 });
    return currency ? `${formatted} ${currency}` : formatted;
  }
}

@Pipe({ name: 'btDate', standalone: true, pure: true })
export class BtDatePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '—';
    const parts = value.split('-');
    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}.`;
    return value;
  }
}

@Pipe({ name: 'docType', standalone: true, pure: true })
export class DocTypePipe implements PipeTransform {
  transform(code: string | null | undefined): string {
    if (!code) return '—';
    return INVOICE_TYPE_LABELS[code] || code;
  }
}

@Pipe({ name: 'fileSize', standalone: true, pure: true })
export class FileSizePipe implements PipeTransform {
  transform(bytes: number | null | undefined): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes/1024).toFixed(1)} KB`;
    return `${(bytes/1048576).toFixed(2)} MB`;
  }
}
