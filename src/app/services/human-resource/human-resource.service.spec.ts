import { TestBed } from '@angular/core/testing';

import { HumanResourceService } from './human-resource.service';

describe('HumanResourceService', () => {
  let service: HumanResourceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HumanResourceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
