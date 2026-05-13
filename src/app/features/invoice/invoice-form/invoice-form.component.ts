import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { InvoiceService } from '../../../core/services/invoice.service';
import { INVOICE_TYPE_LABELS, P1_TYPE_CODES, P12_TYPE_CODES } from '../../../core/models/invoice.model';
import { oibValidator, ibanValidator } from '../../../shared/validators/validators';
import { HrCurrencyPipe, BtDatePipe } from '../../../shared/pipes/pipes';

const slideIn = trigger('slideIn', [
  state('false', style({ maxHeight:'0', opacity:0, overflow:'hidden' })),
  state('true',  style({ maxHeight:'1500px', opacity:1 })),
  transition('false => true', animate('420ms cubic-bezier(0.4,0,0.2,1)')),
  transition('true => false', animate('280ms cubic-bezier(0.4,0,0.2,1)')),
]);

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HrCurrencyPipe, BtDatePipe],
  animations: [slideIn],
  template: `
  <div class="invoice-form-wrap" [class.p12-mode]="isP12()">

    <!-- ROW 1 -->
    <div class="form-grid-3">

      <!-- KUPAC + PRODAVATELJ -->
      <section class="panel acc-ring">
        <div class="panel-header">
          <span class="panel-title">
            Podaci o kupcu
            @if (isP12()) { <span class="bdg bdg-p12">Kreator računa</span> }
          </span>
        </div>
        <div class="panel-body">
          <div class="field-row"><span class="field-label">Puno ime kupca (BT-44):</span><span class="field-value">{{ inv().buyer.name || '—' }}</span></div>
          <div class="field-row"><span class="field-label">Adresa kupca (BT-50):</span><span class="field-value">{{ inv().buyer.street || '—' }}</span></div>
          <div class="field-row"><span class="field-label">Grad kupca (BT-52):</span><span class="field-value">{{ inv().buyer.city || '—' }}</span></div>
          <div class="field-row"><span class="field-label">Poštanski broj kupca (BT-53):</span><span class="field-value field-mono">{{ inv().buyer.zip || '—' }}</span></div>
          <div class="field-row"><span class="field-label">Šifra države kupca (BT-55):</span><span class="field-value field-mono">{{ inv().buyer.countryCode || '—' }}</span></div>
          <div class="field-row"><span class="field-label">E-mail:</span><span class="field-value">{{ inv().buyer.endpoint || '—' }}</span></div>
          <div class="field-row">
            <span class="field-label">Referenca kupca (BT-10):</span>
            <input type="text" class="field-input" [formControl]="$any(buyerForm.get('buyerRef'))"
              [placeholder]="isP12() ? 'Ref. ugovora o samoizdavanju...' : ''"
              (blur)="svc.patchInvoice({buyerRef: buyerForm.get('buyerRef')?.value})">
          </div>
          <div class="field-row">
            <span class="field-label">Org. jedinica primatelja:</span>
            <input type="text" class="field-input" placeholder="Neobavezno...">
          </div>
        </div>

        <!-- PRODAVATELJ P12 -->
        <div [@slideIn]="isP12().toString()" style="overflow:hidden">
          @if (isP12()) {
            <div class="p12-sub-label subsection-label">🏢 Podaci o prodavatelju</div>
            <div class="panel-body">
              <div class="field-row">
                <span class="field-label">OIB Prodavatelja: <span class="req">*</span></span>
                <div class="input-with-action">
                  <input type="text" class="field-input" [formControl]="$any(sellerForm.get('legalId'))" placeholder="11-znamenkasti OIB">
                  <button class="btn-lookup" type="button">🔍</button>
                </div>
              </div>
              <div class="field-row"><span class="field-label">Naziv prodavatelja (BT-27):</span><span class="field-value">{{ inv().seller.name || '—' }}</span></div>
              <div class="field-row"><span class="field-label">Adresa prodavatelja (BT-35):</span><span class="field-value">{{ inv().seller.street || '—' }}</span></div>
              <div class="field-row"><span class="field-label">Grad prodavatelja (BT-37):</span><span class="field-value">{{ inv().seller.city || '—' }}</span></div>
              <div class="field-row"><span class="field-label">Poštanski br. (BT-38):</span><span class="field-value field-mono">{{ inv().seller.zip || '—' }}</span></div>
              <div class="field-row"><span class="field-label">Kod države (BT-40):</span><span class="field-value field-mono">{{ inv().seller.countryCode || '—' }}</span></div>
              <div class="field-row"><span class="field-label">E-mail / AMS (BT-34): <span class="req">*</span></span><span class="field-value">{{ inv().seller.endpoint || '—' }}</span></div>

              <!-- APPROVAL -->
              <div class="approval-block">
                <div class="approval-title">✅ Status prihvata od strane Prodavatelja</div>
                <div class="approval-chips">
                  @for (o of approvalOpts; track o.v) {
                    <button type="button" class="chip"
                      [class.chip-active]="inv().approval?.status === o.v"
                      [class]="'chip chip-' + o.v + (inv().approval?.status === o.v ? ' chip-active' : '')"
                      (click)="setApproval(o.v)">
                      <span class="chip-icon">{{ o.icon }}</span>
                      <span class="chip-label">{{ o.label }}</span>
                    </button>
                  }
                </div>
                <div class="approval-meta">
                  <span class="meta-label">Datum prihvata:</span>
                  <span class="meta-value">{{ inv().approval?.date | btDate }}</span>
                  <span class="meta-label">Napomena:</span>
                  <span class="meta-value">{{ inv().approval?.note || '—' }}</span>
                </div>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- DETALJI RAČUNA -->
      <section class="panel">
        <div class="panel-header"><span class="panel-title">Detalji računa</span><button class="collapse-btn">⊙</button></div>
        <div class="panel-body" [formGroup]="detailsForm">
          <div class="field-row">
            <span class="field-label">Broj računa (BT-1): <span class="req">*</span></span>
            <input type="text" class="field-input field-mono" formControlName="invoiceId"
              (blur)="svc.patchInvoice({invoiceId: detailsForm.get('invoiceId')?.value})">
          </div>
          <div class="field-row">
            <span class="field-label">Tip poslovnog procesa (BT-23): <span class="req">*</span></span>
            @if (isP12()) {
              <span class="field-locked">🔒 P12 — Samoizdavanje računa</span>
            } @else {
              <select class="field-select" formControlName="processType"
                (change)="svc.setMode(detailsForm.get('processType')?.value)">
                <option value="P1">P1 — Izdavanje računa za isporuke</option>
                <option value="P2">P2 — Periodično izdavanje</option>
                <option value="P3">P3 — Predujam</option>
                <option value="P12">P12 — Samoizdavanje računa</option>
              </select>
            }
          </div>
          <div class="field-row">
            <span class="field-label">Datum i vr. izdavanja (HR-BT-2): <span class="req">*</span></span>
            <span class="field-value field-mono">{{ inv().issueDate | btDate }}</span>
          </div>
          <div class="field-row">
            <span class="field-label">Datum nastupa PDV-a (BT-7):</span>
            <input type="date" class="field-input" formControlName="taxPointDate">
          </div>
          <div class="field-row">
            <span class="field-label">Indikator kopije: <span class="req">*</span></span>
            <select class="field-select" formControlName="copyIndicator">
              <option [value]="false">Ne</option><option [value]="true">Da</option>
            </select>
          </div>
          <div class="field-row">
            <span class="field-label">
              Vrsta računa (BT-3): <span class="req">*</span>
              @if (isP12()) { <span class="bdg bdg-mod">Izmijenjeno</span> }
            </span>
            <select class="field-select" formControlName="typeCode"
              (change)="svc.patchInvoice({typeCode: detailsForm.get('typeCode')?.value})">
              @for (c of allowedCodes(); track c) {
                <option [value]="c">{{ typeLabels[c] || c }}</option>
              }
            </select>
          </div>
          <div class="field-row">
            <span class="field-label">Valuta (BT-5): <span class="req">*</span></span>
            <select class="field-select" formControlName="currency"
              (change)="svc.patchInvoice({currency: detailsForm.get('currency')?.value})">
              <option>EUR</option><option>USD</option><option>CHF</option>
            </select>
          </div>

          <div class="subsection-label">Reference</div>
          <div class="field-row">
            <span class="field-label">Datum isporuke / Obračunsko razd. (BT-72-74): <span class="req">*</span></span>
            <div class="date-range">
              <input type="date" class="field-input" formControlName="deliveryStart">
              <span class="date-sep">—</span>
              <input type="date" class="field-input" formControlName="deliveryEnd">
            </div>
          </div>
          <div class="field-row" [class.contract-highlight]="isP12()">
            <span class="field-label">Ugovor (BT-12): @if (isP12()) { <span class="req">*</span> }</span>
            <input type="text" class="field-input field-mono" formControlName="contractRef"
              placeholder="Broj ugovora..."
              (blur)="svc.patchInvoice({contractRef: detailsForm.get('contractRef')?.value})">
          </div>
        </div>
      </section>

      <!-- PLAĆANJE + PRIMATELJ + POREZNI -->
      <div class="right-col">
        <section class="panel">
          <div class="panel-header"><span class="panel-title">Informacije o plaćanju</span><button class="collapse-btn">⊙</button></div>
          <div class="panel-body" [formGroup]="paymentForm">
            <div class="field-row">
              <span class="field-label">Bankovni račun (BT-84): <span class="req">*</span>
                @if (isP12()) { <span class="bdg bdg-mod">Prodavateljev</span> }
              </span>
              <input type="text" class="field-input field-mono" formControlName="bankAccount" placeholder="HR...">
            </div>
            <div class="field-row">
              <span class="field-label">Metoda plaćanja (BT-81,82): <span class="req">*</span></span>
              <select class="field-select" formControlName="paymentCode">
                <option value="30">30 — Transakcijski račun</option>
                <option value="10">10 — Gotovina</option>
                <option value="48">48 — Kartica</option>
              </select>
            </div>
            <div class="field-row">
              <span class="field-label">Tekst prijenosa (BT-83):</span>
              <input type="text" class="field-input" formControlName="paymentNote">
            </div>
            <div class="field-row">
              <span class="field-label">Uvjeti plaćanja (BT-20):</span>
              <input type="text" class="field-input" formControlName="paymentTerms">
            </div>
            <div class="field-row">
              <span class="field-label">Datum dospijeća (BT-9): <span class="req">*</span></span>
              <input type="date" class="field-input" formControlName="dueDate">
            </div>
          </div>
        </section>
        <section class="panel"><div class="panel-header"><span class="panel-title">Primatelj</span><button class="collapse-btn">⊙</button></div></section>
        <section class="panel"><div class="panel-header"><span class="panel-title">Porezni predstavnik</span><button class="collapse-btn">⊙</button></div></section>
      </div>
    </div>

    <!-- DOSTAVA -->
    <section class="panel">
      <div class="panel-header"><span class="panel-title">Informacije o dostavi</span><button class="collapse-btn">⊙</button></div>
    </section>

    <!-- STAVKE -->
    <section class="panel">
      <div class="panel-header stavke-header">
        <span class="panel-title">
          Stavke
          <span class="line-count">{{ inv().lines.length }} stavk{{ inv().lines.length === 1 ? 'a' : inv().lines.length < 5 ? 'e' : 'i' }}</span>
        </span>
        <div class="stavke-actions">
          <button class="btn-ghost-sm" type="button" (click)="svc.addLine()">+ Dodaj</button>
          <button class="btn-ghost-sm" type="button">Dodaj iz liste</button>
          @if (isP12()) {
            <button class="btn-catalog" type="button">🗂 Iz kataloga Prodavatelja</button>
          }
        </div>
      </div>
      <div class="table-scroll">
        <table class="lines-table">
          <thead>
            <tr>
              <th style="width:28px">#</th>
              <th>Šifra/SKU (BT-155)</th><th>EAN (BT-157)</th>
              <th>KPD (BT-158)</th><th>Naziv (BT-153)</th><th>Opis (BT-154)</th>
              <th class="th-r">Kol. (BT-129)</th><th>Jed.</th>
              <th class="th-r">Cijena (BT-148)</th><th class="th-r">Pop.%</th>
              <th class="th-r">Neto cijena</th><th>PDV%</th>
              <th style="width:32px"></th>
            </tr>
          </thead>
          <tbody>
            @if (!inv().lines.length) {
              <tr><td colspan="13" class="empty-row">Nema stavki — kliknite "+ Dodaj" ili učitajte XML</td></tr>
            }
            @for (ln of inv().lines; track ln.id; let i = $index) {
              <tr>
                <td class="td-num">{{ ln.id }}</td>
                <td><input type="text" class="td-input mono" [value]="ln.sku" (blur)="svc.updateLine(i,'sku',$any($event.target).value)"></td>
                <td><input type="text" class="td-input mono" [value]="ln.ean" (blur)="svc.updateLine(i,'ean',$any($event.target).value)"></td>
                <td><input type="text" class="td-input" [value]="ln.kpd" (blur)="svc.updateLine(i,'kpd',$any($event.target).value)" placeholder="KPD..."></td>
                <td><input type="text" class="td-input bold" [value]="ln.name" (blur)="svc.updateLine(i,'name',$any($event.target).value)"></td>
                <td><input type="text" class="td-input muted" [value]="ln.description" (blur)="svc.updateLine(i,'description',$any($event.target).value)"></td>
                <td class="td-r"><input type="number" class="td-input td-r mono" [value]="ln.quantity" min="0" step="0.01" (blur)="svc.updateLine(i,'quantity',+$any($event.target).value)" style="width:60px"></td>
                <td>
                  <select class="td-select" [value]="ln.unitCode" (change)="svc.updateLine(i,'unitCode',$any($event.target).value)">
                    <option value="C62">kom</option><option value="HUR">h</option><option value="KGM">kg</option><option value="MTR">m</option>
                  </select>
                </td>
                <td class="td-r"><input type="number" class="td-input td-r mono" [value]="ln.price" min="0" step="0.01" (blur)="svc.updateLine(i,'price',+$any($event.target).value)" style="width:75px"></td>
                <td class="td-r"><input type="number" class="td-input td-r" [value]="ln.discountPct" min="0" max="100" (blur)="svc.updateLine(i,'discountPct',+$any($event.target).value)" style="width:45px"></td>
                <td class="td-r mono">{{ ln.netAmount | hrCurrency:'' }}</td>
                <td>
                  <select class="td-select" [value]="ln.taxCategory.percent"
                    (change)="svc.updateLine(i,'taxCategory',{id:'S',percent:+$any($event.target).value,scheme:'VAT'})">
                    <option [value]="25">25% STD</option><option [value]="13">13% SNI</option><option [value]="5">5% SNI</option><option [value]="0">0% OSL</option>
                  </select>
                </td>
                <td><button class="btn-remove" type="button" (click)="svc.removeLine(i)">×</button></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>

    <!-- DONJI RED -->
    <div class="form-grid-3b">
      <section class="panel">
        <div class="panel-header"><span class="panel-title">Popust / Naknada za račun</span><button class="collapse-btn">⊙</button></div>
        <div class="panel-body empty-panel">Nema popusta / naknada</div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <span class="panel-title">
            @if (isP12()) { Operater i kontakt — Kupac (kreator) <span class="bdg bdg-mod">P12</span> }
            @else { Operater i kontakt prodavatelja }
          </span>
        </div>
        <div class="panel-body" [formGroup]="operatorForm">
          <div class="field-row"><span class="field-label">Ime i prezime (HR-BT-4): <span class="req">*</span></span><input type="text" class="field-input" formControlName="name"></div>
          <div class="field-row"><span class="field-label">OIB operatera (HR-BT-5): <span class="req">*</span></span><input type="text" class="field-input field-mono" formControlName="oib"></div>
          <div class="field-row"><span class="field-label">Ime (BT-41): <span class="req">*</span></span><input type="text" class="field-input" formControlName="contactName"></div>
          <div class="field-row"><span class="field-label">Telefon (BT-42):</span><input type="text" class="field-input" formControlName="phone"></div>
          <div class="field-row"><span class="field-label">E-mail (BT-43):</span><input type="text" class="field-input" formControlName="contactEmail"></div>
          @if (isP12()) {
            <p class="operator-note">HR-BT-4/5: operater kupca koji kreira P12 račun · BT-41/42/43: kontakt prodavatelja</p>
          }
        </div>
      </section>

      <section class="panel">
        <div class="panel-header"><span class="panel-title">Sažetak</span></div>
        <div class="panel-body">
          <div class="sazetak-tabs"><button class="sz-tab active">Sve</button><button class="sz-tab">Prema porezu</button></div>
          <div class="sazetak-header-row"><span>Naziv</span><span>Vrijednost</span></div>
          <div class="sz-row"><span>Međubroj stavke (BT-106)</span><span class="mono">{{ inv().totals.lineExtAmount | hrCurrency: inv().currency }}</span></div>
          <div class="sz-row"><span>Ukupni popust (BT-107)</span><span class="mono">{{ inv().totals.allowanceAmount | hrCurrency: inv().currency }}</span></div>
          <div class="sz-row"><span>Ukupno bez poreza (BT-109)</span><span class="mono">{{ inv().totals.taxExclAmount | hrCurrency: inv().currency }}</span></div>
          <div class="sz-row"><span>Ukupno porez (BT-110)</span><span class="mono">{{ inv().totals.taxAmount | hrCurrency: inv().currency }}</span></div>
          <div class="sz-row"><span>Ukupno (BT-112)</span><span class="mono">{{ inv().totals.taxInclAmount | hrCurrency: inv().currency }}</span></div>
          <div class="sz-row"><span>Plaćeno (BT-113)</span><span class="mono">{{ inv().totals.prepaidAmount | hrCurrency: inv().currency }}</span></div>
          <div class="sz-row"><span>Zaokruživanje (BT-114)</span><span class="mono">{{ inv().totals.roundingAmount | hrCurrency: inv().currency }}</span></div>
          <div class="sz-row sz-total"><span>Za naplatu (BT-115)</span><span class="mono">{{ inv().totals.payableAmount | hrCurrency: inv().currency }}</span></div>
        </div>
      </section>
    </div>

    <!-- BILJEŠKE + RAZLOG -->
    <div class="form-grid-2">
      <section class="panel">
        <div class="panel-header"><span class="panel-title">Bilješke (BT-22)</span><button class="collapse-btn">⊙</button></div>
        <div class="panel-body">
          <textarea class="field-textarea" rows="3" [value]="inv().note || ''"
            (blur)="svc.patchInvoice({note: $any($event.target).value})"
            placeholder="Slobodan tekst..."></textarea>
          @if (isP12()) {
            <p class="field-hint">U P12: ovdje se može navesti datum ugovora sukladno čl. 224 Direktive</p>
          }
        </div>
      </section>
      <section class="panel">
        <div class="panel-header"><span class="panel-title">Razlog izuzeća PDV-a (BT-120)</span><button class="collapse-btn">⊙</button></div>
        <div class="panel-body"><input type="text" class="field-input" placeholder="Neobavezno..."></div>
      </section>
    </div>

    <!-- FISKALIZACIJA P12 -->
    <div [@slideIn]="isP12().toString()" style="overflow:hidden">
      @if (isP12()) {
        <section class="panel acc-ring" style="margin-top:0">
          <div class="panel-header">
            <span class="panel-title">🔐 Fiskalizacija P12 — Status i tijek <span class="bdg bdg-p12">P12</span></span>
          </div>
          <div class="panel-body">
            <div class="fisk-grid">
              <div>
                <div class="fisk-side-title teal">Kupac (Vi) — Ulazni eRačun</div>
                @for (s of buyerSteps; track s.label) {
                  <div class="fisk-step">
                    <div class="fisk-dot" [class]="'fisk-dot-'+s.st">{{ s.icon }}</div>
                    <div><div class="fisk-label">{{ s.label }}</div><div class="fisk-sub">{{ s.sub }}</div></div>
                  </div>
                }
              </div>
              <div>
                <div class="fisk-side-title green">Prodavatelj — Izlazni eRačun</div>
                @for (s of sellerSteps; track s.label) {
                  <div class="fisk-step">
                    <div class="fisk-dot" [class]="'fisk-dot-'+s.st">{{ s.icon }}</div>
                    <div><div class="fisk-label">{{ s.label }}</div><div class="fisk-sub">{{ s.sub }}</div></div>
                  </div>
                }
              </div>
            </div>
          </div>
        </section>
      }
    </div>

  </div>
  `
})
export class InvoiceFormComponent implements OnInit {
  protected svc = inject(InvoiceService);
  protected isP12 = this.svc.isP12;
  protected inv = this.svc.invoice;
  protected allowedCodes = this.svc.allowedTypeCodes;
  protected typeLabels = INVOICE_TYPE_LABELS;
  private fb = inject(FormBuilder);

