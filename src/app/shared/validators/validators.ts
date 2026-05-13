import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function oibValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = control.value?.toString().replace(/\D/g,'') || '';
    if (!raw) return null;
    if (raw.length !== 11) return { oib: { message: 'OIB mora imati točno 11 znamenki' } };
    let d = 10;
    for (let i = 0; i < 10; i++) {
      d = (d + parseInt(raw[i],10)) % 10;
      if (d===0) d=10;
      d = (d*2) % 11;
    }
    const check = 11-d===10 ? 0 : 11-d;
    if (check !== parseInt(raw[10],10)) return { oib: { message: 'Neispravan OIB' } };
    return null;
  };
}

export function ibanValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = control.value?.toString().replace(/\s/g,'').toUpperCase() || '';
    if (!raw) return null;
    if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(raw)) return { iban: { message: 'Neispravan format IBAN-a' } };
    const rearranged = raw.slice(4) + raw.slice(0,4);
    const numeric = rearranged.split('').map((c: string) => { const code=c.charCodeAt(0); return code>=65 ? String(code-55) : c; }).join('');
    let remainder = BigInt(0);
    for (const char of numeric) remainder = (remainder * 10n + BigInt(parseInt(char,10))) % 97n;
    if (remainder !== 1n) return { iban: { message: 'Neispravan IBAN' } };
    return null;
  };
}

export function conditionalRequired(conditionFn: () => boolean, message = 'Polje je obavezno'): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!conditionFn()) return null;
    const value = control.value;
    if (value === null || value === undefined || value === '') return { btRequired: { message } };
    return null;
  };
}
