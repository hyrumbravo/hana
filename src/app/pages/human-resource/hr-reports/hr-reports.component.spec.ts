import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrReportsComponent } from './hr-reports.component';

describe('HrReportsComponent', () => {
  let component: HrReportsComponent;
  let fixture: ComponentFixture<HrReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HrReportsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HrReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
