import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    if (!this.auth.isLoggedIn) {
      return this.router.createUrlTree(['/auth/login']);
    }

    const allowedRoles: (string | number)[] = route.data['roles'] || [];
    if (!allowedRoles.length || this.auth.hasRole(...allowedRoles)) {
      return true;
    }

    return this.router.createUrlTree(['/auth/login']);
  }
}
