import { __awaiter, __decorate, __metadata } from "tslib";
import { Component, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as L from 'leaflet';
import { CiudadanoService } from '../services/ciudadano.service';
let MapaPage = class MapaPage {
    constructor(route, router, ngZone, ciudadanoService) {
        this.route = route;
        this.router = router;
        this.ngZone = ngZone;
        this.ciudadanoService = ciudadanoService;
        this.recorridoId = '';
        this.dispositivoId = '';
        this.ultimaLat = 0;
        this.ultimaLng = 0;
        this.map = null;
        this.marcador = null;
        this.rutaPolyline = null;
        this.rutaVistaInicial = false;
        this.rutaHash = '';
        this.mapaInicializado = false;
        this.historialRecorridos = [];
        this.cargando = true;
        this.errorMapa = '';
        this.nombreRuta = 'Ruta ciudadana';
        this.colorRuta = '#22c55e';
        this.posicionActual = null;
        this.etaTexto = 'Calculando ETA...';
        this.recorridoSeleccionado = null;
        this.recorridosActivos = [];
    }
    ngOnInit() {
        return __awaiter(this, void 0, void 0, function* () {
            this.recorridoId = this.route.snapshot.paramMap.get('recorridoId') || '';
            this.dispositivoId = this.route.snapshot.queryParamMap.get('dispositivoId') || this.route.snapshot.queryParamMap.get('idDispositivo') || '';
            this.subsRecorridos = this.ciudadanoService.obtenerRecorridosActivos().subscribe((recorridos) => {
                this.ngZone.run(() => {
                    this.recorridosActivos = recorridos;
                    if (!this.recorridoId && recorridos.length) {
                        this.seleccionarRecorrido(recorridos[0]);
                    }
                });
            });
            this.routeParamSub = this.route.paramMap.subscribe((params) => {
                const nuevoRecorridoId = params.get('recorridoId') || '';
                if (nuevoRecorridoId && nuevoRecorridoId !== this.recorridoId) {
                    this.recorridoId = nuevoRecorridoId;
                    void this.cargarRecorridoEnVista();
                }
            });
            this.routeQueryParamSub = this.route.queryParamMap.subscribe((params) => {
                const nuevoDispositivoId = params.get('dispositivoId') || params.get('idDispositivo') || '';
                if (nuevoDispositivoId && nuevoDispositivoId !== this.dispositivoId) {
                    this.dispositivoId = nuevoDispositivoId;
                    this.suscribirDocumentoDispositivo();
                }
            });
            if (this.dispositivoId) {
                this.suscribirDocumentoDispositivo();
            }
            if (this.recorridoId) {
                yield this.cargarRecorridoEnVista();
            }
        });
    }
    ngAfterViewInit() {
        if (!this.map) {
            this.inicializarMapa();
        }
        else {
            this.ajustarTamanoMapa();
        }
        if (this.recorridoId) {
            void this.cargarRecorridoEnVista();
        }
    }
    seleccionarRecorrido(recorrido) {
        var _a;
        this.recorridoId = recorrido.id;
        this.recorridoSeleccionado = recorrido;
        this.nombreRuta = recorrido.rutaNombre || 'Ruta ciudadana';
        this.cargando = true;
        this.errorMapa = '';
        this.etaTexto = 'Calculando ETA...';
        this.rutaVistaInicial = false;
        this.rutaHash = '';
        (_a = this.rutaPolyline) === null || _a === void 0 ? void 0 : _a.remove();
        this.rutaPolyline = null;
        this.posicionActual = null;
        this.ultimaLat = 0;
        this.ultimaLng = 0;
        this.router.navigate(['/mapa', recorrido.id]);
        void this.cargarRecorridoEnVista();
    }
    ionViewDidEnter() {
        this.ajustarTamanoMapa();
    }
    ionViewWillLeave() {
        var _a, _b, _c, _d;
        (_a = this.subscription) === null || _a === void 0 ? void 0 : _a.unsubscribe();
        (_b = this.subsRuta) === null || _b === void 0 ? void 0 : _b.unsubscribe();
        (_c = this.subsDetalleRecorrido) === null || _c === void 0 ? void 0 : _c.unsubscribe();
        (_d = this.subsDispositivo) === null || _d === void 0 ? void 0 : _d.unsubscribe();
    }
    inicializarMapa() {
        if (this.mapaInicializado && this.map) {
            this.ajustarTamanoMapa();
            return;
        }
        this.ngZone.run(() => {
            this.cargando = true;
            this.errorMapa = '';
        });
        const contenedor = document.getElementById('map');
        if (!contenedor) {
            setTimeout(() => this.inicializarMapa(), 100);
            return;
        }
        this.crearMapaPorDefecto();
        if (this.recorridoId) {
            this.cargarPosiciones();
        }
    }
    crearMapaPorDefecto() {
        if (this.map || this.mapaInicializado) {
            return;
        }
        const contenedor = document.getElementById('map');
        if (!contenedor) {
            return;
        }
        try {
            this.map = L.map('map', {
                zoomControl: true,
                scrollWheelZoom: true,
            }).setView([3.8815, -77.0401], 15);
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors',
                maxZoom: 19,
                subdomains: ['a', 'b', 'c'],
            }).addTo(this.map);
            this.map.on('tileerror', () => {
                console.warn('Tile de OpenStreetMap no disponible en esta petición; el mapa puede tardar en pintar.');
            });
            this.mapaInicializado = true;
            this.map.whenReady(() => {
                this.ajustarTamanoMapa();
            });
        }
        catch (error) {
            console.error('No se pudo inicializar Leaflet', error);
        }
    }
    ajustarTamanoMapa() {
        const reintentar = () => {
            requestAnimationFrame(() => {
                var _a;
                (_a = this.map) === null || _a === void 0 ? void 0 : _a.invalidateSize();
                setTimeout(() => {
                    var _a;
                    (_a = this.map) === null || _a === void 0 ? void 0 : _a.invalidateSize();
                }, 250);
            });
        };
        reintentar();
        setTimeout(reintentar, 180);
        setTimeout(reintentar, 450);
    }
    cargarRecorridoEnVista() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.recorridoId) {
                this.cargando = false;
                this.errorMapa = 'Selecciona un recorrido para ver el mapa.';
                return;
            }
            this.cargando = true;
            this.errorMapa = '';
            this.etaTexto = 'Calculando ETA...';
            this.rutaVistaInicial = false;
            this.rutaHash = '';
            (_a = this.rutaPolyline) === null || _a === void 0 ? void 0 : _a.remove();
            this.rutaPolyline = null;
            this.posicionActual = null;
            this.ultimaLat = 0;
            this.ultimaLng = 0;
            const recorrido = yield this.ciudadanoService.obtenerRecorridoPorId(this.recorridoId);
            if (!recorrido) {
                this.errorMapa = 'No se encontró el recorrido solicitado.';
                this.cargando = false;
                return;
            }
            this.ngZone.run(() => {
                this.nombreRuta = recorrido.rutaNombre || 'Ruta ciudadana';
                this.recorridoSeleccionado = recorrido;
                this.cargando = false;
            });
            this.suscribirRecorridoDetalle();
            this.suscribirRuta();
            this.cargarPosiciones();
        });
    }
    suscribirRecorridoDetalle() {
        var _a;
        (_a = this.subsDetalleRecorrido) === null || _a === void 0 ? void 0 : _a.unsubscribe();
        this.subsDetalleRecorrido = this.ciudadanoService.observarRecorrido(this.recorridoId).subscribe({
            next: (recorrido) => {
                if (!recorrido) {
                    this.errorMapa = 'No se encontró el recorrido solicitado.';
                    return;
                }
                this.ngZone.run(() => {
                    this.recorridoSeleccionado = recorrido;
                    this.nombreRuta = recorrido.rutaNombre || 'Ruta ciudadana';
                    this.cargando = false;
                });
            },
            error: (error) => {
                console.error('No fue posible escuchar cambios del recorrido', error);
            },
        });
    }
    suscribirRuta() {
        var _a;
        (_a = this.subsRuta) === null || _a === void 0 ? void 0 : _a.unsubscribe();
        this.subsRuta = this.ciudadanoService.observarRutaDelRecorrido(this.recorridoId).subscribe({
            next: (ruta) => {
                this.ngZone.run(() => {
                    this.dibujarRuta(ruta);
                });
            },
            error: (error) => {
                console.error('No fue posible escuchar cambios de la ruta', error);
            },
        });
    }
    suscribirDocumentoDispositivo() {
        var _a;
        (_a = this.subsDispositivo) === null || _a === void 0 ? void 0 : _a.unsubscribe();
        if (!this.dispositivoId) {
            return;
        }
        this.subsDispositivo = this.ciudadanoService.observarDocumentoChofer(this.dispositivoId).subscribe({
            next: (estado) => {
                if (!estado) {
                    return;
                }
                const recorridoId = this.extraerRecorridoIdDesdeDocumento(estado);
                if (!recorridoId || recorridoId === this.recorridoId) {
                    return;
                }
                this.ngZone.run(() => {
                    this.recorridoId = recorridoId;
                    this.router.navigate(['/mapa', recorridoId], { queryParamsHandling: 'merge' });
                    void this.cargarRecorridoEnVista();
                });
            },
            error: (error) => {
                console.error('No fue posible escuchar cambios del documento del dispositivo', error);
            },
        });
    }
    extraerRecorridoIdDesdeDocumento(estado) {
        var _a, _b, _c, _d, _e, _f;
        const candidatos = [
            estado === null || estado === void 0 ? void 0 : estado.recorridoId,
            (_a = estado === null || estado === void 0 ? void 0 : estado.recorrido) === null || _a === void 0 ? void 0 : _a.id,
            (_b = estado === null || estado === void 0 ? void 0 : estado.recorrido) === null || _b === void 0 ? void 0 : _b.recorridoId,
            estado === null || estado === void 0 ? void 0 : estado.recorridoActivoId,
            estado === null || estado === void 0 ? void 0 : estado.recorridoActivaId,
            (_c = estado === null || estado === void 0 ? void 0 : estado.recorridoActivo) === null || _c === void 0 ? void 0 : _c.id,
            (_d = estado === null || estado === void 0 ? void 0 : estado.recorridoActivo) === null || _d === void 0 ? void 0 : _d.recorridoId,
            estado === null || estado === void 0 ? void 0 : estado.rutaActivaId,
            estado === null || estado === void 0 ? void 0 : estado.rutaId,
            estado === null || estado === void 0 ? void 0 : estado.rutaActualId,
            estado === null || estado === void 0 ? void 0 : estado.rutaIdActiva,
            (_e = estado === null || estado === void 0 ? void 0 : estado.rutaActiva) === null || _e === void 0 ? void 0 : _e.id,
            (_f = estado === null || estado === void 0 ? void 0 : estado.ruta) === null || _f === void 0 ? void 0 : _f.id,
        ];
        for (const valor of candidatos) {
            if (typeof valor === 'string' && valor.trim()) {
                return valor.trim();
            }
        }
        return '';
    }
    limpiarPolylineMapa() {
        if (this.rutaPolyline) {
            this.rutaPolyline.remove();
            this.rutaPolyline = null;
        }
        this.rutaHash = '';
        this.rutaVistaInicial = false;
    }
    dibujarRuta(ruta) {
        var _a;
        if (!this.map && !this.mapaInicializado) {
            this.crearMapaPorDefecto();
        }
        if (!this.map) {
            return;
        }
        if (!((_a = ruta === null || ruta === void 0 ? void 0 : ruta.coordenadas) === null || _a === void 0 ? void 0 : _a.length)) {
            this.limpiarPolylineMapa();
            return;
        }
        const hash = JSON.stringify(ruta.coordenadas);
        if (this.rutaPolyline && this.rutaHash === hash) {
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
        if (!this.rutaVistaInicial) {
            const bounds = this.rutaPolyline.getBounds();
            if (bounds.isValid()) {
                this.map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
            }
            this.rutaVistaInicial = true;
        }
    }
    cargarPosiciones() {
        var _a;
        (_a = this.subscription) === null || _a === void 0 ? void 0 : _a.unsubscribe();
        this.subscription = this.ciudadanoService.obtenerPosicionesPorRecorrido(this.recorridoId).subscribe({
            next: (posiciones) => {
                this.ngZone.run(() => {
                    var _a, _b, _c, _d;
                    const posicionesValidas = posiciones.filter((p) => typeof p.latitud === 'number' && typeof p.longitud === 'number');
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
                        properties: { precision: (_a = ultima.precision) !== null && _a !== void 0 ? _a : 0, fecha: (_d = (_c = (_b = ultima.fechaRegistro) === null || _b === void 0 ? void 0 : _b.toDate) === null || _c === void 0 ? void 0 : _c.call(_b)) !== null && _d !== void 0 ? _d : new Date() },
                    };
                    this.ultimaLat = ultima.latitud;
                    this.ultimaLng = ultima.longitud;
                    this.actualizarMapa(ultima.latitud, ultima.longitud);
                    this.calcularEta(posicionesValidas);
                    this.cargando = false;
                    this.errorMapa = '';
                });
            },
            error: (error) => {
                console.error('No fue posible leer las posiciones del recorrido', error);
                this.errorMapa = 'No fue posible cargar la ubicación del camión.';
                this.etaTexto = 'Sin datos de ETA';
            },
        });
    }
    calcularEta(posiciones) {
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
    calcularDistanciaKm(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = this.toRad(lat2 - lat1);
        const dLng = this.toRad(lng2 - lng1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    toRad(valor) {
        return (valor * Math.PI) / 180;
    }
    actualizarMapa(lat, lng) {
        var _a, _b, _c;
        if (!this.map && !this.mapaInicializado) {
            this.crearMapaPorDefecto();
        }
        if (!this.map) {
            return;
        }
        const zoomActual = (_b = (_a = this.map) === null || _a === void 0 ? void 0 : _a.getZoom()) !== null && _b !== void 0 ? _b : 15;
        (_c = this.map) === null || _c === void 0 ? void 0 : _c.setView([lat, lng], Math.max(zoomActual, 14));
        if (this.marcador) {
            this.marcador.setLatLng([lat, lng]);
            return;
        }
        this.marcador = L.marker([lat, lng]).addTo(this.map);
        this.marcador.bindPopup('Ubicación del recorrido').openPopup();
    }
    centrarEnVehiculo() {
        if (!this.posicionActual) {
            return;
        }
        this.actualizarMapa(this.ultimaLat, this.ultimaLng);
    }
    ngOnDestroy() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        (_a = this.subscription) === null || _a === void 0 ? void 0 : _a.unsubscribe();
        (_b = this.subsRecorridos) === null || _b === void 0 ? void 0 : _b.unsubscribe();
        (_c = this.subsRuta) === null || _c === void 0 ? void 0 : _c.unsubscribe();
        (_d = this.subsDetalleRecorrido) === null || _d === void 0 ? void 0 : _d.unsubscribe();
        (_e = this.subsDispositivo) === null || _e === void 0 ? void 0 : _e.unsubscribe();
        (_f = this.routeParamSub) === null || _f === void 0 ? void 0 : _f.unsubscribe();
        (_g = this.routeQueryParamSub) === null || _g === void 0 ? void 0 : _g.unsubscribe();
        (_h = this.rutaPolyline) === null || _h === void 0 ? void 0 : _h.remove();
        (_j = this.map) === null || _j === void 0 ? void 0 : _j.remove();
        this.mapaInicializado = false;
    }
};
MapaPage = __decorate([
    Component({
        selector: 'app-mapa',
        templateUrl: './mapa.page.html',
        styleUrls: ['./mapa.page.scss'],
    }),
    __metadata("design:paramtypes", [ActivatedRoute,
        Router,
        NgZone,
        CiudadanoService])
], MapaPage);
export { MapaPage };
//# sourceMappingURL=mapa.page.js.map