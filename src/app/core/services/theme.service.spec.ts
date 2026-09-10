import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';
import { firstValueFrom } from 'rxjs';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    localStorage.clear();
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should toggle dark mode', async () => {
    const initialValue = service['darkModeSubject'].value;
    service.toggleDarkMode();
    const isDark = await firstValueFrom(service.darkMode$);
    expect(isDark).toBe(!initialValue);
  });

  it('should persist theme to localStorage', () => {
    service.toggleDarkMode();
    const storedTheme = localStorage.getItem('theme');
    expect(storedTheme).toBe('dark');
  });

  it('should provide darkMode as observable', async () => {
    const isDark = await firstValueFrom(service.isDarkMode());
    expect(typeof isDark).toBe('boolean');
  });
});
