import { TestBed } from '@angular/core/testing';
import { SearchService } from './search.service';

describe('SearchService', () => {
  let service: SearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should build index from sections and find matches', () => {
    const sections = [{
      id: 's1',
      title: 'Master Diagram',
      content: 'Architecture diagram here',
      number: 1,
      subheading: 'Decision register',
      postContent: ['Cross-border compliance is blocked'],
    }];
    service.buildIndex(sections);
    const results = service.search('architecture');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('s1');

    expect(service.search('compliance')[0].id).toBe('s1');
  });

  it('should return empty array for empty query', () => {
    expect(service.search('')).toEqual([]);
  });
});
