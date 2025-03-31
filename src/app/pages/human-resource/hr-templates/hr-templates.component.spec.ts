import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrTemplatesComponent } from './hr-templates.component';

describe('HrTemplatesComponent', () => {
  let component: HrTemplatesComponent;
  let fixture: ComponentFixture<HrTemplatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HrTemplatesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HrTemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
