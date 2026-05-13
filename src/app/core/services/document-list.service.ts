import { Injectable, signal, computed } from '@angular/core';
import { InvoiceListItem, DocType, DocStatus, ProcessType } from '../models/document.model';

const MOCK_DATA: InvoiceListItem[] = [
  { id:'1',  type:'Račun', processType:'P1',  number:'1580523/019999/00/02/2026', date:'2026-05-12', partner:'Zagrebačka banka d.d.',              status:'NOVO',      fiscStatus:'FISCALIZATION:OK', lastChanged:'2026-05-13T08:07:17', direction:'in',  amount:12500.00, currency:'EUR' },
  { id:'2',  type:'Račun', processType:'P1',  number:'5393-02-91',                date:'2026-05-12', partner:'UNIMAR RIJEKA d.o.o.',               status:'PROČITANO', fiscStatus:'FISCALIZATION:OK', lastChanged:'2026-05-12T16:51:03', direction:'in',  amount:3200.50,  currency:'EUR' },
  { id:'3',  type:'Račun', processType:'P1',  number:'260045606/01/0201',         date:'2026-04-13', partner:'UNIQA d.d.',                         status:'PROČITANO', fiscStatus:'FISCALIZATION:OK', lastChanged:'2026-05-12T14:04:47', direction:'in',  amount:890.00,   currency:'EUR' },
  { id:'4',  type:'Račun', processType:'P1',  number:'260022815/01/0201',         date:'2026-02-19', partner:'UNIQA d.d.',                         status:'PROČITANO', fiscStatus:'FISCALIZATION:OK', lastChanged:'2026-05-12T14:04:07', direction:'in',  amount:890.00,   currency:'EUR' },
  { id:'5',  type:'Odobrenje', processType:'P1', number:'260022892/01/0201',      date:'2026-02-19', partner:'UNIQA d.d.',                         status:'PROČITANO', fiscStatus:'FISCALIZATION:OK', lastChanged:'2026-05-12T14:03:53', direction:'in',  amount:-445.00,  currency:'EUR' },
  { id:'6',  type:'Račun', processType:'P1',  number:'1370-1005-3',               date:'2026-02-24', partner:'PostLink d.o.o.',                    status:'PROČITANO', fiscStatus:'FISCALIZATION:RE', lastChanged:'2026-05-12T13:00:34', direction:'in',  amount:156.80,   currency:'EUR' },
  { id:'7',  type:'Račun', processType:'P1',  number:'2000190209/R900/800',       date:'2026-05-04', partner:'TELE2 d.o.o.',                       status:'PROČITANO', fiscStatus:'FISCALIZATION:OK', lastChanged:'2026-05-12T12:58:51', direction:'in',  amount:45.60,    currency:'EUR' },
  { id:'8',  type:'Račun', processType:'P1',  number:'1520/B01/1',                date:'2026-05-05', partner:'4TEL Telekomunikacije d.o.o.',        status:'PROČITANO', fiscStatus:'FISCALIZATION:OK', lastChanged:'2026-05-12T12:54:13', direction:'in',  amount:320.00,   currency:'EUR' },
  { id:'9',  type:'Račun', processType:'P1',  number:'90342-BIL1-011',            date:'2026-05-01', partner:'Hrvatski Telekom d.d.',              status:'PROČITANO', fiscStatus:'FISCALIZATION:RE', lastChanged:'2026-05-12T12:47:03', direction:'in',  amount:1240.00,  currency:'EUR' },
  { id:'10', type:'Račun', processType:'P1',  number:'197766-BIL1-002',           date:'2026-03-03', partner:'Hrvatski Telekom d.d.',              status:'PROČITANO', fiscStatus:'FISCALIZATION:RE', lastChanged:'2026-05-12T12:46:18', direction:'in',  amount:1240.00,  currency:'EUR' },
  { id:'11', type:'Račun', processType:'P1',  number:'9588-PZ1-3',                date:'2026-04-26', partner:'VODOOPSKRBA I ODVODNJA D.O.O.',      status:'PROČITANO', fiscStatus:'FISCALIZATION:OK', lastChanged:'2026-05-12T12:42:05', direction:'in',  amount:234.50,   currency:'EUR' },
  { id:'12', type:'Račun', processType:'P1',  number:'84258/CI1/201',             date:'2026-06-05', partner:'Zagrebački Holding, pod. Čistoća',   status:'PROČITANO', fiscStatus:'FISCALIZATION:OK', lastChanged:'2026-05-12T12:00:55', direction:'in',  amount:178.20,   currency:'EUR' },
  { id:'13', type:'Račun', processType:'P12', number:'SB-2026-0042',              date:'2026-05-05', partner:'ISPORUČITELJ USLUGA d.o.o.',         status:'NOVO',      fiscStatus:'FISCALIZATION:OK', lastChanged:'2026-05-11T10:47:01', direction:'in',  amount:4375.00,  currency:'EUR', periodFrom:'2026-04-01', periodTo:'2026-04-30' },
  { id:'14', type:'Samoizdavajući račun', processType:'P12', number:'SB-2026-0041', date:'2026-04-29', partner:'Iron Mountain Hrvatska d.o.o.',   status:'NOVO',      fiscStatus:'FISCALIZATION:OK', lastChanged:'2026-05-08T14:55:11', direction:'in',  amount:2860.00,  currency:'EUR', periodFrom:'2026-03-01', periodTo:'2026-03-31' },
  { id:'15', type:'Račun za predujam', processType:'P1', number:'331-02-97',      date:'2026-04-30', partner:'UNIMAR RIJEKA d.o.o.',               status:'NOVO',      fiscStatus:'FISCALIZATION:OK', lastChanged:'2026-05-07T08:36:35', direction:'out', amount:5000.00,  currency:'EUR' },
  { id:'16', type:'Račun', processType:'P1',  number:'3-PH02-99',                 date:'2026-02-09', partner:'PHOEBUS d.o.o.',                     status:'PROČITANO', fiscStatus:'FISCALIZATION:OK', lastChanged:'2026-05-08T08:24:01', direction:'in',  amount:670.00,   currency:'EUR' },
  { id:'17', type:'Račun', processType:'P1',  number:'7/1/1',                     date:'2026-05-09', partner:'Obrt SMOKVICA, vl. Snježana Čović',  status:'PROČITANO', fiscStatus:'FISCALIZATION:OK', lastChanged:'2026-05-08T08:20:35', direction:'in',  amount:450.00,   currency:'EUR' },
  { id:'18', type:'Račun', processType:'P1',  number:'209582/0101/226',           date:'2026-05-06', partner:'HRVATSKE AUTOCESTE D.O.O.',          status:'NOVO',      fiscStatus:'FISCALIZATION:OK', lastChanged:'2026-05-06T21:41:46', direction:'in',  amount:18750.00, currency:'EUR' },
  { id:'19', type:'Račun', processType:'P1',  number:'318623/7/1/2026',           date:'2026-05-04', partner:'PRIVREDNA BANKA ZAGREB d.d.',        status:'NOVO',      fiscStatus:'FISCALIZATION:OK', lastChanged:'2026-05-06T11:15:54', direction:'in',  amount:2340.00,  currency:'EUR' },
  { id:'20', type:'Račun', processType:'P1',  number:'813/1/1',                   date:'2026-05-05', partner:'AUTOCENTAR BAOTIĆ d.o.o.',           status:'NOVO',      fiscStatus:'FISCALIZATION:OK', lastChanged:'2026-05-06T13:03:07', direction:'in',  amount:8900.00,  currency:'EUR' },
  { id:'21', type:'Račun', processType:'P12', number:'SB-2026-0040',              date:'2026-04-30', partner:'Zagrebačka banka d.d.',              status:'NOVO',      fiscStatus:'FISCALIZATION:OK', lastChanged:'2026-05-02T10:13:26', direction:'in',  amount:1250.00,  currency:'EUR', periodFrom:'2026-04-01', periodTo:'2026-04-30' },
  { id:'22', type:'Račun', processType:'P1',  number:'306764-AUT305-1-2026-PPR',  date:'2026-05-01', partner:'ERSTE&STEIERMÄRKISCHE BANK d.d.',    status:'NOVO',      fiscStatus:'FISCALIZATION:OK', lastChanged:'2026-05-01T15:55:47', direction:'in',  amount:3600.00,  currency:'EUR' },
  { id:'23', type:'Račun', processType:'P1',  number:'2602222-1-1',               date:'2026-03-31', partner:'Iron Mountain Hrvatska d.o.o.',     status:'PROČITANO', fiscStatus:'FISCALIZATION:OK', lastChanged:'2026-04-29T21:20:54', direction:'in',  amount:2860.00,  currency:'EUR' },
  { id:'24', type:'Račun', processType:'P1',  number:'2602600-1-1',               date:'2026-03-31', partner:'Iron Mountain Hrvatska d.o.o.',     status:'PROČITANO', fiscStatus:'FISCALIZATION:OK', lastChanged:'2026-04-29T21:20:23', direction:'in',  amount:2860.00,  currency:'EUR' },
  { id:'25', type:'Račun', processType:'P1',  number:'5/1/1',                     date:'2026-04-02', partner:'Obrt SMOKVICA, vl. Snježana Čović',  status:'PROČITANO', fiscStatus:'FISCALIZATION:OK', lastChanged:'2026-04-29T21:20:27', direction:'in',  amount:450.00,   currency:'EUR' },
  { id:'26', type:'Račun', processType:'P1',  number:'163/POSL1/3',               date:'2026-03-30', partner:'Old brick d.o.o.',                   status:'PROČITANO', fiscStatus:'FISCALIZATION:OK', lastChanged:'2026-04-29T21:19:50', direction:'in',  amount:3200.00,  currency:'EUR' },
];

