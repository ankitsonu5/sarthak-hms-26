import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: false,
})
export class AppComponent implements OnInit {
  title = 'Sarthak HMS';
  isAuthPage = true;

  constructor(
    public theme: ThemeService,
    public auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.theme.applyTheme(this.theme.getCurrentTheme());

    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e) => {
        const url = (e as NavigationEnd).urlAfterRedirects || (e as NavigationEnd).url;
        this.isAuthPage = url.startsWith('/auth');
      });
  }

  onThemeChange(themeId: string): void {
    this.theme.applyTheme(themeId);
  }

  logout(): void {
    this.auth.logout();
  }
}
