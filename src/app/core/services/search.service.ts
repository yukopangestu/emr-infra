import { Injectable } from '@angular/core';
import lunr from 'lunr';
import { Section } from './content.service';

export interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  score: number;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private index: lunr.Index | null = null;
  private sections: Map<string, Section> = new Map();

  buildIndex(sections: Section[]): void {
    this.sections.clear();
    sections.forEach(s => this.sections.set(s.id, s));

    this.index = lunr(function (this: lunr.Builder) {
      this.ref('id');
      this.field('title', { boost: 10 });
      this.field('content');
      sections.forEach((section) => {
        this.add({ id: section.id, title: section.title, content: section.content });
      });
    });
  }

  search(query: string): SearchResult[] {
    if (!this.index || !query.trim()) {
      return [];
    }
    try {
      const results = this.index.search(query);
      return results.slice(0, 10).map((result: lunr.Index.Result) => {
        const section = this.sections.get(result.ref);
        const excerpt = section ? section.content.substring(0, 150) + '...' : '';
        return { id: result.ref, title: section?.title || result.ref, excerpt, score: result.score };
      });
    } catch {
      return [];
    }
  }
}
