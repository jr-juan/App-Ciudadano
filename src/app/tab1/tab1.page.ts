// Paul estuvo aquí
// Este archivo contiene la lógica de la pantalla tab1.
// Su propósito es gestionar la visualización de recorridos o datos relevantes para esa vista.
// Al exponerlo, tener en cuenta: revisar el flujo de eventos y sus suscripciones al actualizar la pantalla.

import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { CiudadanoService, RecorridoCiudadano } from '../services/ciudadano.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit, OnDestroy {
  recorridos: RecorridoCiudadano[] = [];
  estadoMensaje = 'Cargando recorridos...';
  ultimaActualizacion = '';
  cargando = true;
  private subscription?: Subscription;
  private recorridosPrevios: RecorridoCiudadano[] = [];

  constructor(
    private ciudadanoService: CiudadanoService,
    private router: Router,
    private toastController: ToastController,
  ) {}

  ngOnInit(): void {
    this.subscription = this.ciudadanoService.obtenerRecorridosActivos().subscribe({
      next: (data) => {
        this.detectarCambiosDeEstado(this.recorridosPrevios, data);
        this.recorridosPrevios = [...data];
        this.recorridos = data;
        this.cargando = false;
        this.ultimaActualizacion = new Date().toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        this.estadoMensaje = data.length
          ? 'Recorridos actualizados en tiempo real.'
          : 'No hay recorridos activos en este momento.';
      },
      error: () => {
        this.cargando = false;
        this.recorridos = [];
        this.estadoMensaje = 'No fue posible actualizar los recorridos. Revisa tu conexión e intenta nuevamente.';
        this.ultimaActualizacion = '';
      },
    });
  }

  abrirMapa(recorridoId: string) {
    this.router.navigate(['/mapa', recorridoId]);
  }

  private async detectarCambiosDeEstado(previos: RecorridoCiudadano[], actuales: RecorridoCiudadano[]) {
    if (!previos.length || !actuales.length) {
      return;
    }

    const cambio = previos.find((recorridoPrevio) => {
      const recorridoActual = actuales.find((item) => item.id === recorridoPrevio.id);
      return recorridoActual && recorridoPrevio.estado !== recorridoActual.estado;
    });

    if (cambio) {
      const recorridoActual = actuales.find((item) => item.id === cambio.id);
      if (recorridoActual) {
        await this.mostrarToast(
          `El recorrido "${recorridoActual.rutaNombre || recorridoActual.id}" cambió a "${recorridoActual.estado}".`,
        );
      }
    }
  }

  private async mostrarToast(mensaje: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2500,
      position: 'bottom',
    });

    await toast.present();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
