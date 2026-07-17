// Este archivo contiene la lógica de la pantalla del mapa.
// Su propósito es gestionar el seguimiento GPS, la carga del recorrido y la interacción con el mapa.
// Al exponerlo, tener en cuenta: su flujo principal depende de la sincronización de ubicación y eventos del mapa.

import { AfterViewInit, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as L from 'leaflet';
import { Subscription } from 'rxjs';
import { CiudadanoService, RecorridoCiudadano, RutaCiudadana } from '../services/ciudadano.service';

interface PosicionRecorrido {
  latitud: number;
  longitud: number;
  precision?: number;
  fechaRegistro?: { toDate?: () => Date };
}

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.page.html',
  styleUrls: ['./mapa.page.scss'],
})
export class MapaPage implements OnInit, AfterViewInit, OnDestroy {
  private subscription?: Subscription;
  private subsRecorridos?: Subscription;
  private recorridoId = '';
  private ultimaLat = 0;
  private ultimaLng = 0;
  private map: L.Map | null = null;
  private marcador: L.Marker | null = null;
  private rutaPolyline: L.Polyline | null = null;
  private rutaVistaInicial = false;
  private cargandoRuta = false;
  historialRecorridos: RecorridoCiudadano[] = [];

  cargando = true;
  errorMapa = '';
  nombreRuta = 'Ruta ciudadana';
  colorRuta = '#22c55e';
  posicionActual: any = null;
  etaTexto = 'Calculando ETA...';
  recorridoSeleccionado: RecorridoCiudadano | null = null;
  recorridosActivos: RecorridoCiudadano[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ngZone: NgZone,
    private ciudadanoService: CiudadanoService,
  ) {}

  async ngOnInit() {
    this.recorridoId = this.route.snapshot.paramMap.get('recorridoId') || '';
    this.subsRecorridos = this.ciudadanoService.obtenerRecorridosActivos().subscribe((recorridos) => {
      this.recorridosActivos = recorridos;
      if (!this.recorridoId && recorridos.length) {
        this.seleccionarRecorrido(recorridos[0]);
      }
    });

    if (!this.recorridoId) {
      this.cargando = true;
      this.errorMapa = '';
      return;
    }

    const recorrido = await this.ciudadanoService.obtenerRecorridoPorId(this.recorridoId);
    if (!recorrido) {
      this.errorMapa = 'No se encontró el recorrido solicitado.';
      this.cargando = false;
      return;
    }

    this.nombreRuta = recorrido.rutaNombre || 'Ruta ciudadana';
    this.recorridoSeleccionado = recorrido;
  }

  ngAfterViewInit() {
    if (!this.errorMapa) {
      this.inicializarMapa();
    }
    if (this.recorridoId) {
      void this.cargarRutaRecorrido();
    }
  }

  seleccionarRecorrido(recorrido: RecorridoCiudadano) {
    this.recorridoId = recorrido.id;
    this.recorridoSeleccionado = recorrido;
    this.nombreRuta = recorrido.rutaNombre || 'Ruta ciudadana';
    this.cargando = true;
    this.errorMapa = '';
    this.etaTexto = 'Calculando ETA...';
    this.rutaVistaInicial = false;
    this.cargandoRuta = false;
    this.rutaPolyline?.remove();
    this.rutaPolyline = null;
    this.cargarPosiciones();
    void this.cargarRutaRecorrido();
  }

