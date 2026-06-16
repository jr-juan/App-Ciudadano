import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RegisterPage } from './register.page';
import { AuthService } from '../../services/auth.service';

describe('RegisterPage', () => {
  let component: RegisterPage;
  let fixture: ComponentFixture<RegisterPage>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['register', 'getErrorMessage']);

    await TestBed.configureTestingModule({
      declarations: [RegisterPage],
      imports: [IonicModule.forRoot(), ReactiveFormsModule],
      providers: [{ provide: AuthService, useValue: authServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPage);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have invalid form if passwords do not match', () => {
    component.registerForm.patchValue({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'Test@1234',
      confirmPassword: 'Different@123',
    });
    expect(component.registerForm.valid).toBeFalsy();
  });

  it('should have valid form with matching passwords', () => {
    component.registerForm.patchValue({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'Test@1234',
      confirmPassword: 'Test@1234',
    });
    expect(component.registerForm.valid).toBeTruthy();
  });

  it('should have invalid password if no uppercase', () => {
    component.registerForm.patchValue({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'test@1234',
      confirmPassword: 'test@1234',
    });
    expect(component.registerForm.valid).toBeFalsy();
  });
});
