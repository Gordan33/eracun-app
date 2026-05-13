export type DocType = 'Račun' | 'Odobrenje' | 'Terećenje' | 'Račun za predujam' | 'Samoizdavajući račun';
export type DocStatus = 'NOVO' | 'PROČITANO' | 'POSLANO' | 'GREŠKA';
export type FiscStatus = 'FISCALIZATION:OK' | 'FISCALIZATION:RE' | 'FISCALIZATION:ERR' | '';
export type ProcessType = 'P1' | 'P12';

export interface InvoiceListItem {
  id:          string;
  type:        DocType;
  processType: ProcessType;
  number:      string;
  date:        string;         // ISO
  periodFrom?: string;
  periodTo?:   string;
  partner:     string;
  status:      DocStatus;
  fiscStatus:  FiscStatus;
  lastChanged: string;         // ISO datetime
  direction:   'in' | 'out';  // primljeni / izdani
  amount?:     number;
  currency?:   string;
}
