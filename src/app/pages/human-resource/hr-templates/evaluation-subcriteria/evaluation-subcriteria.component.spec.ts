import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaluationSubcriteriaComponent } from './evaluation-subcriteria.component';

describe('EvaluationSubcriteriaComponent', () => {
  let component: EvaluationSubcriteriaComponent;
  let fixture: ComponentFixture<EvaluationSubcriteriaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EvaluationSubcriteriaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EvaluationSubcriteriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
