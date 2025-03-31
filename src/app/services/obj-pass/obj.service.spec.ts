import { TestBed } from '@angular/core/testing';

import { ObjService } from './obj.service';

describe('ObjService', () => {
  let service: ObjService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ObjService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
