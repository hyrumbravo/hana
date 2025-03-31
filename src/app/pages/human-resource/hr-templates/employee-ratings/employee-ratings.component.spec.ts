import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeRatingsComponent } from './employee-ratings.component';

describe('EmployeeRatingsComponent', () => {
  let component: EmployeeRatingsComponent;
  let fixture: ComponentFixture<EmployeeRatingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EmployeeRatingsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeRatingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
