import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrRequestsComponent } from './hr-requests.component';

describe('HrRequestsComponent', () => {
  let component: HrRequestsComponent;
  let fixture: ComponentFixture<HrRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HrRequestsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HrRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
