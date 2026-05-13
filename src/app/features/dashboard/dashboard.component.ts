import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DocumentListService, TabFilter, SortField } from '../../core/services/document-list.service';
import { InvoiceListItem } from '../../core/models/document.model';
import { InvoiceService } from '../../core/services/invoice.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="dash-wrap">

    <!-- ══ HEADER ══ -->
    <div class="dash-header">
      <div class="dash-title-row">
        <h2 class="dash-title">Dokumenti</h2>
        <button class="btn-new" (click)="newDocument()">
          <span>＋</span> Novi dokument
        </button>
      </div>

      <!-- TABS -->
      <div class="dash-tabs">
        <button class="dash-tab" [class.active]="svc.tab() === 'all'"
          (click)="svc.setTab('all')">Svi dokumenti</button>
        <button class="dash-tab" [class.active]="svc.tab() === 'unread'"
          (click)="svc.setTab('unread')">
          Nepročitani
          @if (svc.unreadCount() > 0) {
            <span class="tab-badge">{{ svc.unreadCount() }}</span>
          }
        </button>
        <button class="dash-tab" [class.active]="svc.tab() === 'issued'"
          (click)="svc.setTab('issued')">Izdani e-računi</button>
        <button class="dash-tab" [class.active]="svc.tab() === 'received'"
          (click)="svc.setTab('received')">Zaprimljeni e-računi</button>
        <button class="dash-tab" [class.active]="svc.tab() === 'f1'"
          (click)="svc.setTab('f1')">F1 računi</button>
      </div>
    </div>

    <!-- ══ TOOLBAR ══ -->
    <div class="dash-toolbar">
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input type="text" class="search-input"
          placeholder="Pretraži po broju, partneru, tipu..."
          [ngModel]="svc.search()"
          (ngModelChange)="svc.setSearch($event)">
        @if (svc.search()) {
          <button class="search-clear" (click)="svc.setSearch('')">✕</button>
        }
      </div>
      <div class="toolbar-right">
        <span class="result-count">
          Prikazano {{ svc.paged().length }} od {{ svc.total() }}
        </span>
      </div>
    </div>

    <!-- ══ TABLE ══ -->
    <div class="table-container">
      <table class="doc-table">
        <thead>
          <tr>
            <th class="th-icon"></th>
            <th class="th-type">Tip</th>
            <th class="th-sort" (click)="svc.setSort('number')">
              Broj
              <span class="sort-icon">{{ sortIcon('number') }}</span>
            </th>
            <th class="th-sort" (click)="svc.setSort('date')">
              Datum
              <span class="sort-icon">{{ sortIcon('date') }}</span>
            </th>
            <th>od / do</th>
            <th class="th-sort" (click)="svc.setSort('partner')">
              Partner
              <span class="sort-icon">{{ sortIcon('partner') }}</span>
            </th>
            <th class="th-sort" (click)="svc.setSort('amount')">
              Iznos
              <span class="sort-icon">{{ sortIcon('amount') }}</span>
            </th>
            <th>Status</th>
            <th class="th-sort" (click)="svc.setSort('lastChanged')">
              Zadnja izmjena
              <span class="sort-icon">{{ sortIcon('lastChanged') }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          @if (svc.paged().length === 0) {
            <tr>
              <td colspan="9" class="empty-row">
                Nema dokumenata koji odgovaraju filtru
              </td>
            </tr>
          }
          @for (item of svc.paged(); track item.id) {
            <tr class="doc-row"
              [class.row-new]="item.status === 'NOVO'"
              [class.row-p12]="item.processType === 'P12'"
              (click)="openDocument(item)">

              <!-- Direction icon -->
              <td class="td-icon">
                <span class="dir-icon" [title]="item.direction === 'in' ? 'Primljeni' : 'Izdani'">
                  {{ item.direction === 'in' ? '↓' : '↑' }}
                </span>
              </td>

              <!-- Type -->
              <td class="td-type">
                <div class="type-wrap">
                  <span class="type-label">{{ item.type }}</span>
                  @if (item.processType === 'P12') {
                    <span class="p12-badge">P12</span>
                  }
                </div>
              </td>

              <!-- Number -->
              <td class="td-number">
                <span [class.bold]="item.status === 'NOVO'">{{ item.number }}</span>
              </td>

              <!-- Date -->
              <td class="td-date">{{ formatDate(item.date) }}</td>

              <!-- Period -->
              <td class="td-period">
                @if (item.periodFrom) {
                  <span class="period-text">
                    {{ formatDate(item.periodFrom) }} — {{ formatDate(item.periodTo!) }}
                  </span>
                }
              </td>

              <!-- Partner -->
              <td class="td-partner">
                <span [class.bold]="item.status === 'NOVO'">{{ item.partner }}</span>
              </td>

              <!-- Amount -->
              <td class="td-amount">
                @if (item.amount !== undefined) {
                  <span [class.amount-neg]="item.amount < 0">
                    {{ formatAmount(item.amount) }} {{ item.currency }}
                  </span>
                }
              </td>

              <!-- Status -->
              <td class="td-status">
                <div class="status-wrap">
                  <span class="status-badge" [class]="'status-' + item.status.toLowerCase()">
                    {{ item.status }}
                  </span>
                  @if (item.fiscStatus) {
                    <span class="fisc-badge"
                      [class.fisc-ok]="item.fiscStatus === 'FISCALIZATION:OK'"
                      [class.fisc-re]="item.fiscStatus === 'FISCALIZATION:RE'">
                      {{ item.fiscStatus === 'FISCALIZATION:OK' ? 'FISC:OK' : 'FISC:RE' }}
                    </span>
                  }
                </div>
              </td>

              <!-- Last changed -->
              <td class="td-changed">{{ formatDateTime(item.lastChanged) }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <!-- ══ PAGINATION ══ -->
    <div class="pagination">
      <div class="page-info">
        Strana {{ svc.page() }} od {{ svc.totalPages() }}
      </div>
      <div class="page-controls">
        <button class="page-btn" [disabled]="svc.page() === 1"
          (click)="svc.setPage(1)">«</button>
        <button class="page-btn" [disabled]="svc.page() === 1"
          (click)="svc.setPage(svc.page() - 1)">‹</button>
        @for (p of pageNumbers(); track p) {
          <button class="page-btn" [class.page-active]="svc.page() === p"
            (click)="svc.setPage(p)">{{ p }}</button>
        }
        <button class="page-btn" [disabled]="svc.page() === svc.totalPages()"
          (click)="svc.setPage(svc.page() + 1)">›</button>
        <button class="page-btn" [disabled]="svc.page() === svc.totalPages()"
          (click)="svc.setPage(svc.totalPages())">»</button>
      </div>
      <div class="page-size">
        <span>Prikazano:</span>
        <select [value]="svc.pageSize()" (change)="onPageSize($event)">
          <option [value]="10">10</option>
          <option [value]="25">25</option>
          <option [value]="29">29</option>
          <option [value]="50">50</option>
        </select>
        <span>po stranici · Ukupno: {{ svc.total() }}</span>
      </div>
    </div>

  </div>
  `,
  styles: [`
    .dash-wrap {
      padding: 0;
      display: flex;
      flex-direction: column;
      height: calc(100vh - 50px);
      overflow: hidden;
    }

    /* HEADER */
    .dash-header {
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      padding: 0 20px;
    }
    .dash-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 0 10px;
    }
    .dash-title {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -.02em;
      color: var(--color-text);
      margin: 0;
    }
    .btn-new {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 16px;
      background: var(--color-acc);
      color: #fff;
      border: none;
      border-radius: 7px;
      font-size: 13px;
      font-weight: 600;
      font-family: var(--font-sans);
      cursor: pointer;
      transition: filter .15s;
    }
    .btn-new:hover { filter: brightness(.9); }

    /* TABS */
    .dash-tabs {
      display: flex;
      gap: 0;
      border-bottom: none;
    }
    .dash-tab {
      padding: 10px 16px;
      border: none;
      background: transparent;
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text2);
      cursor: pointer;
      font-family: var(--font-sans);
      border-bottom: 2px solid transparent;
      transition: all .15s;
      display: flex; align-items: center; gap: 6px;
    }
    .dash-tab:hover { color: var(--color-text); }
    .dash-tab.active {
      color: var(--color-acc);
      border-bottom-color: var(--color-acc);
      font-weight: 600;
    }
    .tab-badge {
      background: var(--color-error);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 10px;
    }

    /* TOOLBAR */
    .dash-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 20px;
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      gap: 12px;
    }
    .search-wrap {
      position: relative;
      flex: 1;
      max-width: 420px;
    }
    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 13px;
      pointer-events: none;
    }
    .search-input {
      width: 100%;
      padding: 7px 32px 7px 32px;
      border: 1px solid var(--color-border);
      border-radius: 7px;
      font-size: 12.5px;
      font-family: var(--font-sans);
      color: var(--color-text);
      background: var(--color-surf2);
      transition: all .15s;
    }
    .search-input:focus {
      outline: none;
      border-color: var(--color-acc);
      background: #fff;
      box-shadow: 0 0 0 2.5px color-mix(in srgb, var(--color-acc) 15%, transparent);
    }
    .search-clear {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      color: var(--color-text3);
      font-size: 12px;
    }
    .toolbar-right { display: flex; align-items: center; gap: 10px; }
    .result-count { font-size: 12px; color: var(--color-text3); }

    /* TABLE */
    .table-container {
      flex: 1;
      overflow-y: auto;
      overflow-x: auto;
    }
    .doc-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 900px;
      font-size: 12.5px;
    }
    .doc-table thead th {
      background: var(--color-surf2);
      border-bottom: 1.5px solid var(--color-border);
      padding: 8px 10px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .05em;
      color: var(--color-text2);
      white-space: nowrap;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .th-sort {
      cursor: pointer;
      user-select: none;
    }
    .th-sort:hover { color: var(--color-text); }
    .sort-icon { font-size: 10px; margin-left: 3px; }
    .th-icon { width: 32px; }

    .doc-row {
      cursor: pointer;
      transition: background .1s;
      border-bottom: 1px solid var(--color-border);
    }
    .doc-row:hover td { background: color-mix(in srgb, var(--color-acc) 5%, transparent); }
    .doc-row.row-new td { background: color-mix(in srgb, var(--color-acc) 3%, var(--color-surface)); }
    .doc-row.row-p12 .td-type { }

    .doc-table tbody td {
      padding: 8px 10px;
      vertical-align: middle;
    }

    .dir-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--color-surf2);
      font-size: 11px;
      color: var(--color-text2);
    }

    .type-wrap { display: flex; align-items: center; gap: 5px; flex-wrap: nowrap; }
    .type-label { white-space: nowrap; }
    .p12-badge {
      font-size: 9px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 4px;
      background: var(--color-p12);
      color: #fff;
      letter-spacing: .04em;
      white-space: nowrap;
    }
    .bold { font-weight: 700; color: var(--color-text); }
    .td-number { font-family: var(--font-mono); font-size: 11.5px; max-width: 220px; }
    .td-date { white-space: nowrap; color: var(--color-text2); }
    .td-period { font-size: 11px; color: var(--color-text3); white-space: nowrap; }
    .td-partner { max-width: 220px; }
    .td-amount { text-align: right; font-family: var(--font-mono); font-size: 12px; white-space: nowrap; }
    .amount-neg { color: var(--color-error); }
    .td-changed { white-space: nowrap; color: var(--color-text3); font-size: 11.5px; }

    .status-wrap { display: flex; flex-direction: column; gap: 2px; }
    .status-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
      white-space: nowrap;
      display: inline-block;
    }
    .status-novo     { background: color-mix(in srgb, var(--color-acc) 12%, transparent); color: var(--color-acc-d); }
    .status-pročitano { background: var(--color-surf2); color: var(--color-text2); }
    .fisc-badge {
      font-size: 9.5px;
      font-weight: 600;
      padding: 1px 5px;
      border-radius: 3px;
      display: inline-block;
    }
    .fisc-ok { background: var(--color-success-l); color: var(--color-success); }
    .fisc-re { background: var(--color-warning-l); color: var(--color-warning); }

    .empty-row {
      text-align: center;
      padding: 40px !important;
      color: var(--color-text3);
      font-style: italic;
    }

    /* PAGINATION */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 20px;
      background: var(--color-surface);
      border-top: 1px solid var(--color-border);
      flex-shrink: 0;
    }
    .page-info { font-size: 12px; color: var(--color-text2); min-width: 100px; }
    .page-controls { display: flex; gap: 3px; }
    .page-btn {
      padding: 4px 9px;
      border: 1px solid var(--color-border);
      border-radius: 5px;
      background: var(--color-surface);
      color: var(--color-text2);
      font-size: 12px;
      font-family: var(--font-sans);
      cursor: pointer;
      transition: all .15s;
      min-width: 30px;
    }
    .page-btn:hover:not(:disabled) { background: var(--color-surf2); border-color: var(--color-bord2); }
    .page-btn:disabled { opacity: .4; cursor: default; }
    .page-btn.page-active { background: var(--color-acc); color: #fff; border-color: var(--color-acc); font-weight: 600; }
    .page-size {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; color: var(--color-text2);
    }
    .page-size select {
      padding: 3px 20px 3px 6px;
      border: 1px solid var(--color-border);
      border-radius: 5px;
      font-size: 12px;
      font-family: var(--font-sans);
      background: var(--color-surface);
      color: var(--color-text);
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%234a5568' d='M5 7L1 3h8z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 5px center;
      cursor: pointer;
    }
  `]
})
export class DashboardComponent {
  protected svc    = inject(DocumentListService);
  private router   = inject(Router);
  private invSvc   = inject(InvoiceService);

  openDocument(item: InvoiceListItem): void {
    this.svc.markAsRead(item.id);
    this.invSvc.setMode(item.processType as any);
    this.router.navigate(['/invoice', item.id]);
  }

  newDocument(): void {
    this.invSvc.reset();
    this.router.navigate(['/invoice/new']);
  }

  sortIcon(field: string): string {
    if (this.svc.sortField() !== field) return '↕';
    return this.svc.sortDir() === 'asc' ? '↑' : '↓';
  }

  pageNumbers(): number[] {
    const total = this.svc.totalPages();
    const current = this.svc.page();
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end   = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  onPageSize(event: Event): void {
    this.svc.pageSize.set(+(event.target as HTMLSelectElement).value);
    this.svc.setPage(1);
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y}`;
  }

  formatDateTime(iso: string): string {
    if (!iso) return '—';
    const [date, time] = iso.split('T');
    const [y, m, d] = date.split('-');
    return `${d}.${m}.${y} ${time?.slice(0,5) || ''}`;
  }

  formatAmount(n: number): string {
    return Math.abs(n).toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
