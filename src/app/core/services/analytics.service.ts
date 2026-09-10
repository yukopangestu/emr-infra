import { Injectable } from '@angular/core';

declare global {
  interface Window {
    va?: { track: (event: string, data?: Record<string, any>) => void };
    gtag?: (...args: any[]) => void;
  }
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  trackPageView(sectionId: string, title: string): void {
    if (typeof window !== 'undefined' && window.va) {
      window.va.track('Page View', { sectionId, title });
    }
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', { page_path: `/${sectionId}`, page_title: title });
    }
  }

  trackSearch(query: string, resultCount: number): void {
    if (typeof window !== 'undefined' && window.va) {
      window.va.track('Search', { query, resultCount });
    }
  }

  trackThemeToggle(theme: string): void {
    if (typeof window !== 'undefined' && window.va) {
      window.va.track('Theme Toggle', { theme });
    }
  }
}
