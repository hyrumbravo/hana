import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrAnnouncementsComponent } from './hr-announcements.component';

describe('HrAnnouncementsComponent', () => {
  let component: HrAnnouncementsComponent;
  let fixture: ComponentFixture<HrAnnouncementsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HrAnnouncementsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HrAnnouncementsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