  buyerForm!: FormGroup;
  sellerForm!: FormGroup;
  detailsForm!: FormGroup;
  paymentForm!: FormGroup;
  operatorForm!: FormGroup;

  approvalOpts = [
    { v:'approved', icon:'✅', label:'Prihvaćen' },
    { v:'pending',  icon:'⏳', label:'Na čekanju' },
    { v:'rejected', icon:'❌', label:'Odbijen' },
  ];
  buyerSteps = [
    { label:'Kreiranje XML (P12, UBL 2.1)', sub:'BT-23 = P12', st:'done', icon:'✓' },
    { label:'AMS lookup adrese Prodavatelja', sub:'Pronalazak pristupne točke', st:'done', icon:'✓' },
    { label:'EvidentirajERacun — ulazni', sub:'Fiskalizacija prema Poreznoj upravi', st:'active', icon:'⋯' },
    { label:'eIzvještavanje o naplati', sub:'Do 20. u idućem mjesecu', st:'pending', icon:'4' },
  ];
  sellerSteps = [
    { label:'Primitak na pristupnoj točki', sub:'AP prodavatelja prima P12', st:'pending', icon:'1' },
    { label:'EvidentirajERacun — izlazni', sub:'Prodavatelj fiskalizira svoju stranu', st:'pending', icon:'2' },
    { label:'Prihvat / odbijanje eRačuna', sub:'Rok: 5 radnih dana', st:'pending', icon:'3' },
    { label:'eIzvještavanje Prodavatelja', sub:'Do 20. u idućem mjesecu', st:'pending', icon:'4' },
  ];

