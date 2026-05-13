import { Injectable } from '@angular/core';
import {
  Invoice, Party, InvoiceLine, Attachment,
  PaymentMeans, MonetaryTotals, TaxSubtotal,
  ProcessType, InvoiceTypeCode,
  createEmptyParty, createEmptyPayment, createEmptyTotals,
} from '../models/invoice.model';

const CAC = 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2';
const CBC = 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2';

@Injectable({ providedIn: 'root' })
export class XmlParserService {

  parse(xmlString: string): Invoice {
    const doc = new DOMParser().parseFromString(xmlString, 'text/xml');
    if (doc.querySelector('parsererror')) throw new Error('XML nije valjan');

    const g  = (p: string, ctx?: Element|Document) => this.xp(doc, p, ctx);
    const ga = (p: string, ctx?: Element|Document) => this.xpAll(doc, p, ctx);

    const profileId  = g('.//cbc:ProfileID') || g('.//cbc:CustomizationID');
    let processType: ProcessType = 'P1';
    if (profileId.includes('P12')) processType = 'P12';
    else if (profileId.includes('P2')) processType = 'P2';

    const typeCode = (g('.//cbc:InvoiceTypeCode') || g('.//cbc:CreditNoteTypeCode') || '380') as InvoiceTypeCode;

    const seller = this.parseParty(doc, './/cac:AccountingSupplierParty/cac:Party');
    const buyer  = this.parseParty(doc, './/cac:AccountingCustomerParty/cac:Party');

    const lineEls = ga('.//cac:InvoiceLine').length > 0
      ? ga('.//cac:InvoiceLine') : ga('.//cac:CreditNoteLine');

    const lines = lineEls.map((el, i) => this.parseLine(doc, el, i));
    const taxTotals = ga('.//cac:TaxTotal/cac:TaxSubtotal').map(el => this.parseTaxSubtotal(doc, el));
    const totals = this.parseTotals(doc, g);
    const payment = this.parsePayment(doc, g);
    const attachments = ga('.//cac:AdditionalDocumentReference').map(el => this.parseAttachment(el));

    const sellerContact = g('.//cac:AccountingSupplierParty/cac:Party/cac:Contact/cbc:Name');
    const sellerPhone   = g('.//cac:AccountingSupplierParty/cac:Party/cac:Contact/cbc:Telephone');
    const sellerCEmail  = g('.//cac:AccountingSupplierParty/cac:Party/cac:Contact/cbc:ElectronicMail');

    return {
      processType,
      profileId,
      specId: g('.//cbc:CustomizationID'),
      invoiceId:     g('.//cbc:ID'),
      typeCode,
      issueDate:     g('.//cbc:IssueDate') || new Date().toISOString().split('T')[0],
      issueTime:     g('.//cbc:IssueTime') || undefined,
      taxPointDate:  g('.//cbc:TaxPointDate') || undefined,
      copyIndicator: g('.//cbc:CopyIndicator') === 'true',
      currency:      g('.//cbc:DocumentCurrencyCode') || 'EUR',
      note:          g('.//cbc:Note') || undefined,
      buyerRef:      g('.//cbc:BuyerReference') || undefined,
      contractRef:   g('.//cac:ContractDocumentReference/cbc:ID') || undefined,
      deliveryStart: g('.//cac:InvoicePeriod/cbc:StartDate') || g('.//cac:Delivery/cbc:ActualDeliveryDate') || undefined,
      deliveryEnd:   g('.//cac:InvoicePeriod/cbc:EndDate') || undefined,
      seller,
      buyer,
      operator: {
        name:         sellerContact,
        oib:          seller.legalId,
        contactName:  sellerContact,
        phone:        sellerPhone,
        contactEmail: sellerCEmail || seller.endpoint,
      },
      payment,
      paymentTerms: g('.//cac:PaymentTerms/cbc:Note') || undefined,
      lines,
      taxTotals,
      totals,
      attachments,
      approval: processType === 'P12' ? { status: 'pending' } : undefined,
    };
  }

  private parseParty(doc: Document, xpath: string): Party {
    const g = (p: string) => this.xp(doc, `${xpath}/${p}`);
    return {
      name:        g('cac:PartyName/cbc:Name') || g('cac:PartyLegalEntity/cbc:RegistrationName'),
      vatId:       g('cac:PartyTaxScheme/cbc:CompanyID'),
      legalId:     g('cac:PartyLegalEntity/cbc:CompanyID'),
      street:      g('cac:PostalAddress/cbc:StreetName'),
      city:        g('cac:PostalAddress/cbc:CityName'),
      zip:         g('cac:PostalAddress/cbc:PostalZone'),
      countryCode: g('cac:PostalAddress/cac:Country/cbc:IdentificationCode') || 'HR',
      endpoint:    g('cbc:EndpointID') || g('cac:Contact/cbc:ElectronicMail'),
    };
  }

