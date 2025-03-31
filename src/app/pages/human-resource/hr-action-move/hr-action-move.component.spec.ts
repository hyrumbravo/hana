import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrActionMoveComponent } from './hr-action-move.component';

describe('HrActionMoveComponent', () => {
  let component: HrActionMoveComponent;
  let fixture: ComponentFixture<HrActionMoveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HrActionMoveComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HrActionMoveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