  ionViewDidEnter() {
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 300);
  }

  ionViewWillLeave() {
    this.subscription?.unsubscribe();
  }

  private inicializarMapa() {
    this.ngZone.run(() => {
      this.cargando = true;
      this.errorMapa = '';
    });
    this.crearMapaPorDefecto();
    this.cargarPosiciones();
  }

  private crearMapaPorDefecto() {
    if (this.map) {
      return;
    }

    this.map = L.map('map', {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([3.8815, -77.0401], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    this.map.whenReady(() => {
      setTimeout(() => {
        this.map?.invalidateSize();
      }, 300);
    });
  }

  private async cargarRutaRecorrido() {
    if (!this.recorridoId) {
      return;
    }

    const recorridoIdActual = this.recorridoId;
    if (this.cargandoRuta) {
      return;
    }

    this.cargandoRuta = true;
    try {
      const ruta = await this.ciudadanoService.obtenerRutaDelRecorrido(recorridoIdActual);
      if (recorridoIdActual !== this.recorridoId) {
        return;
      }

      if (!ruta?.coordenadas?.length) {
        return;
      }

      this.dibujarRuta(ruta);
    } finally {
      if (recorridoIdActual === this.recorridoId) {
        this.cargandoRuta = false;
      }
    }
  }

  private dibujarRuta(ruta: RutaCiudadana) {
    if (!this.map) {
      this.crearMapaPorDefecto();
    }

    if (!this.map || !ruta.coordenadas?.length) {
      return;
    }

    this.rutaPolyline?.remove();
    this.rutaPolyline = L.polyline(ruta.coordenadas, {
      color: ruta.color_hex || '#22c55e',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(this.map);

    if (!this.rutaVistaInicial) {
      const bounds = this.rutaPolyline.getBounds();
      if (bounds.isValid()) {
        this.map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
      }
      this.rutaVistaInicial = true;
    }
  }

  private cargarPosiciones() {
    this.subscription?.unsubscribe();
    this.subscription = this.ciudadanoService.obtenerPosicionesPorRecorrido(this.recorridoId).subscribe({
      next: (posiciones) => {
        const posicionesValidas = posiciones.filter(
          (p: PosicionRecorrido) => typeof p.latitud === 'number' && typeof p.longitud === 'number',
        );

        if (!posicionesValidas.length) {
          this.cargando = false;
          this.errorMapa = 'Aún no hay coordenadas disponibles para este recorrido.';
          this.etaTexto = 'Sin datos de ubicación';
          return;
        }

        const ultima = posicionesValidas[posicionesValidas.length - 1];
        this.posicionActual = {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [ultima.longitud, ultima.latitud] },
          properties: { precision: ultima.precision ?? 0, fecha: ultima.fechaRegistro?.toDate?.() ?? new Date() },
        };
        this.ultimaLat = ultima.latitud;
        this.ultimaLng = ultima.longitud;
        this.actualizarMapa(ultima.latitud, ultima.longitud);
        this.calcularEta(posicionesValidas);
        this.cargando = false;
      },
      error: (error) => {
        console.error('No fue posible leer las posiciones del recorrido', error);
        this.errorMapa = 'No fue posible cargar la ubicación del camión.';
        this.etaTexto = 'Sin datos de ETA';
      },
    });
  }

  private calcularEta(posiciones: PosicionRecorrido[]) {
    if (!posiciones.length) {
      this.etaTexto = 'Sin datos de ETA';
      return;
    }

    const puntos = posiciones.filter((p) => typeof p.latitud === 'number' && typeof p.longitud === 'number');
    if (puntos.length < 2) {
      this.etaTexto = 'ETA pendiente';
      return;
    }

    const ultimo = puntos[puntos.length - 1];
    const anterior = puntos[puntos.length - 2];
    const distanciaKm = this.calcularDistanciaKm(anterior.latitud, anterior.longitud, ultimo.latitud, ultimo.longitud);
    const tiempoSeg = Math.max(1, Math.round((distanciaKm / 0.8) * 60 * 60));
    const etaMin = Math.max(2, Math.round(tiempoSeg / 60));
    this.etaTexto = `${etaMin} min aprox.`;
  }

  private calcularDistanciaKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(valor: number) {
    return (valor * Math.PI) / 180;
  }

  private actualizarMapa(lat: number, lng: number) {
    if (!this.map) {
      this.crearMapaPorDefecto();
    }

    const zoomActual = this.map?.getZoom() ?? 15;
    this.map?.setView([lat, lng], Math.max(zoomActual, 14));

    if (this.marcador) {
      this.marcador.setLatLng([lat, lng]);
      return;
    }

    this.marcador = L.marker([lat, lng]).addTo(this.map!);
    this.marcador.bindPopup('Ubicación del recorrido').openPopup();
  }

  centrarEnVehiculo() {
    if (!this.posicionActual) {
      return;
    }
    this.actualizarMapa(this.ultimaLat, this.ultimaLng);
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    this.subsRecorridos?.unsubscribe();
    this.rutaPolyline?.remove();
    this.map?.remove();
  }
}
