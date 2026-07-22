import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
})
export class SplashPage implements OnInit {
  mensaje = 'Cargando tus recorridos...';

  constructor(private router: Router) {}

  ngOnInit() {
    setTimeout(() => {
      this.mensaje = 'Conectando con Ecoruta...';
    }, 900);

    setTimeout(() => {
      this.router.navigateByUrl('/mapa', { replaceUrl: true });
}, 4000);  }
}