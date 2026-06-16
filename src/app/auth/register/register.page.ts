import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

function passwordValidator(control: any) {
  const value = control.value as string;
  if (!value) {
    return null;
  }
  const hasUpper = /[A-Z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(value);
  if (value.length < 8 || !hasUpper || !hasNumber || !hasSymbol) {
    return { weakPassword: true };
  }
  return null;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {
  registerForm: FormGroup;
  errorMessage = '';
  loading = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.registerForm = this.fb.group(
      {
        fullName: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8), passwordValidator]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordsMatch }
    );
  }

  passwordsMatch(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password === confirm ? null : { passwordsMismatch: true };
  }

  get fullNameInvalid() {
    const control = this.registerForm.get('fullName');
    return control?.touched && control.invalid;
  }

  get emailInvalid() {
    const control = this.registerForm.get('email');
    return control?.touched && control.invalid;
  }

  get passwordInvalid() {
    const control = this.registerForm.get('password');
    return control?.touched && control.invalid;
  }

  get confirmPasswordInvalid() {
    const control = this.registerForm.get('confirmPassword');
    return control?.touched && control.invalid;
  }

  get passwordsMismatch() {
    return this.registerForm.errors?.passwordsMismatch && this.registerForm.touched;
  }

  async onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { fullName, email, password } = this.registerForm.value;
    try {
      await this.auth.register(fullName, email, password);
      this.router.navigate(['/auth/verify-email']);
    } catch (error: any) {
      this.errorMessage = this.auth.getErrorMessage(error);
    } finally {
      this.loading = false;
    }
  }
}
