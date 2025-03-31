import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrAppointmentsComponent } from './hr-appointments.component';

describe('HrAppointmentsComponent', () => {
  let component: HrAppointmentsComponent;
  let fixture: ComponentFixture<HrAppointmentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HrAppointmentsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HrAppointmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
