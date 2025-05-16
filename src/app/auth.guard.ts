import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate: CanActivateFn = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean => {
    return this.authService.authStateReady$.pipe(
      switchMap(() => this.authService.isAuthenticated$),
      take(1),
      map((isAuthenticated) => {
        if (isAuthenticated) {
          return true; // Allow access to the route
        } else {
          // Redirect the user to the login page and pass the attempted URL as a query parameter
          this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
          return false; // Prevent access to the route
        }
      })
    );
  };
}