import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { LoginPage } from './login.page';
import { AuthService } from '../../services/auth.service';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'login',
      'loginWithGoogle',
      'isLoginLocked',
      'getLockRemainingMinutes',
      'getErrorMessage',
    ]);

    await TestBed.configureTestingModule({
      declarations: [LoginPage],
      imports: [IonicModule.forRoot(), ReactiveFormsModule],
      providers: [{ provide: AuthService, useValue: authServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have invalid form if email is empty', () => {
    component.loginForm.patchValue({ email: '', password: 'Test@123' });
    expect(component.loginForm.valid).toBeFalsy();
  });

  it('should have invalid form if password is too short', () => {
    component.loginForm.patchValue({ email: 'test@example.com', password: 'Short' });
    expect(component.loginForm.valid).toBeFalsy();
  });

  it('should have valid form with correct email and password', () => {
    component.loginForm.patchValue({ email: 'test@example.com', password: 'Test@1234' });
    expect(component.loginForm.valid).toBeTruthy();
  });
});
