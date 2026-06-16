import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { GuestGuard } from './guest.guard';
import { AuthService } from '../services/auth.service';
import { of } from 'rxjs';

describe('GuestGuard', () => {
  let guard: GuestGuard;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      authReady$: of(true),
      user$: of(null),
    });

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [GuestGuard, { provide: AuthService, useValue: authServiceSpy }],
    });

    guard = TestBed.inject(GuestGuard);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access if no user', (done) => {
    guard.canActivate({} as any, { url: '/auth/login' } as any).subscribe((result) => {
      expect(result).toBe(true);
      done();
    });
  });
});
