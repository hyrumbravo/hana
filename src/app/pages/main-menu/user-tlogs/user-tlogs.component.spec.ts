import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserTLogsComponent } from './user-tlogs.component';

describe('UserTLogsComponent', () => {
  let component: UserTLogsComponent;
  let fixture: ComponentFixture<UserTLogsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserTLogsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserTLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
