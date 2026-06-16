import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import * as mapboxgl from 'mapbox-gl';
import { environment } from 'src/environments/environment';
import { CiudadanoService } from '../services/ciudadano.service';

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.page.html',
  styleUrls: ['./mapa.page.scss'],
})
export class MapaPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef<HTMLDivElement>;

  private map?: mapboxgl.Map;
  private subscription?: Subscription;
  private recorridoId = '';

  cargando = true;
  errorMapa = '';
  nombreRuta = 'Ruta ciudadana';
  colorRuta = '#22c55e';
  posicionActual: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ngZone: NgZone,
    private ciudadanoService: CiudadanoService,
  ) {}

  async ngOnInit() {
    this.recorridoId = this.route.snapshot.paramMap.get('recorridoId') || '';
    if (!this.recorridoId) {
      this.errorMapa = 'No se recibió el recorrido a visualizar.';
      this.cargando = false;
      return;
    }

    const recorrido = await this.ciudadanoService.obtenerRecorridoPorId(this.recorridoId);
    if (!recorrido) {
      this.errorMapa = 'No se encontró el recorrido solicitado.';
      this.cargando = false;
      return;
    }

    this.nombreRuta = recorrido.rutaNombre || 'Ruta ciudadana';
  }

  ngAfterViewInit() {
    if (!this.errorMapa) {
      this.inicializarMapa();
    }
  }

  ionViewDidEnter() {
    if (this.map) {
      this.map.resize();
      if (this.posicionActual) {
        this.centrarEnVehiculo();
      }
    }
  }

  ionViewWillLeave() {
    this.subscription?.unsubscribe();
  }

  private inicializarMapa() {
    (mapboxgl as any).accessToken = (environment as any).mapboxToken;

    this.ngZone.runOutsideAngular(() => {
      try {
        this.map = new mapboxgl.Map({
          container: this.mapContainer.nativeElement,
          style: 'mapbox://styles/mapbox/streets-v11',
          zoom: 12,
          attributionControl: false,
        });

        this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        this.map.on('load', () => {
          this.ngZone.run(async () => {
            this.cargando = false;
            this.map?.resize();
            await this.cargarPosiciones();
          });
        });
      } catch (error) {
        this.ngZone.run(() => {
          console.error('Error al inicializar el mapa', error);
          this.errorMapa = 'No se pudo cargar el mapa.';
          this.cargando = false;
        });
      }
    });
  }

  private async cargarPosiciones() {
    this.subscription = this.ciudadanoService.obtenerPosicionesPorRecorrido(this.recorridoId).subscribe({
      next: (posiciones) => {
        if (!this.map) return;

        const features = posiciones
          .filter((p) => typeof p.latitud === 'number' && typeof p.longitud === 'number')
          .map((p) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [p.longitud, p.latitud] },
            properties: { precision: p.precision ?? 0, fecha: p.fechaRegistro?.toDate?.() ?? new Date() },
          }));

        this.posicionActual = features.length ? features[features.length - 1] : null;

        if (features.length) {
          this.colocarMarcador(features);
          this.fijarVista(features);
        }
      },
      error: (error) => {
        console.error('No fue posible leer las posiciones del recorrido', error);
        this.errorMapa = 'No fue posible cargar la ubicación del camión.';
      },
    });
  }

  private colocarMarcador(features: any[]) {
    if (!this.map) return;

    const geojson: any = { type: 'FeatureCollection', features };

    if (this.map.getSource('marcador-recorrido')) {
      (this.map.getSource('marcador-recorrido') as any).setData(geojson);
      return;
    }

    this.map.addSource('marcador-recorrido', { type: 'geojson', data: geojson });
    this.map.addLayer({
      id: 'marcador-recorrido-punto',
      type: 'circle',
      source: 'marcador-recorrido',
      paint: {
        'circle-radius': 10,
        'circle-color': '#2563eb',
        'circle-stroke-width': 3,
        'circle-stroke-color': '#ffffff',
      },
    });
  }

  private fijarVista(features: any[]) {
    if (!this.map || !features.length) return;

    const coords = features.map((feature) => feature.geometry.coordinates as [number, number]);
    const bounds = coords.reduce(
      (acc, current) => acc.extend(current),
      new mapboxgl.LngLatBounds(coords[0], coords[0]),
    );

    this.map.fitBounds(bounds, { padding: 70, duration: 900 });
  }

  centrarEnVehiculo() {
    if (!this.map || !this.posicionActual) return;

    const [lng, lat] = this.posicionActual.geometry.coordinates;
    this.map.flyTo({ center: [lng, lat], zoom: 14, duration: 800 });
  }

  volver() {
    this.router.navigate(['/tabs/tab1']);
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    this.map?.remove();
  }
}
