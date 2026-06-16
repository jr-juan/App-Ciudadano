import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

describe('AuthService', () => {
  let service: AuthService;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [AuthService, { provide: Router, useValue: routerSpy }],
    });

    service = TestBed.inject(AuthService);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with no user', (done) => {
    service.user$.subscribe((user) => {
      expect(user).toBeNull();
      done();
    });
  });

  it('should track failed login attempts', () => {
    service.resetFailedLoginAttempts();
    expect(service.failedLoginAttempts).toBe(0);

    service.incrementFailedLoginAttempt();
    expect(service.failedLoginAttempts).toBe(1);

    service.incrementFailedLoginAttempt();
    service.incrementFailedLoginAttempt();
    expect(service.failedLoginAttempts).toBe(3);
  });

  it('should lock account after 5 failed attempts', () => {
    service.resetFailedLoginAttempts();
    for (let i = 0; i < 5; i++) {
      service.incrementFailedLoginAttempt();
    }
    expect(service.isLoginLocked()).toBeTruthy();
  });

  it('should reset failed attempts', () => {
    service.incrementFailedLoginAttempt();
    service.resetFailedLoginAttempts();
    expect(service.failedLoginAttempts).toBe(0);
    expect(service.isLoginLocked()).toBeFalsy();
  });

  it('should return user-friendly error messages', () => {
    const emailInUseError = { code: 'auth/email-already-in-use' };
    const message = service.getErrorMessage(emailInUseError);
    expect(message).toContain('correo ya está en uso');
  });
});
