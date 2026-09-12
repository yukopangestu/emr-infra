import { Component, inject } from '@angular/core';

import { AnalyticsService } from './core/services/analytics.service';
import { ContentService } from './core/services/content.service';
import { SearchResult, SearchService } from './core/services/search.service';
import { DiagramBoxComponent } from './shared/components/diagram-box/diagram-box.component';
import { HeaderComponent } from './shared/components/header/header.component';
import { SidebarNavComponent } from './shared/components/sidebar-nav/sidebar-nav.component';

@Component({
  imports: [
    DiagramBoxComponent,
    HeaderComponent,
    SidebarNavComponent,
  ],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  private readonly contentService = inject(ContentService);
  private readonly searchService = inject(SearchService);
  private readonly analyticsService = inject(AnalyticsService);

  readonly architecture = this.contentService.getArchitectureData();
  readonly sections = this.architecture.sections;
  readonly metadata = Object.entries(this.architecture.metadata);

  searchQuery = '';
  searchResults: SearchResult[] = [];
  searchOpen = false;
  sidebarOpen = false;

  constructor() {
    this.searchService.buildIndex(this.sections);
  }

  onSearch(query: string): void {
    this.searchQuery = query;
    this.searchResults = query.trim().length >= 2 ? this.searchService.search(query) : [];
    this.searchOpen = query.trim().length >= 2;

    if (query.trim().length >= 2) {
      this.analyticsService.trackSearch(query.trim(), this.searchResults.length);
    }
  }

  openSearch(): void {
    this.searchOpen = this.searchQuery.trim().length >= 2;
  }

  closeSearch(): void {
    this.searchOpen = false;
  }

  jumpToSection(id: string): void {
    if (typeof document !== 'undefined') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    this.closeSearch();
    this.sidebarOpen = false;
    const section = this.contentService.getSectionById(id);
    if (section) {
      this.analyticsService.trackPageView(section.id, section.title);
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
