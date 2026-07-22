
import { AfterViewInit, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as L from 'leaflet';
import { Subscription } from 'rxjs';
import { CiudadanoService, RecorridoCiudadano, RutaCiudadana } from '../services/ciudadano.service';

const DEFAULT_MARKER_ICON = L.icon({
  iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
  iconUrl: 'assets/leaflet/marker-icon.png',
  shadowUrl: 'assets/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

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
  private subsRuta?: Subscription;
  private subsRecorrido?: Subscription;
  recorridoId = '';
  private ultimaLat = 0;
  private ultimaLng = 0;
  private map: L.Map | null = null;
  private marcador: L.Marker | null = null;
  private rutaPolyline: L.Polyline | null = null;
  private rutaVistaInicial = false;
  private rutaHash = '';
  private rutaActivaId: string | null = null;
  private rutaCargada = false;
  private cargandoRuta = false;
  private recorridoIdSuscrito: string | null = null;
  private rutaEscuchadaId: string | null = null;
  historialRecorridos: RecorridoCiudadano[] = [];

  cargando = false;
  errorMapa = '';
  nombreRuta = 'Ruta ciudadana';
  colorRuta = '#22c55e';
  posicionActual: any = null;
  etaTexto = 'Esperando recorrido';
  recorridoSeleccionado: RecorridoCiudadano | null = null;
  recorridosActivos: RecorridoCiudadano[] = [];
  actualizandoRuta = false;
  mensajeEstado = 'Esperando recorrido';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ngZone: NgZone,
    private ciudadanoService: CiudadanoService,
  ) {
    this.configurarIconosLeaflet();
  }

  async ngOnInit() {
    this.recorridoId = this.route.snapshot.paramMap.get('recorridoId') || '';
    this.suscribirRecorridosActivos();

    if (this.recorridoId) {
      this.suscribirRecorridoActivo();
    }
  }

  ngAfterViewInit() {
    this.inicializarMapa();
    if (this.recorridoId) {
      this.suscribirRecorridoActivo();
      this.suscribirRuta();
    }
  }

  seleccionarRecorrido(recorrido: RecorridoCiudadano) {
    if (this.recorridoSeleccionado?.id === recorrido.id && this.recorridoId === recorrido.id) {
      return;
    }

    this.subsRecorrido?.unsubscribe();
    this.recorridoId = recorrido.id;
    const recorridoConRuta = recorrido as RecorridoCiudadano & { rutaId?: string };
    console.log('[mapa] detectado nuevo recorridoId', {
      recorridoId: this.recorridoId,
      rutaId: recorridoConRuta.rutaId ?? null,
      estado: recorrido.estado ?? null,
    });
    this.recorridoSeleccionado = recorrido;
    this.nombreRuta = recorrido.rutaNombre || 'Ruta ciudadana';
    this.cargando = false;
    this.errorMapa = '';
    this.mensajeEstado = '';
    this.etaTexto = 'Calculando ETA...';
    this.rutaVistaInicial = false;
    this.rutaHash = '';
    this.rutaActivaId = null;
    this.rutaEscuchadaId = null;
    this.rutaCargada = false;
    this.cargandoRuta = false;
    this.recorridoIdSuscrito = null;
    this.subsRuta?.unsubscribe();
    this.subsRuta = undefined;
    this.limpiarPolylineMapa();
    this.limpiarMarcadorMapa();
    this.cargarPosiciones();
    this.suscribirRuta();
    this.suscribirRecorridoActivo();
  }

  ionViewDidEnter() {
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 300);
  }

  ionViewWillLeave() {
    this.subscription?.unsubscribe();
    this.subsRuta?.unsubscribe();
    this.subsRecorrido?.unsubscribe();
  }

  private configurarIconosLeaflet() {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
      iconUrl: 'assets/leaflet/marker-icon.png',
      shadowUrl: 'assets/leaflet/marker-shadow.png',
    });
    L.Marker.prototype.options.icon = DEFAULT_MARKER_ICON;
  }

  private inicializarMapa() {
    this.ngZone.run(() => {
      this.cargando = false;
      this.errorMapa = '';
      this.mensajeEstado = 'Esperando recorrido';
    });
    this.crearMapaPorDefecto();
  }

  private crearMapaPorDefecto() {
    if (this.map) {
      return;
    }

    this.map = L.map('map', {
      zoomControl: false,
      scrollWheelZoom: true,
    }).setView([3.8815, -77.0401], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

     this.map.attributionControl.setPrefix(false); // quita el texto "Leaflet"

    setTimeout(() => {
      this.map?.invalidateSize();
    }, 300);

    this.map.whenReady(() => {
      setTimeout(() => {
        this.map?.invalidateSize();
      }, 300);
    });
  }

  private suscribirRecorridosActivos() {
    this.subsRecorridos?.unsubscribe();
    this.subsRecorridos = this.ciudadanoService.obtenerRecorridosActivos().subscribe({
      next: (recorridos) => {
        this.ngZone.run(() => {
          this.recorridosActivos = recorridos;
          if (!recorridos.length) {
            this.reiniciarVistaSinRecorrido();
            return;
          }

          const recorridoActivo = recorridos.find((recorrido) => recorrido.id === this.recorridoId) ?? recorridos[0];
          if (!recorridoActivo) {
            this.reiniciarVistaSinRecorrido();
            return;
          }

          if (this.recorridoSeleccionado?.id === recorridoActivo.id && this.recorridoId === recorridoActivo.id) {
            return;
          }

          this.seleccionarRecorrido(recorridoActivo);
        });
      },
      error: (error) => {
        console.error('No fue posible escuchar los recorridos activos', error);
      },
    });
  }

  private suscribirRecorridoActivo() {
    this.subsRecorrido?.unsubscribe();
    if (!this.recorridoId) {
      return;
    }

    console.log('[mapa] suscribiendo recorrido activo', { recorridoId: this.recorridoId });
    this.subsRecorrido = this.ciudadanoService.observarRecorrido(this.recorridoId).subscribe({
      next: (recorridoActivo) => {
        this.ngZone.run(() => {
          const recorridoConRuta = recorridoActivo as (RecorridoCiudadano | null) & { rutaId?: string } | null;
          console.log('[mapa] callback recorrido recibido', {
            recorridoId: this.recorridoId,
            rutaId: recorridoConRuta?.rutaId ?? null,
            estado: recorridoActivo?.estado ?? null,
          });
          if (!recorridoActivo) {
            this.reiniciarVistaSinRecorrido();
            return;
          }

          this.recorridoSeleccionado = recorridoActivo;
          this.nombreRuta = recorridoActivo.rutaNombre || 'Ruta ciudadana';
          this.cargando = false;
          this.errorMapa = '';
          this.mensajeEstado = '';
          this.suscribirRuta();
        });
      },
      error: (error) => {
        console.error('No fue posible escuchar el recorrido activo', error);
        this.errorMapa = 'No fue posible actualizar el recorrido.';
        this.cargando = false;
      },
    });
  }

  private suscribirRuta() {
    if (!this.recorridoId) {
      console.log('[mapa.listener.componente] No hay recorridoId; se cancela la suscripción de ruta', {
        recorridoId: this.recorridoId,
        rutaActivaId: this.rutaActivaId,
        rutaEscuchadaId: this.rutaEscuchadaId,
      });
      this.subsRuta?.unsubscribe();
      this.subsRuta = undefined;
      this.recorridoIdSuscrito = null;
      this.rutaEscuchadaId = null;
      this.rutaActivaId = null;
      this.rutaCargada = false;
      this.limpiarPolylineMapa();
      return;
    }

    if (this.subsRuta && this.recorridoIdSuscrito === this.recorridoId) {
      console.log('[mapa.listener.componente] Reutilizando la suscripción de ruta existente para el mismo recorrido', {
        recorridoId: this.recorridoId,
        documentoEscuchado: `recorridos/${this.recorridoId}`,
        rutaActivaId: this.rutaActivaId,
        rutaEscuchadaId: this.rutaEscuchadaId,
      });
      return;
    }

    if (this.subsRuta) {
      console.log('[mapa.listener.componente] Se ejecuta unsubscribe() sobre la suscripción anterior porque cambió el recorrido', {
        recorridoId: this.recorridoId,
        recorridoAnteriorId: this.recorridoIdSuscrito,
        documentoEscuchadoAnterior: `recorridos/${this.recorridoIdSuscrito ?? 'sin-id'}`,
      });
      this.subsRuta.unsubscribe();
      this.subsRuta = undefined;
      this.recorridoIdSuscrito = null;
      this.rutaEscuchadaId = null;
      console.log('[mapa.listener.componente] unsubscribe() completado; se liberó la suscripción anterior', {
        recorridoId: this.recorridoId,
      });
    }

    this.recorridoIdSuscrito = this.recorridoId;
    this.rutaEscuchadaId = this.rutaActivaId;
    console.log('[mapa.listener.componente] Se crea una nueva suscripción de ruta', {
      recorridoId: this.recorridoId,
      documentoEscuchado: `recorridos/${this.recorridoId}`,
      rutaEscuchadaId: this.rutaEscuchadaId,
      momento: new Date().toISOString(),
    });
    this.subsRuta = this.ciudadanoService.observarRutaDelRecorrido(this.recorridoId).subscribe({
      next: (ruta) => {
        this.ngZone.run(() => {
          console.log('[mapa.listener.componente] Nuevo listener activo con datos recibidos', {
            recorridoId: this.recorridoId,
            rutaId: ruta?.id ?? null,
            documentoEscuchado: `recorridos/${this.recorridoId}`,
            momento: new Date().toISOString(),
          });
          this.reaccionarCambioRuta(ruta);
        });
      },
      error: (error) => {
        console.error('No fue posible escuchar cambios de la ruta del recorrido', error);
      },
    });
    console.log('[mapa.listener.componente] subscribe() completado; nuevo listener asociado al documento', {
      recorridoId: this.recorridoId,
      documentoEscuchado: `recorridos/${this.recorridoId}`,
      rutaEscuchadaId: this.rutaEscuchadaId,
      momento: new Date().toISOString(),
    });
  }

  private limpiarPolylineMapa() {
    if (this.rutaPolyline) {
      console.log('[mapa.listener.componente] Eliminando polilínea anterior');
      this.rutaPolyline.remove();
    }
    this.rutaPolyline = null;
    this.rutaHash = '';
    this.rutaVistaInicial = false;
    this.rutaCargada = false;
  }

  private limpiarMarcadorMapa() {
    if (this.marcador) {
      this.marcador.remove();
    }
    this.marcador = null;
  }

  private reiniciarVistaSinRecorrido() {
    this.recorridoSeleccionado = null;
    this.recorridoId = '';
    this.mensajeEstado = 'No hay recorridos activos en este momento.';
    this.nombreRuta = 'Ruta ciudadana';
    this.posicionActual = null;
    this.etaTexto = 'Esperando recorrido';
    this.ultimaLat = 0;
    this.ultimaLng = 0;
    this.cargando = false;
    this.errorMapa = '';
    this.limpiarPolylineMapa();
    this.limpiarMarcadorMapa();
    this.subscription?.unsubscribe();
    this.subscription = undefined;
    this.subsRuta?.unsubscribe();
    this.subsRuta = undefined;
    this.subsRecorrido?.unsubscribe();
    this.subsRecorrido = undefined;
    this.recorridoIdSuscrito = null;
    this.rutaEscuchadaId = null;
    this.rutaActivaId = null;
    this.rutaCargada = false;
  }

  private reaccionarCambioRuta(ruta: RutaCiudadana | null) {
    const rutaAnteriorId = this.rutaActivaId;
    const rutaActualId = ruta?.id ?? null;
    console.log('[mapa.listener.componente] Ruta anterior:', rutaAnteriorId);
    console.log('[mapa.listener.componente] Nueva ruta:', rutaActualId);

    const cambioRutaId = Boolean(rutaAnteriorId && rutaActualId && rutaAnteriorId !== rutaActualId);
    const rutaEliminada = !rutaActualId && Boolean(rutaAnteriorId);

    if (cambioRutaId || rutaEliminada) {
      console.log('[mapa.listener.componente] Cambio de ruta detectado');
      console.log('[mapa.listener.componente] Eliminando polilínea anterior');
      this.limpiarPolylineMapa();
    }

    this.rutaCargada = false;

    if (!ruta?.coordenadas?.length) {
      console.log('[mapa.listener.componente] Consultando recorrido de la nueva ruta');
      console.log('[mapa.listener.componente] Coordenadas recibidas: 0');
      this.rutaActivaId = null;
      this.limpiarPolylineMapa();
      return;
    }

    console.log('[mapa.listener.componente] Consultando recorrido de la nueva ruta');
    console.log('[mapa.listener.componente] Coordenadas recibidas:', ruta.coordenadas.length);
    this.dibujarRuta(ruta, cambioRutaId || rutaEliminada, rutaAnteriorId);
  }

  private dibujarRuta(ruta: RutaCiudadana | null, forzarAjusteVista = false, rutaAnteriorId: string | null = null) {
    console.log('[mapa.listener.componente] Creando nueva polilínea');
    if (!this.map) {
      this.crearMapaPorDefecto();
    }

    if (!this.map) {
      return;
    }

    if (!ruta?.coordenadas?.length) {
      console.log('[mapa.listener.componente] Coordenadas recibidas: 0');
      this.rutaActivaId = null;
      this.limpiarPolylineMapa();
      return;
    }

    const hash = JSON.stringify(ruta.coordenadas);
    const mismoId = Boolean(rutaAnteriorId && ruta?.id && rutaAnteriorId === ruta.id);
    const mismaRuta = this.rutaPolyline && this.rutaHash === hash && mismoId && !forzarAjusteVista;
    if (mismaRuta) {
      console.log('[mapa.listener.componente] No hay cambios reales; se reutiliza la polilínea existente');
      return;
    }

    this.rutaHash = hash;
    this.limpiarPolylineMapa();
    this.rutaPolyline = L.polyline(ruta.coordenadas, {
      color: ruta.color_hex || '#22c55e',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(this.map);
    console.log('[mapa.listener.componente] Nueva polilínea agregada al mapa');

    const bounds = this.rutaPolyline.getBounds();
    if (bounds.isValid()) {
      const ajustarVista = this.rutaVistaInicial ? forzarAjusteVista : true;
      if (ajustarVista) {
        this.map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
      }
    }
    this.rutaVistaInicial = true;
    this.rutaActivaId = ruta?.id ?? null;
    this.rutaEscuchadaId = ruta?.id ?? null;
    this.rutaCargada = true;
  }

  private cargarPosiciones() {
    this.subscription?.unsubscribe();
    this.subscription = undefined;

    if (!this.recorridoId) {
      this.posicionActual = null;
      this.etaTexto = 'Esperando recorrido';
      this.cargando = false;
      return;
    }

    this.subscription = this.ciudadanoService.obtenerPosicionesPorRecorrido(this.recorridoId).subscribe({
      next: (posiciones) => {
        this.ngZone.run(() => {
          const posicionesValidas = posiciones.filter(
            (p: PosicionRecorrido) => typeof p.latitud === 'number' && typeof p.longitud === 'number',
          );

          if (!posicionesValidas.length) {
            this.posicionActual = null;
            this.cargando = false;
            this.errorMapa = '';
            this.etaTexto = 'Esperando GPS';
            this.limpiarMarcadorMapa();
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
        });
      },
      error: (error) => {
        this.ngZone.run(() => {
          console.error('No fue posible leer las posiciones del recorrido', error);
          this.errorMapa = 'No fue posible cargar la ubicación del camión.';
          this.etaTexto = 'Sin datos de ETA';
        });
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

    if (!this.map) {
      return;
    }

    const zoomActual = this.map.getZoom() ?? 15;
    this.map.setView([lat, lng], Math.max(zoomActual, 14));

    if (this.marcador) {
      this.marcador.setLatLng([lat, lng]);
      return;
    }

    this.marcador = L.marker([lat, lng]).addTo(this.map);
    this.marcador.bindPopup('Ubicación del recorrido').openPopup();
  }

  async actualizarManualmente() {
    if (!this.recorridoId) {
      return;
    }

    this.actualizandoRuta = true;
    try {
      this.recargarAplicacionCompleta();
    } catch (error) {
      console.error('No fue posible actualizar manualmente la ruta', error);
      this.ngZone.run(() => {
        this.errorMapa = 'No fue posible actualizar la ruta en este momento.';
      });
    } finally {
      window.setTimeout(() => {
        this.ngZone.run(() => {
          this.actualizandoRuta = false;
        });
      }, 800);
    }
  }

  private recargarAplicacionCompleta() {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
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
    this.subsRuta?.unsubscribe();
    this.subsRecorrido?.unsubscribe();
    this.rutaPolyline?.remove();
    this.limpiarMarcadorMapa();
    this.map?.remove();
  }
}
