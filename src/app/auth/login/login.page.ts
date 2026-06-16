import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  loginForm: FormGroup;
  errorMessage = '';
  loading = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rememberMe: [true],
    });
  }

  get emailInvalid() {
    const control = this.loginForm.get('email');
    return control?.touched && control.invalid;
  }

  get passwordInvalid() {
    const control = this.loginForm.get('password');
    return control?.touched && control.invalid;
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    if (this.auth.isLoginLocked()) {
      this.errorMessage = `Cuenta bloqueada por ${this.auth.getLockRemainingMinutes()} minutos.`;
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { email, password, rememberMe } = this.loginForm.value;

    try {
      const user = await this.auth.login(email, password, rememberMe);
      if (!user.emailVerified) {
        this.router.navigate(['/auth/verify-email']);
      } else {
        this.router.navigate(['/tabs/tab1']);
      }
    } catch (error: any) {
      this.auth.incrementFailedLoginAttempt();
      this.errorMessage = this.auth.getErrorMessage(error);
    } finally {
      this.loading = false;
    }
  }

  async loginWithGoogle() {
    this.loading = true;
    this.errorMessage = '';
    try {
      const user = await this.auth.loginWithGoogle();
      if (!user.emailVerified) {
        this.router.navigate(['/auth/verify-email']);
      } else {
        this.router.navigate(['/tabs/tab1']);
      }
    } catch (error: any) {
      this.errorMessage = this.auth.getErrorMessage(error);
    } finally {
      this.loading = false;
    }
  }
}
