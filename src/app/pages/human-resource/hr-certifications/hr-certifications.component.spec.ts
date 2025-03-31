import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrCertificationsComponent } from './hr-certifications.component';

describe('HrCertificationsComponent', () => {
  let component: HrCertificationsComponent;
  let fixture: ComponentFixture<HrCertificationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HrCertificationsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HrCertificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
