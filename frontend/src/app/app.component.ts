import { Component, OnInit } from '@angular/core';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: false
})
export class AppComponent implements OnInit {
  title = 'Sarthak HMS';

  constructor(public theme: ThemeService) {}

  ngOnInit(): void {
    this.theme.applyTheme(this.theme.getCurrentTheme());
  }

  onThemeChange(themeId: string): void {
    this.theme.applyTheme(themeId);
  }
}