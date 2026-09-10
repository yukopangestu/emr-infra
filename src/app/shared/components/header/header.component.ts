import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { ThemeService } from '../../../core/services/theme.service';
import { AnalyticsService } from '../../../core/services/analytics.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private themeService = inject(ThemeService);
  private analyticsService = inject(AnalyticsService);

  isDarkMode$: Observable<boolean> = this.themeService.isDarkMode();
  searchQuery = '';

  @Output() search = new EventEmitter<string>();
  @Output() openSearch = new EventEmitter<void>();
  @Output() menuToggle = new EventEmitter<void>();

  toggleTheme(): void {
    this.themeService.toggleDarkMode();
    // Emit the NEW theme value after toggle
    this.isDarkMode$.pipe(
      take(1),
      map(isDark => isDark ? 'dark' : 'light')
    ).subscribe(newTheme => {
      this.analyticsService.trackThemeToggle(newTheme);
    });
  }

  onSearch(): void {
    this.search.emit(this.searchQuery);
  }

  onSearchFocus(): void {
    this.openSearch.emit();
  }
}