export type TabFilter = 'all' | 'unread' | 'issued' | 'received' | 'f1';
export type SortField = 'date' | 'partner' | 'number' | 'lastChanged' | 'amount';
export type SortDir = 'asc' | 'desc';

@Injectable({ providedIn: 'root' })
export class DocumentListService {
  private _items = signal<InvoiceListItem[]>(MOCK_DATA);

  readonly search     = signal<string>('');
  readonly tab        = signal<TabFilter>('all');
  readonly sortField  = signal<SortField>('lastChanged');
  readonly sortDir    = signal<SortDir>('desc');
  readonly page       = signal<number>(1);
  readonly pageSize   = signal<number>(29);

  readonly filtered = computed(() => {
    let items = this._items();
    const q = this.search().toLowerCase();
    const t = this.tab();

    if (q) items = items.filter(i =>
      i.number.toLowerCase().includes(q) ||
      i.partner.toLowerCase().includes(q) ||
      i.type.toLowerCase().includes(q)
    );

    if (t === 'unread')   items = items.filter(i => i.status === 'NOVO');
    if (t === 'issued')   items = items.filter(i => i.direction === 'out');
    if (t === 'received') items = items.filter(i => i.direction === 'in');

    const sf = this.sortField();
    const sd = this.sortDir();
    items = [...items].sort((a, b) => {
      let va: string | number = '';
      let vb: string | number = '';
      if (sf === 'date')        { va = a.date; vb = b.date; }
      if (sf === 'partner')     { va = a.partner; vb = b.partner; }
      if (sf === 'number')      { va = a.number; vb = b.number; }
      if (sf === 'lastChanged') { va = a.lastChanged; vb = b.lastChanged; }
      if (sf === 'amount')      { va = a.amount||0; vb = b.amount||0; }
      if (va < vb) return sd === 'asc' ? -1 : 1;
      if (va > vb) return sd === 'asc' ? 1 : -1;
      return 0;
    });

    return items;
  });

  readonly unreadCount = computed(() =>
    this._items().filter(i => i.status === 'NOVO').length
  );

  readonly total = computed(() => this.filtered().length);

  readonly paged = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  readonly totalPages = computed(() =>
    Math.ceil(this.total() / this.pageSize())
  );

  setSearch(v: string) { this.search.set(v); this.page.set(1); }
  setTab(v: TabFilter) { this.tab.set(v); this.page.set(1); }
  setSort(field: SortField) {
    if (this.sortField() === field) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('desc');
    }
  }
  setPage(p: number) { this.page.set(p); }

  getById(id: string): InvoiceListItem | undefined {
    return this._items().find(i => i.id === id);
  }

  markAsRead(id: string) {
    this._items.update(items =>
      items.map(i => i.id === id ? { ...i, status: 'PROČITANO' as const } : i)
    );
  }
}
