import { TestBed } from '@angular/core/testing';

import { CreditEarningService } from './credit-earning.service';

describe('CreditEarningService', () => {
  let service: CreditEarningService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CreditEarningService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
