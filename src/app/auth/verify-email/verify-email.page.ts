import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.page.html',
  styleUrls: ['./verify-email.page.scss'],
})
export class VerifyEmailPage {
  loading = false;
  message = 'Por favor verifica tu correo electrónico para acceder a la aplicación.';
  errorMessage = '';

  constructor(private auth: AuthService) {}

  async resendEmail() {
    this.loading = true;
    this.errorMessage = '';
    try {
      await this.auth.resendVerificationEmail();
      this.message = 'Correo de verificación reenviado. Revisa tu bandeja de entrada.';
    } catch (error: any) {
      this.errorMessage = this.auth.getErrorMessage(error);
    } finally {
      this.loading = false;
    }
  }
}
