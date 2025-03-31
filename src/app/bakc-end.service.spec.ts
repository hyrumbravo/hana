import { TestBed } from '@angular/core/testing';

import { BakcEndService } from './bakc-end.service';

describe('BakcEndService', () => {
  let service: BakcEndService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BakcEndService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
