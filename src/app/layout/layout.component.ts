import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { InvoiceService } from '../core/services/invoice.service';
import { XmlParserService } from '../core/services/xml-parser.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  animations: [
    trigger('pill', [
      state('P1',  style({ transform:'translateX(0)',    width:'42px', background:'var(--color-p1)' })),
      state('P12', style({ transform:'translateX(46px)', width:'54px', background:'var(--color-p12)' })),
      transition('* <=> *', animate('350ms cubic-bezier(0.34,1.56,0.64,1)')),
    ]),
  ],
  template: `
    <div class="app-shell" [class.p12-mode]="svc.isP12()">
      <header class="topbar">
        <div class="topbar-left">
          <a class="app-logo" routerLink="/dashboard">
            <span class="app-logo-icon">📄</span>
            <span class="app-logo-text">eRačun</span>
            <span class="app-logo-sub">CIUS-HR</span>
          </a>
          <div class="topbar-divider"></div>

          @if (onInvoice) {
            <!-- Invoice form topbar -->
            <button class="btn-back" routerLink="/dashboard">
              ← Dokumenti
            </button>
            <div class="topbar-divider"></div>
            <h1 class="page-title">{{ svc.pageTitle() }}</h1>
            <div class="mode-sw" role="group">
              <div class="mode-pill" [@pill]="svc.mode()"></div>
              <button class="mode-btn" [class.active]="!svc.isP12()" (click)="svc.setMode('P1')">P1</button>
              <button class="mode-btn" [class.active]="svc.isP12()"  (click)="svc.setMode('P12')">P12</button>
            </div>
            <nav class="view-tabs">
              <button class="vt on">Osnovno</button>
              <button class="vt">Prošireno</button>
              <button class="vt">Puno</button>
            </nav>
          } @else {
            <!-- Dashboard topbar -->
            <h1 class="page-title">Dokumenti</h1>
          }
        </div>

        <div class="topbar-right">
          @if (onInvoice) {
            @if (svc.isDirty()) { <span class="dirty-badge">● Nesačuvano</span> }
            <button class="btn-upload" (click)="xmlInput.click()">
              <span>📂</span><span>Učitaj XML</span>
            </button>
            <input #xmlInput type="file" accept=".xml" style="display:none" (change)="onXml($event)">
            @if (svc.xmlFileName()) { <span class="file-badge">📄 {{ svc.xmlFileName() }}</span> }
            <button class="btn btn-ghost">Spremi PDF</button>
            <button class="btn btn-primary">{{ svc.sendButtonLabel() }}</button>
            <button class="btn btn-danger">Obriši</button>
          } @else {
            <span class="user-info">Gordan Smadilo</span>
          }
        </div>
      </header>

      @if (onInvoice && svc.xmlFileName()) {
        <div class="file-bar">
          <span>📄</span>
          <span class="file-bar-name">{{ svc.xmlFileName() }}</span>
          <span class="file-bar-ok">✓ XML uspješno parsiran</span>
        </div>
      }

      <main class="main-content"><router-outlet /></main>
    </div>
  `,
  styles: [`
    .btn-back {
      display: flex; align-items: center; gap: 5px;
      padding: 5px 10px;
      background: var(--color-surf2);
      border: 1px solid var(--color-border);
      border-radius: 5px;
      font-size: 12px;
      font-weight: 600;
      font-family: var(--font-sans);
      color: var(--color-text2);
      cursor: pointer;
      text-decoration: none;
      transition: all .15s;
    }
    .btn-back:hover { background: var(--color-border); color: var(--color-text); }
    .user-info {
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text2);
      padding: 0 6px;
    }
  `]
})
export class LayoutComponent {
  protected svc = inject(InvoiceService);
  private parser = inject(XmlParserService);
  private router = inject(Router);
  onInvoice = false;

  constructor() {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.onInvoice = e.url.includes('/invoice');
    });
  }

  onXml(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const inv = this.parser.parse(e.target?.result as string);
        this.svc.loadFromParsed(inv, file.name);
      } catch(err: any) { alert('XML greška: ' + err.message); }
    };
    reader.readAsText(file);
    (event.target as HTMLInputElement).value = '';
  }
}
