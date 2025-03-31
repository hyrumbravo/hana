import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrPerformanceEvalComponent } from './hr-performance-eval.component';

describe('HrPerformanceEvalComponent', () => {
  let component: HrPerformanceEvalComponent;
  let fixture: ComponentFixture<HrPerformanceEvalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HrPerformanceEvalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HrPerformanceEvalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
