import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CiudadanoService, RecorridoCiudadano } from '../services/ciudadano.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit, OnDestroy {
  recorridos: RecorridoCiudadano[] = [];
  private subscription?: Subscription;

  constructor(private ciudadanoService: CiudadanoService, private router: Router) {}

  ngOnInit(): void {
    this.subscription = this.ciudadanoService.obtenerRecorridosActivos().subscribe({
      next: (data) => (this.recorridos = data),
      error: () => (this.recorridos = []),
    });
  }

  abrirMapa(recorridoId: string) {
    this.router.navigate(['/mapa', recorridoId]);
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
