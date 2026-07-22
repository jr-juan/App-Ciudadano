import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
})
export class WelcomePage implements OnDestroy {
  private timeoutId?: ReturnType<typeof setTimeout>;
  public isLeaving = false;

  constructor(private router: Router) {
    this.timeoutId = setTimeout(() => {
      this.isLeaving = true;
      setTimeout(() => {
        this.router.navigate(['/home'], { replaceUrl: true });
      }, 220);
    }, 4000);
  }

  ngOnDestroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
}