  ngOnInit(): void {
    const inv = this.inv();
    this.buyerForm    = this.fb.group({ buyerRef: [inv.buyerRef||''] });
    this.sellerForm   = this.fb.group({ legalId: [inv.seller.legalId, [oibValidator()]] });
    this.detailsForm  = this.fb.group({
      invoiceId: [inv.invoiceId], processType: [inv.processType],
      taxPointDate: [inv.taxPointDate||''], copyIndicator: [inv.copyIndicator],
      typeCode: [inv.typeCode], currency: [inv.currency],
      deliveryStart: [inv.deliveryStart||''], deliveryEnd: [inv.deliveryEnd||''],
      contractRef: [inv.contractRef||''],
    });
    this.paymentForm  = this.fb.group({
      bankAccount: [inv.payment.bankAccount, [ibanValidator()]],
      paymentCode: [inv.payment.code], paymentNote: [inv.payment.note||''],
      paymentTerms: [inv.paymentTerms||''], dueDate: [inv.payment.dueDate||''],
    });
    this.operatorForm = this.fb.group({
      name: [inv.operator.name], oib: [inv.operator.oib, [oibValidator()]],
      contactName: [inv.operator.contactName], phone: [inv.operator.phone],
      contactEmail: [inv.operator.contactEmail],
    });
  }

  setApproval(status: string): void {
    this.svc.patchInvoice({
      approval: {
        status: status as any,
        date: status !== 'pending' ? new Date().toISOString().split('T')[0] : undefined,
      }
    });
  }
}
