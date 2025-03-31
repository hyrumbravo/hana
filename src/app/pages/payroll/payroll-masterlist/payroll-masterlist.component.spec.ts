import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayrollMasterlistComponent } from './payroll-masterlist.component';

describe('PayrollMasterlistComponent', () => {
  let component: PayrollMasterlistComponent;
  let fixture: ComponentFixture<PayrollMasterlistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PayrollMasterlistComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayrollMasterlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
