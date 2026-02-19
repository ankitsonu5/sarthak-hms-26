import { Injectable } from '@angular/core';

export interface ThemeConfig {
  themeId: string;
  hospitalName?: string;
  logoUrl?: string;
}

export const THEMES: Record<string, string> = {
  default: 'default',
  apollo: 'apollo',
  fortis: 'fortis',
  max: 'max',
  green: 'green',
};

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private currentTheme = 'default';

  constructor() {
    this.loadTheme();
  }

  private loadTheme(): void {
    const stored = localStorage.getItem('hms-theme');
    if (stored && THEMES[stored]) {
      this.applyTheme(stored);
      return;
    }
    this.loadFromConfig();
  }

  private loadFromConfig(): void {
    fetch('/config/hospital-config.json')
      .then((res) => res.json())
      .then((config: ThemeConfig) => {
        if (config.themeId && THEMES[config.themeId]) {
          this.applyTheme(config.themeId);
        }
      })
      .catch(() => {});
  }

  applyTheme(themeId: string): void {
    if (!THEMES[themeId]) return;
    this.currentTheme = themeId;
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem('hms-theme', themeId);
  }

  getCurrentTheme(): string {
    return this.currentTheme;
  }

  getAvailableThemes(): string[] {
    return Object.keys(THEMES);
  }
}
