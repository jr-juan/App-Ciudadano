// Este archivo contiene el servicio principal para datos del ciudadano y recorridos.
// Su prop�sito es centralizar peticiones y transformaciones de informaci�n para la vista.
// Al exponerlo, tener en cuenta: su flujo es cr�tico para la sincronizaci�n entre UI y backend.
import { __awaiter, __decorate } from "tslib";
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { collection, getDoc, onSnapshot, query, where, doc, orderBy, } from 'firebase/firestore';
import { firebaseDB } from './firebase.config';
let CiudadanoService = class CiudadanoService {
    constructor() {
        this.ultimoEstadoConexion = { online: navigator.onLine };
    }
    obtenerRecorridoPorId(id) {
        return this.leerRecorrido(id);
    }
    observarRecorrido(recorridoId) {
        return new Observable((observer) => {
            const ref = doc(firebaseDB, 'recorridos', recorridoId);
            const unsubscribe = onSnapshot(ref, (snapshot) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c, _d, _e, _f, _g, _h;
                if (!snapshot.exists()) {
                    observer.next(null);
                    return;
                }
                const data = snapshot.data();
                const ruta = data.rutaId ? yield this.leerDocumento('rutas', data.rutaId) : null;
                const vehiculo = data.vehiculoId ? yield this.leerDocumento('vehiculos', data.vehiculoId) : null;
                observer.next({
                    id: snapshot.id,
                    choferId: (_a = data.choferId) !== null && _a !== void 0 ? _a : 'Sin chofer',
                    estado: (_b = data.estado) !== null && _b !== void 0 ? _b : 'activo',
                    fechaInicio: ((_d = (_c = data.fechaInicio) === null || _c === void 0 ? void 0 : _c.toDate) === null || _d === void 0 ? void 0 : _d.call(_c)) ? data.fechaInicio.toDate().toLocaleString('es-CO') : 'Sin fecha',
                    rutaNombre: (_e = ruta === null || ruta === void 0 ? void 0 : ruta.nombre_ruta) !== null && _e !== void 0 ? _e : 'Ruta no disponible',
                    vehiculoPlaca: (_f = vehiculo === null || vehiculo === void 0 ? void 0 : vehiculo.placa) !== null && _f !== void 0 ? _f : 'Sin veh�culo',
                    vehiculoMarca: (_g = vehiculo === null || vehiculo === void 0 ? void 0 : vehiculo.marca) !== null && _g !== void 0 ? _g : '',
                    vehiculoModelo: (_h = vehiculo === null || vehiculo === void 0 ? void 0 : vehiculo.modelo) !== null && _h !== void 0 ? _h : '',
                });
            }), (error) => observer.error(error));
            return () => unsubscribe();
        });
    }
    observarRutaDelRecorrido(recorridoId) {
        return new Observable((observer) => {
            let rutaUnsubscribe;
            const limpiarRuta = () => {
                rutaUnsubscribe === null || rutaUnsubscribe === void 0 ? void 0 : rutaUnsubscribe();
                rutaUnsubscribe = undefined;
            };
            const refRecorrido = doc(firebaseDB, 'recorridos', recorridoId);
            const unsubscribeRecorrido = onSnapshot(refRecorrido, (snapshot) => {
                if (!snapshot.exists()) {
                    limpiarRuta();
                    observer.next(null);
                    return;
                }
                const data = snapshot.data();
                const rutaId = data.rutaId;
                if (!rutaId) {
                    limpiarRuta();
                    observer.next(null);
                    return;
                }
                limpiarRuta();
                const rutaRef = doc(firebaseDB, 'rutas', rutaId);
                rutaUnsubscribe = onSnapshot(rutaRef, (rutaSnapshot) => {
                    var _a, _b, _c;
                    if (!rutaSnapshot.exists()) {
                        observer.next(null);
                        return;
                    }
                    const rutaData = rutaSnapshot.data();
                    observer.next({
                        id: rutaSnapshot.id,
                        nombre_ruta: (_b = (_a = rutaData.nombre_ruta) !== null && _a !== void 0 ? _a : rutaData.nombre) !== null && _b !== void 0 ? _b : 'Ruta sin nombre',
                        color_hex: (_c = rutaData.color_hex) !== null && _c !== void 0 ? _c : '#22c55e',
                        shape: rutaData.shape,
                        coordenadas: this.extraerCoordenadasDesdeShape(rutaData.shape),
                    });
                }, (error) => observer.error(error));
            }, (error) => observer.error(error));
            return () => {
                limpiarRuta();
                unsubscribeRecorrido();
            };
        });
    }
    obtenerRutaDelRecorrido(recorridoId) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const recorridoDoc = yield this.leerDocumento('recorridos', recorridoId);
            if (!(recorridoDoc === null || recorridoDoc === void 0 ? void 0 : recorridoDoc.rutaId)) {
                return null;
            }
            const rutaDoc = yield this.leerDocumento('rutas', recorridoDoc.rutaId);
            if (!rutaDoc) {
                return null;
            }
            return {
                id: rutaDoc.id,
                nombre_ruta: (_b = (_a = rutaDoc.nombre_ruta) !== null && _a !== void 0 ? _a : rutaDoc.nombre) !== null && _b !== void 0 ? _b : 'Ruta sin nombre',
                color_hex: (_c = rutaDoc.color_hex) !== null && _c !== void 0 ? _c : '#22c55e',
                shape: rutaDoc.shape,
                coordenadas: this.extraerCoordenadasDesdeShape(rutaDoc.shape),
            };
        });
    }
    observarEstadoConexion() {
        return new Observable((observer) => {
            const actualizar = () => {
                const estado = {
                    online: navigator.onLine,
                    motivo: navigator.onLine ? 'Conexi�n disponible' : 'Sin conexi�n',
                };
                this.ultimoEstadoConexion = estado;
                observer.next(estado);
            };
            actualizar();
            window.addEventListener('online', actualizar);
            window.addEventListener('offline', actualizar);
            return () => {
                window.removeEventListener('online', actualizar);
                window.removeEventListener('offline', actualizar);
            };
        });
    }
    obtenerPosicionesPorRecorrido(recorridoId) {
        return new Observable((observer) => {
            const posicionesRef = collection(firebaseDB, 'posiciones');
            const q = query(posicionesRef, where('recorridoId', '==', recorridoId));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const posiciones = snapshot.docs
                    .map((item) => (Object.assign({ id: item.id }, item.data())))
                    .sort((a, b) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
                    const fechaA = (_f = (_e = (_d = (_c = (_b = (_a = a.fechaRegistro) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.getTime) === null || _d === void 0 ? void 0 : _d.call(_c)) !== null && _e !== void 0 ? _e : a.fechaRegistro) !== null && _f !== void 0 ? _f : 0;
                    const fechaB = (_m = (_l = (_k = (_j = (_h = (_g = b.fechaRegistro) === null || _g === void 0 ? void 0 : _g.toDate) === null || _h === void 0 ? void 0 : _h.call(_g)) === null || _j === void 0 ? void 0 : _j.getTime) === null || _k === void 0 ? void 0 : _k.call(_j)) !== null && _l !== void 0 ? _l : b.fechaRegistro) !== null && _m !== void 0 ? _m : 0;
                    return fechaA - fechaB;
                });
                observer.next(posiciones);
            }, (error) => {
                var _a;
                if (((_a = error) === null || _a === void 0 ? void 0 : _a.code) === 'permission-denied') {
                    observer.next([]);
                    observer.complete();
                    return;
                }
                observer.error(error);
            });
            return () => unsubscribe();
        });
    }
    obtenerRecorridosActivos() {
        return new Observable((observer) => {
            let unsubscribe;
            let refreshTimer;
            const cargarRecorridos = () => {
                const recorridosRef = collection(firebaseDB, 'recorridos');
                const q = query(recorridosRef);
                unsubscribe === null || unsubscribe === void 0 ? void 0 : unsubscribe();
                unsubscribe = onSnapshot(q, (snapshot) => __awaiter(this, void 0, void 0, function* () {
                    const recorridos = (yield Promise.all(snapshot.docs.map((item) => __awaiter(this, void 0, void 0, function* () {
                        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                        const data = item.data();
                        const ruta = data.rutaId ? yield this.leerDocumento('rutas', data.rutaId) : null;
                        const vehiculo = data.vehiculoId ? yield this.leerDocumento('vehiculos', data.vehiculoId) : null;
                        const estado = String((_a = data.estado) !== null && _a !== void 0 ? _a : '').toLowerCase();
                        if (['finalizado', 'finalizada', 'cancelado', 'cancelada'].includes(estado)) {
                            return null;
                        }
                        return {
                            id: item.id,
                            choferId: (_b = data.choferId) !== null && _b !== void 0 ? _b : 'Sin chofer',
                            estado: (_c = data.estado) !== null && _c !== void 0 ? _c : 'activo',
                            fechaInicio: ((_e = (_d = data.fechaInicio) === null || _d === void 0 ? void 0 : _d.toDate) === null || _e === void 0 ? void 0 : _e.call(_d)) ? data.fechaInicio.toDate().toLocaleString('es-CO') : 'Sin fecha',
                            rutaNombre: (_f = ruta === null || ruta === void 0 ? void 0 : ruta.nombre_ruta) !== null && _f !== void 0 ? _f : 'Ruta no disponible',
                            vehiculoPlaca: (_g = vehiculo === null || vehiculo === void 0 ? void 0 : vehiculo.placa) !== null && _g !== void 0 ? _g : 'Sin veh�culo',
                            vehiculoMarca: (_h = vehiculo === null || vehiculo === void 0 ? void 0 : vehiculo.marca) !== null && _h !== void 0 ? _h : '',
                            vehiculoModelo: (_j = vehiculo === null || vehiculo === void 0 ? void 0 : vehiculo.modelo) !== null && _j !== void 0 ? _j : '',
                        };
                    })))).filter(Boolean);
                    observer.next(recorridos);
                }), (error) => {
                    var _a;
                    if (((_a = error) === null || _a === void 0 ? void 0 : _a.code) === 'permission-denied') {
                        observer.next([]);
                        observer.complete();
                        return;
                    }
                    observer.error(error);
                });
            };
            cargarRecorridos();
            const refrescar = () => {
                if (this.ultimoEstadoConexion.online) {
                    cargarRecorridos();
                }
            };
            refreshTimer = window.setInterval(refrescar, 30000);
            window.addEventListener('online', refrescar);
            window.addEventListener('offline', refrescar);
            return () => {
                if (refreshTimer) {
                    window.clearInterval(refreshTimer);
                }
                window.removeEventListener('online', refrescar);
                window.removeEventListener('offline', refrescar);
                unsubscribe === null || unsubscribe === void 0 ? void 0 : unsubscribe();
            };
        });
    }
    obtenerRecorridosHistoricos(limite = 6) {
        return new Observable((observer) => {
            const recorridosRef = collection(firebaseDB, 'recorridos');
            const q = query(recorridosRef, orderBy('fechaInicio', 'desc'));
            const unsubscribe = onSnapshot(q, (snapshot) => __awaiter(this, void 0, void 0, function* () {
                const recorridos = (yield Promise.all(snapshot.docs.map((item) => __awaiter(this, void 0, void 0, function* () {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                    const data = item.data();
                    const estado = String((_a = data.estado) !== null && _a !== void 0 ? _a : '').toLowerCase();
                    if (!['finalizado', 'finalizada', 'cancelado', 'cancelada'].includes(estado)) {
                        return null;
                    }
                    const ruta = data.rutaId ? yield this.leerDocumento('rutas', data.rutaId) : null;
                    const vehiculo = data.vehiculoId ? yield this.leerDocumento('vehiculos', data.vehiculoId) : null;
                    return {
                        id: item.id,
                        choferId: (_b = data.choferId) !== null && _b !== void 0 ? _b : 'Sin chofer',
                        estado: (_c = data.estado) !== null && _c !== void 0 ? _c : 'finalizado',
                        fechaInicio: ((_e = (_d = data.fechaInicio) === null || _d === void 0 ? void 0 : _d.toDate) === null || _e === void 0 ? void 0 : _e.call(_d)) ? data.fechaInicio.toDate().toLocaleString('es-CO') : 'Sin fecha',
                        rutaNombre: (_f = ruta === null || ruta === void 0 ? void 0 : ruta.nombre_ruta) !== null && _f !== void 0 ? _f : 'Ruta no disponible',
                        vehiculoPlaca: (_g = vehiculo === null || vehiculo === void 0 ? void 0 : vehiculo.placa) !== null && _g !== void 0 ? _g : 'Sin veh�culo',
                        vehiculoMarca: (_h = vehiculo === null || vehiculo === void 0 ? void 0 : vehiculo.marca) !== null && _h !== void 0 ? _h : '',
                        vehiculoModelo: (_j = vehiculo === null || vehiculo === void 0 ? void 0 : vehiculo.modelo) !== null && _j !== void 0 ? _j : '',
                    };
                })))).filter(Boolean);
                observer.next(recorridos.slice(0, limite));
            }), (error) => {
                var _a;
                if (((_a = error) === null || _a === void 0 ? void 0 : _a.code) === 'permission-denied') {
                    observer.next([]);
                    observer.complete();
                    return;
                }
                observer.error(error);
            });
            return () => unsubscribe();
        });
    }
    leerRecorrido(id) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        return __awaiter(this, void 0, void 0, function* () {
            const item = yield this.leerDocumento('recorridos', id);
            if (!item)
                return null;
            const ruta = item.rutaId ? yield this.leerDocumento('rutas', item.rutaId) : null;
            const vehiculo = item.vehiculoId ? yield this.leerDocumento('vehiculos', item.vehiculoId) : null;
            return {
                id: item.id,
                choferId: (_a = item.choferId) !== null && _a !== void 0 ? _a : 'Sin chofer',
                estado: (_b = item.estado) !== null && _b !== void 0 ? _b : 'activo',
                fechaInicio: ((_d = (_c = item.fechaInicio) === null || _c === void 0 ? void 0 : _c.toDate) === null || _d === void 0 ? void 0 : _d.call(_c)) ? item.fechaInicio.toDate().toLocaleString('es-CO') : 'Sin fecha',
                rutaNombre: (_e = ruta === null || ruta === void 0 ? void 0 : ruta.nombre_ruta) !== null && _e !== void 0 ? _e : 'Ruta no disponible',
                vehiculoPlaca: (_f = vehiculo === null || vehiculo === void 0 ? void 0 : vehiculo.placa) !== null && _f !== void 0 ? _f : 'Sin veh�culo',
                vehiculoMarca: (_g = vehiculo === null || vehiculo === void 0 ? void 0 : vehiculo.marca) !== null && _g !== void 0 ? _g : '',
                vehiculoModelo: (_h = vehiculo === null || vehiculo === void 0 ? void 0 : vehiculo.modelo) !== null && _h !== void 0 ? _h : '',
            };
        });
    }
    extraerCoordenadasDesdeShape(shape) {
        const normalizar = (valor) => {
            var _a, _b, _c;
            if (!valor) {
                return [];
            }
            const geometry = (_a = valor === null || valor === void 0 ? void 0 : valor.geometry) !== null && _a !== void 0 ? _a : valor;
            const coordenadas = (_c = (_b = geometry === null || geometry === void 0 ? void 0 : geometry.coordinates) !== null && _b !== void 0 ? _b : valor === null || valor === void 0 ? void 0 : valor.coordinates) !== null && _c !== void 0 ? _c : (Array.isArray(valor) ? valor : undefined);
            if (!Array.isArray(coordenadas) || !coordenadas.length) {
                return [];
            }
            return coordenadas.map((item) => {
                if (!Array.isArray(item) || item.length < 2) {
                    return null;
                }
                const lng = Number(item[0]);
                const lat = Number(item[1]);
                return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
            }).filter((item) => Boolean(item));
        };
        if (typeof shape === 'string') {
            try {
                const parsed = JSON.parse(shape);
                return normalizar(parsed);
            }
            catch (error) {
                console.warn('No fue posible parsear la ruta del recorrido desde shape:', error);
                return [];
            }
        }
        return normalizar(shape);
    }
    leerDocumento(coleccion, id) {
        return __awaiter(this, void 0, void 0, function* () {
            const ref = doc(firebaseDB, coleccion, id);
            const snap = yield getDoc(ref);
            return snap.exists() ? Object.assign({ id: snap.id }, snap.data()) : null;
        });
    }
};
CiudadanoService = __decorate([
    Injectable({
        providedIn: 'root',
    })
], CiudadanoService);
export { CiudadanoService };
//# sourceMappingURL=ciudadano.service.js.map