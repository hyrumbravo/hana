import { TestBed } from '@angular/core/testing';

import { TimelogsService } from './timelogs.service';

describe('TimelogsService', () => {
  let service: TimelogsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimelogsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
