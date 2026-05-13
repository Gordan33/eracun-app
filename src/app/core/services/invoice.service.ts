import { Injectable, signal, computed } from '@angular/core';
import {
  Invoice, ProcessType, InvoiceTypeCode,
  P1_TYPE_CODES, P12_TYPE_CODES,
  createEmptyInvoice, createEmptyLine, InvoiceLine,
} from '../models/invoice.model';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  readonly invoice    = signal<Invoice>(createEmptyInvoice());
  readonly mode       = signal<ProcessType>('P1');
  readonly isDirty    = signal<boolean>(false);
  readonly xmlFileName = signal<string>('');

  readonly isP12 = computed(() => this.mode() === 'P12');
  readonly pageTitle = computed(() => this.isP12() ? 'Samoizdavajući račun' : 'eRačun');
  readonly sendButtonLabel = computed(() => this.isP12() ? 'Pošalji P12 eRačun' : 'Pošalji eRačun');
  readonly allowedTypeCodes = computed<readonly InvoiceTypeCode[]>(() => this.isP12() ? P12_TYPE_CODES : P1_TYPE_CODES);

  setMode(mode: ProcessType): void {
    if (this.mode() === mode) return;
    this.mode.set(mode);
    const current = this.invoice().typeCode;
    const allowed: readonly InvoiceTypeCode[] = mode === 'P12' ? P12_TYPE_CODES : P1_TYPE_CODES;
    if (!allowed.includes(current)) {
      this.patchInvoice({ typeCode: mode === 'P12' ? '389' : '380' });
    }
  }

  patchInvoice(patch: Partial<Invoice>): void {
    this.invoice.update(inv => ({ ...inv, ...patch }));
    this.isDirty.set(true);
  }

  addLine(): void {
    const nextId = this.invoice().lines.length + 1;
    this.invoice.update(inv => ({ ...inv, lines: [...inv.lines, createEmptyLine(nextId)] }));
    this.isDirty.set(true);
    this.recalcTotals();
  }

  updateLine(index: number, field: string, value: unknown): void {
    this.invoice.update(inv => {
      const lines = [...inv.lines];
      lines[index] = { ...lines[index], [field]: value } as InvoiceLine;
      const l = lines[index];
      const disc = 1 - (l.discountPct / 100);
      lines[index] = { ...lines[index], netAmount: parseFloat((l.quantity * l.price * disc).toFixed(2)) };
      return { ...inv, lines };
    });
    this.isDirty.set(true);
    this.recalcTotals();
  }

  removeLine(index: number): void {
    this.invoice.update(inv => ({
      ...inv,
      lines: inv.lines.filter((_,i) => i !== index).map((l,i) => ({ ...l, id: String(i+1) }))
    }));
    this.isDirty.set(true);
    this.recalcTotals();
  }

  recalcTotals(): void {
    this.invoice.update(inv => {
      const lines = inv.lines;
      const lineExtAmount = parseFloat(lines.reduce((s,l) => s + l.netAmount, 0).toFixed(2));
      const allowanceAmount = inv.totals.allowanceAmount;
      const taxExclAmount = parseFloat((lineExtAmount - allowanceAmount).toFixed(2));
      const taxMap = new Map<number,number>();
      lines.forEach(l => { const p=l.taxCategory.percent; taxMap.set(p,(taxMap.get(p)||0)+l.netAmount); });
      const taxAmount = parseFloat(Array.from(taxMap.entries()).reduce((s,[p,b]) => s + b*p/100, 0).toFixed(2));
      const taxInclAmount = parseFloat((taxExclAmount + taxAmount).toFixed(2));
      const payableAmount = parseFloat((taxInclAmount - inv.totals.prepaidAmount + inv.totals.roundingAmount).toFixed(2));
      return { ...inv, totals: { ...inv.totals, lineExtAmount, taxExclAmount, taxAmount, taxInclAmount, payableAmount } };
    });
  }

  loadFromParsed(invoice: Invoice, filename: string): void {
    this.invoice.set(invoice);
    this.mode.set(invoice.processType === 'P12' ? 'P12' : 'P1');
    this.xmlFileName.set(filename);
    this.isDirty.set(false);
  }

  reset(): void {
    this.invoice.set(createEmptyInvoice());
    this.mode.set('P1');
    this.isDirty.set(false);
    this.xmlFileName.set('');
  }
}
