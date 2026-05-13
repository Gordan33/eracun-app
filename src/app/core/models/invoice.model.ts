// src/app/core/models/invoice.model.ts

// ─── Process types ────────────────────────────────────────────────────────────
export type ProcessType =
  | 'P1' | 'P2' | 'P3' | 'P4' | 'P5'
  | 'P6' | 'P7' | 'P8' | 'P9' | 'P10'
  | 'P11' | 'P12' | 'P99';

export const PROCESS_TYPE_LABELS: Record<string, string> = {
  P1:  'P1 — Izdavanje računa za isporuke robe i usluga',
  P2:  'P2 — Periodično izdavanje računa',
  P3:  'P3 — Predujam za isporuku robe ili usluga',
  P4:  'P4 — Prilaganje ponude ili naloga',
  P5:  'P5 — Plaćanje na licu mjesta',
  P12: 'P12 — Samoizdavanje računa',
  P99: 'P99 — Ostalo',
};

// ─── Invoice type codes (UNTDID 1001) ────────────────────────────────────────
export type InvoiceTypeCode =
  | '380' | '381' | '383' | '386' | '84'   // P1 codes
  | '389' | '261' | '527';                  // P12 codes

export const P1_TYPE_CODES: InvoiceTypeCode[] = ['380', '381', '383', '386', '84'];
export const P12_TYPE_CODES: InvoiceTypeCode[] = ['389', '261', '527'];

export const INVOICE_TYPE_LABELS: Record<string, string> = {
  '380': '380 — Komercijalni račun',
  '381': '381 — Odobrenje',
  '383': '383 — Terećenje',
  '386': '386 — Predujam',
  '84':  '84 — Konačni račun',
  '389': '389 — Samoizdavajući račun',
  '261': '261 — Samoizdavajuće odobrenje',
  '527': '527 — Samoizdavajuće terećenje',
};

// ─── Party (Seller BG-4 / Buyer BG-7) ────────────────────────────────────────
export interface Party {
  name:         string;  // BT-27 seller / BT-44 buyer
  vatId:        string;  // BT-31 seller / BT-48 buyer (HR prefix)
  legalId:      string;  // BT-30 seller / BT-47 buyer (OIB)
  street:       string;  // BT-35 seller / BT-50 buyer
  city:         string;  // BT-37 seller / BT-52 buyer
  zip:          string;  // BT-38 seller / BT-53 buyer
  county?:      string;  // BT-39 seller / BT-54 buyer
  countryCode:  string;  // BT-40 seller / BT-55 buyer
  endpoint:     string;  // BT-34 seller / BT-49 buyer (AMS / Peppol)
  reference?:   string;  // BT-10 (buyer only)
  orgUnit?:     string;  // organisation unit
}

// ─── Operator (HR extensions BG-4 extension) ─────────────────────────────────
export interface Operator {
  name:          string;  // HR-BT-4  Oznaka operatera
  oib:           string;  // HR-BT-5  OIB operatera
  contactName:   string;  // BT-41    Ime kontakta
  phone:         string;  // BT-42    Telefon
  contactEmail:  string;  // BT-43    E-mail kontakta
}

// ─── Tax category ─────────────────────────────────────────────────────────────
export interface TaxCategory {
  id:        string;  // S=standard, Z=zero, E=exempt, AE=reverse charge
  percent:   number;
  scheme:    string;  // VAT
}

// ─── Invoice line (BG-25) ─────────────────────────────────────────────────────
export interface InvoiceLine {
  id:           string;   // BT-126
  sku:          string;   // BT-155 Seller item ID
  ean:          string;   // BT-157 Standard item ID (EAN/GTIN)
  kpd:          string;   // BT-158 Classification code (KPD/CPV)
  name:         string;   // BT-153
  description:  string;   // BT-154
  quantity:     number;   // BT-129
  unitCode:     string;   // BT-130 (UN/ECE Rec 20)
  price:        number;   // BT-146 Net price
  discountPct:  number;   // line discount %
  netAmount:    number;   // BT-131
  taxCategory:  TaxCategory;
}

// ─── Attachment (cac:AdditionalDocumentReference) ────────────────────────────
export interface Attachment {
  id:           string;
  typeCode:     string;   // UNTDID 1001 / 916 / 50 etc.
  description:  string;
  filename:     string;
  mimeType:     string;
  b64Data:      string;   // EmbeddedDocumentBinaryObject (base64)
  externalUri:  string;   // ExternalReference/URI
  sizeBytes?:   number;
}

// ─── Approval status (P12 only) ───────────────────────────────────────────────
export type ApprovalStatusType = 'pending' | 'approved' | 'rejected';

export interface ApprovalStatus {
  status:   ApprovalStatusType;
  date?:    string;
  note?:    string;
}

// ─── Fiscalization status (P12 only) ─────────────────────────────────────────
export interface FiscalizationStep {
  done:     boolean;
  date?:    string;
  jir?:     string;   // Jedinstveni identifikator računa
  zki?:     string;   // Zaštitni kod izdavatelja
}

export interface FiscalizationStatus {
  // Kupac — ulazni eRačun
  buyer: {
    xmlCreated:   FiscalizationStep;
    amsLookup:    FiscalizationStep;
    fiscalized:   FiscalizationStep;
    reported:     FiscalizationStep;
  };
  // Prodavatelj — izlazni eRačun
  seller: {
    received:     FiscalizationStep;
    fiscalized:   FiscalizationStep;
    approved:     FiscalizationStep;
    reported:     FiscalizationStep;
  };
}

