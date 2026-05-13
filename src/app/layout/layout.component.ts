import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { InvoiceService } from '../core/services/invoice.service';
import { XmlParserService } from '../core/services/xml-parser.service';

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
          <a class="app-logo" routerLink="/">
            <span class="app-logo-icon">📄</span>
            <span class="app-logo-text">eRačun</span>
            <span class="app-logo-sub">CIUS-HR</span>
          </a>
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
        </div>
        <div class="topbar-right">
          @if (svc.isDirty()) { <span class="dirty-badge">● Nesačuvano</span> }
          <button class="btn-upload" (click)="xmlInput.click()">
            <span>📂</span><span>Učitaj XML</span>
          </button>
          <input #xmlInput type="file" accept=".xml" style="display:none" (change)="onXml($event)">
          @if (svc.xmlFileName()) { <span class="file-badge">📄 {{ svc.xmlFileName() }}</span> }
          <button class="btn btn-ghost" (click)="svc.reset()">Nova forma</button>
          <button class="btn btn-ghost">Spremi PDF</button>
          <button class="btn btn-primary">{{ svc.sendButtonLabel() }}</button>
          <button class="btn btn-danger">Obriši</button>
        </div>
      </header>
      @if (svc.xmlFileName()) {
        <div class="file-bar">
          <span>📄</span>
          <span class="file-bar-name">{{ svc.xmlFileName() }}</span>
          <span class="file-bar-ok">✓ XML uspješno parsiran</span>
        </div>
      }
      <main class="main-content"><router-outlet /></main>
    </div>
  `
})
export class LayoutComponent {
  protected svc = inject(InvoiceService);
  private parser = inject(XmlParserService);
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
