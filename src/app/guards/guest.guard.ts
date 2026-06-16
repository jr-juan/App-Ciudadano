import { Injectable } from '@angular/core';
import { CanActivate, Router, RouterStateSnapshot, ActivatedRouteSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class GuestGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    return this.auth.authReady$.pipe(
      filter((ready) => ready),
      take(1),
      switchMap(() => this.auth.user$.pipe(take(1))),
      map((user) => {
        if (user && user.emailVerified) {
          return this.router.createUrlTree(['/tabs']);
        }
        if (user && !user.emailVerified) {
          return this.router.createUrlTree(['/auth/verify-email']);
        }
        return true;
      }),
    );
  }
}
