import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
})
export class ForgotPasswordPage {
  forgotForm: FormGroup;
  errorMessage = '';
  successMessage = '';
  loading = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  get emailInvalid() {
    const control = this.forgotForm.get('email');
    return control?.touched && control.invalid;
  }

  async onSubmit() {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { email } = this.forgotForm.value;
    try {
      await this.auth.forgotPassword(email);
      this.successMessage = 'Revisa tu bandeja de entrada. Si el correo existe, recibirás instrucciones para restablecer tu contraseña.';
    } catch (error: any) {
      this.errorMessage = this.auth.getErrorMessage(error);
    } finally {
      this.loading = false;
    }
  }
}
