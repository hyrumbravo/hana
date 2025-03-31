import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaveCreditsComponent } from './leave-credits.component';

describe('LeaveCreditsComponent', () => {
  let component: LeaveCreditsComponent;
  let fixture: ComponentFixture<LeaveCreditsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LeaveCreditsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeaveCreditsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