  private parsePayment(doc: Document, g: (p: string) => string): PaymentMeans {
    return {
      code:        g('.//cac:PaymentMeans/cbc:PaymentMeansCode') || '30',
      dueDate:     g('.//cac:PaymentMeans/cbc:PaymentDueDate') || undefined,
      bankAccount: g('.//cac:PaymentMeans/cac:PayeeFinancialAccount/cbc:ID'),
      bankName:    g('.//cac:PaymentMeans/cac:PayeeFinancialAccount/cac:FinancialInstitutionBranch/cbc:ID') || undefined,
      note:        g('.//cac:PaymentMeans/cbc:InstructionNote') || g('.//cac:PaymentMeans/cbc:PaymentID') || undefined,
    };
  }

  private parseLine(doc: Document, el: Element, index: number): InvoiceLine {
    const g = (p: string) => this.xp(doc, p, el);
    const qtyEl = el.querySelector('InvoicedQuantity') || el.querySelector('CreditedQuantity');
    const unitCode = qtyEl?.getAttribute('unitCode') || 'C62';
    return {
      id:          g('cbc:ID') || String(index+1),
      sku:         g('cac:Item/cac:SellersItemIdentification/cbc:ID'),
      ean:         g('cac:Item/cac:StandardItemIdentification/cbc:ID'),
      kpd:         g('cac:Item/cac:CommodityClassification/cbc:ItemClassificationCode'),
      name:        g('cac:Item/cbc:Name'),
      description: g('cac:Item/cbc:Description'),
      quantity:    parseFloat(g('cbc:InvoicedQuantity') || g('cbc:CreditedQuantity') || '0'),
      unitCode,
      price:       parseFloat(g('cac:Price/cbc:PriceAmount') || '0'),
      discountPct: 0,
      netAmount:   parseFloat(g('cbc:LineExtensionAmount') || '0'),
      taxCategory: {
        id:      g('cac:Item/cac:ClassifiedTaxCategory/cbc:ID') || 'S',
        percent: parseFloat(g('cac:Item/cac:ClassifiedTaxCategory/cbc:Percent') || '25'),
        scheme:  'VAT',
      },
    };
  }

  private parseTaxSubtotal(doc: Document, el: Element): TaxSubtotal {
    const g = (p: string) => this.xp(doc, p, el);
    return {
      taxableAmount: parseFloat(g('cbc:TaxableAmount') || '0'),
      taxAmount:     parseFloat(g('cbc:TaxAmount') || '0'),
      category: {
        id:      g('cac:TaxCategory/cbc:ID') || 'S',
        percent: parseFloat(g('cac:TaxCategory/cbc:Percent') || '25'),
        scheme:  'VAT',
      },
    };
  }

  private parseTotals(doc: Document, g: (p: string) => string): MonetaryTotals {
    const n = (p: string) => parseFloat(g(p) || '0');
    return {
      lineExtAmount:   n('.//cac:LegalMonetaryTotal/cbc:LineExtensionAmount'),
      allowanceAmount: n('.//cac:LegalMonetaryTotal/cbc:AllowanceTotalAmount'),
      chargeAmount:    n('.//cac:LegalMonetaryTotal/cbc:ChargeTotalAmount'),
      taxExclAmount:   n('.//cac:LegalMonetaryTotal/cbc:TaxExclusiveAmount'),
      taxAmount:       n('.//cac:TaxTotal/cbc:TaxAmount'),
      taxInclAmount:   n('.//cac:LegalMonetaryTotal/cbc:TaxInclusiveAmount'),
      prepaidAmount:   n('.//cac:LegalMonetaryTotal/cbc:PrepaidAmount'),
      roundingAmount:  n('.//cac:LegalMonetaryTotal/cbc:PayableRoundingAmount'),
      payableAmount:   n('.//cac:LegalMonetaryTotal/cbc:PayableAmount'),
    };
  }

  private parseAttachment(el: Element): Attachment {
    const g = (s: string) => el.querySelector(s)?.textContent?.trim() || '';
    const b64Node = el.querySelector('EmbeddedDocumentBinaryObject');
    const b64     = b64Node?.textContent?.trim() || '';
    return {
      id:          g('ID'),
      typeCode:    g('DocumentTypeCode'),
      description: g('DocumentDescription'),
      filename:    b64Node?.getAttribute('filename') || g('ID'),
      mimeType:    b64Node?.getAttribute('mimeCode') || b64Node?.getAttribute('mimecode') || '',
      b64Data:     b64,
      externalUri: el.querySelector('ExternalReference URI')?.textContent?.trim() || '',
      sizeBytes:   b64 ? Math.round((b64.length * 3) / 4) : 0,
    };
  }

  private nsResolver(doc: Document) {
    return (prefix: string): string | null =>
      ({ cac:CAC, cbc:CBC, inv: doc.documentElement.namespaceURI||'' })[prefix] ?? null;
  }

  private xp(doc: Document, path: string, ctx?: Element|Document|null): string {
    try {
      const r = doc.evaluate(path, ctx||doc, this.nsResolver(doc) as XPathNSResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      return r.singleNodeValue?.textContent?.trim() || '';
    } catch { return ''; }
  }

  private xpAll(doc: Document, path: string, ctx?: Element|Document|null): Element[] {
    try {
      const r = doc.evaluate(path, ctx||doc, this.nsResolver(doc) as XPathNSResolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      const nodes: Element[] = [];
      for (let i=0; i<r.snapshotLength; i++) nodes.push(r.snapshotItem(i) as Element);
      return nodes;
    } catch { return []; }
  }
}
