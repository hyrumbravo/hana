import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OvertimeRequestsComponent } from './overtime-requests.component';

describe('OvertimeRequestsComponent', () => {
  let component: OvertimeRequestsComponent;
  let fixture: ComponentFixture<OvertimeRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OvertimeRequestsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OvertimeRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
