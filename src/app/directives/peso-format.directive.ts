import { Directive, HostListener, ElementRef, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Directive({
  selector: '[appPesoFormat]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PesoFormatDirective),
      multi: true
    }
  ]
})
export class PesoFormatDirective implements ControlValueAccessor {
  private onChange = (_: any) => {};
  private onTouched = () => {};

  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event.target.value'])
  onInput(value: string) {
    const numericValue = value.replace(/[^0-9.]/g, '');
    const floatVal = parseFloat(numericValue);

    if (!isNaN(floatVal)) {
      const formatted = '₱' + floatVal.toLocaleString('en-PH');
      this.el.nativeElement.value = formatted;
      this.onChange(floatVal);
    } else {
      this.el.nativeElement.value = '';
      this.onChange(null);
    }
  }

  @HostListener('blur')
  onBlur() {
    this.onTouched();
  }

  writeValue(value: any): void {
    if (value !== null && value !== undefined) {
      this.el.nativeElement.value = '₱' + Number(value).toLocaleString('en-PH');
    } else {
      this.el.nativeElement.value = '';
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
}