// ─── Payment means ────────────────────────────────────────────────────────────
export interface PaymentMeans {
  code:         string;  // BT-81 (30=bank transfer, 10=cash...)
  dueDate?:     string;  // BT-9
  bankAccount:  string;  // BT-84 (IBAN)
  bankName?:    string;
  note?:        string;  // BT-83
}

// ─── Monetary totals (BG-22) ──────────────────────────────────────────────────
export interface MonetaryTotals {
  lineExtAmount:   number;  // BT-106
  allowanceAmount: number;  // BT-107
  chargeAmount:    number;  // BT-108
  taxExclAmount:   number;  // BT-109
  taxAmount:       number;  // BT-110
  taxInclAmount:   number;  // BT-112
  prepaidAmount:   number;  // BT-113
  roundingAmount:  number;  // BT-114
  payableAmount:   number;  // BT-115
}

// ─── Tax total ────────────────────────────────────────────────────────────────
export interface TaxSubtotal {
  taxableAmount: number;
  taxAmount:     number;
  category:      TaxCategory;
}

// ─── Main Invoice model ───────────────────────────────────────────────────────
export interface Invoice {
  // ── Identification ──────────────────────────────────────────────
  id?:            string;   // internal DB id
  processType:    ProcessType;        // BT-23
  specId:         string;             // BT-24
  invoiceId:      string;             // BT-1
  typeCode:       InvoiceTypeCode;    // BT-3
  profileId?:     string;             // ProfileID (from XML)

  // ── Dates ───────────────────────────────────────────────────────
  issueDate:      string;             // BT-2  (ISO 8601)
  issueTime?:     string;             // HR-BT-2 extension
  taxPointDate?:  string;             // BT-7
  deliveryStart?: string;             // BT-73
  deliveryEnd?:   string;             // BT-74

  // ── Flags ───────────────────────────────────────────────────────
  copyIndicator:  boolean;            // HR-BT-1

  // ── Currency ────────────────────────────────────────────────────
  currency:       string;             // BT-5
  taxCurrency?:   string;             // BT-6

  // ── Text ────────────────────────────────────────────────────────
  note?:          string;             // BT-22
  vatExemptReason?: string;           // BT-120

  // ── References ──────────────────────────────────────────────────
  buyerRef?:      string;             // BT-10
  contractRef?:   string;             // BT-12
  orderRef?:      string;             // BT-13
  despatchRef?:   string;             // BT-16

  // ── Parties ─────────────────────────────────────────────────────
  seller:         Party;              // BG-4
  buyer:          Party;              // BG-7
  operator:       Operator;           // HR extension

  // ── Payment ─────────────────────────────────────────────────────
  payment:        PaymentMeans;       // BG-16
  paymentTerms?:  string;             // BT-20

  // ── Lines ───────────────────────────────────────────────────────
  lines:          InvoiceLine[];      // BG-25

  // ── Totals ──────────────────────────────────────────────────────
  taxTotals:      TaxSubtotal[];      // BG-23
  totals:         MonetaryTotals;     // BG-22

  // ── Attachments ─────────────────────────────────────────────────
  attachments:    Attachment[];       // cac:AdditionalDocumentReference

  // ── P12 specific ─────────────────────────────────────────────────
  approval?:      ApprovalStatus;
  fiscalization?: FiscalizationStatus;
}

// ─── Factory functions ────────────────────────────────────────────────────────
export function createEmptyParty(): Party {
  return {
    name: '', vatId: '', legalId: '', street: '',
    city: '', zip: '', countryCode: 'HR', endpoint: '',
  };
}

export function createEmptyOperator(): Operator {
  return { name: '', oib: '', contactName: '', phone: '', contactEmail: '' };
}

export function createEmptyPayment(): PaymentMeans {
  return { code: '30', bankAccount: '' };
}

export function createEmptyTotals(): MonetaryTotals {
  return {
    lineExtAmount: 0, allowanceAmount: 0, chargeAmount: 0,
    taxExclAmount: 0, taxAmount: 0, taxInclAmount: 0,
    prepaidAmount: 0, roundingAmount: 0, payableAmount: 0,
  };
}

export function createEmptyInvoice(): Invoice {
  return {
    processType:   'P1',
    specId: 'urn:cen.eu:en16931:2017#compliant#urn:mfin.gov.hr:cius-2025:1.0#conformant#urn:mfin.gov.hr:ext-2025:1.0',
    invoiceId:     '',
    typeCode:      '380',
    issueDate:     new Date().toISOString().split('T')[0],
    copyIndicator: false,
    currency:      'EUR',
    seller:        createEmptyParty(),
    buyer:         createEmptyParty(),
    operator:      createEmptyOperator(),
    payment:       createEmptyPayment(),
    lines:         [],
    taxTotals:     [],
    totals:        createEmptyTotals(),
    attachments:   [],
  };
}

export function createEmptyLine(id: number): InvoiceLine {
  return {
    id: String(id), sku: '', ean: '', kpd: '',
    name: '', description: '',
    quantity: 1, unitCode: 'C62',
    price: 0, discountPct: 0, netAmount: 0,
    taxCategory: { id: 'S', percent: 25, scheme: 'VAT' },
  };
}
