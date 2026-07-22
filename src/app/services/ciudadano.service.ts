// Este archivo contiene el servicio principal para datos del ciudadano y recorridos.
// Su propósito es centralizar peticiones y transformaciones de información para la vista.
// Al exponerlo, tener en cuenta: su flujo es crítico para la sincronización entre UI y backend.

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  collection,
  getDoc,
  onSnapshot,
  query,
  where,
  doc,
  DocumentData,
  orderBy,
} from 'firebase/firestore';
import { firebaseDB } from './firebase.config';

interface EstadoConexion {
  online: boolean;
  motivo?: string;
}

export interface RecorridoCiudadano {
  id: string;
  choferId: string;
  estado: string;
  fechaInicio?: string;
  rutaNombre?: string;
  vehiculoPlaca?: string;
  vehiculoMarca?: string;
  vehiculoModelo?: string;
}

export interface RutaCiudadana {
  id: string;
  nombre_ruta?: string;
  color_hex?: string;
  shape?: string;
  coordenadas?: Array<[number, number]>;
}

@Injectable({
  providedIn: 'root',
})
export class CiudadanoService {
  private ultimoEstadoConexion: EstadoConexion = { online: navigator.onLine };

  obtenerRecorridoPorId(id: string): Promise<RecorridoCiudadano | null> {
    return this.leerRecorrido(id);
  }

  observarRecorrido(recorridoId: string): Observable<RecorridoCiudadano | null> {
    return new Observable((observer) => {
      const ref = doc(firebaseDB, 'recorridos', recorridoId);
      const unsubscribe = onSnapshot(
        ref,
        async (snapshot) => {
          if (!snapshot.exists()) {
            observer.next(null);
            return;
          }

          const data = snapshot.data() as DocumentData;
          const ruta = data.rutaId ? await this.leerDocumento('rutas', data.rutaId) : null;
          const vehiculo = data.vehiculoId ? await this.leerDocumento('vehiculos', data.vehiculoId) : null;

          observer.next({
            id: snapshot.id,
            choferId: data.choferId ?? 'Sin chofer',
            estado: data.estado ?? 'activo',
            fechaInicio: data.fechaInicio?.toDate?.()
              ? data.fechaInicio.toDate().toLocaleString('es-CO')
              : 'Sin fecha',
            rutaNombre: ruta?.nombre_ruta ?? 'Ruta no disponible',
            vehiculoPlaca: vehiculo?.placa ?? 'Sin vehículo',
            vehiculoMarca: vehiculo?.marca ?? '',
            vehiculoModelo: vehiculo?.modelo ?? '',
          } as RecorridoCiudadano);
        },
        (error) => observer.error(error),
      );

      return () => unsubscribe();
    });
  }

  observarRutaDelRecorrido(recorridoId: string): Observable<RutaCiudadana | null> {
    return new Observable((observer) => {
      let rutaUnsubscribe: (() => void) | undefined;
      const limpiarRuta = () => {
        rutaUnsubscribe?.();
        rutaUnsubscribe = undefined;
      };

      const refRecorrido = doc(firebaseDB, 'recorridos', recorridoId);
      const unsubscribeRecorrido = onSnapshot(
        refRecorrido,
        (snapshot) => {
          if (!snapshot.exists()) {
            limpiarRuta();
            observer.next(null);
            return;
          }

          const data = snapshot.data() as DocumentData;
          const rutaId = data.rutaId as string | undefined;
          const estado = String(data.estado ?? '').trim().toLowerCase();
          const estadoTerminal = this.esEstadoTerminal(estado);

          if (!rutaId || estadoTerminal) {
            limpiarRuta();
            observer.next(null);
            return;
          }

          limpiarRuta();
          const rutaRef = doc(firebaseDB, 'rutas', rutaId);
          rutaUnsubscribe = onSnapshot(
            rutaRef,
            (rutaSnapshot) => {
              if (!rutaSnapshot.exists()) {
                observer.next(null);
                return;
              }

              const rutaData = rutaSnapshot.data() as DocumentData;
              const coordenadas = this.extraerCoordenadasDesdeShape(rutaData.shape);
              observer.next({
                id: rutaSnapshot.id,
                nombre_ruta: rutaData.nombre_ruta ?? rutaData.nombre ?? 'Ruta sin nombre',
                color_hex: rutaData.color_hex ?? '#22c55e',
                shape: rutaData.shape,
                coordenadas,
              } as RutaCiudadana);
            },
            (error) => observer.error(error),
          );
        },
        (error) => observer.error(error),
      );

      return () => {
        limpiarRuta();
        unsubscribeRecorrido();
      };
    });
  }

  observarDocumentoChofer(dispositivoId: string): Observable<any> {
    return new Observable((observer: any) => {
      const ref = doc(firebaseDB, 'dispositivos', dispositivoId);
      const unsubscribe = onSnapshot(
        ref,
        (snapshot: any) => {
          console.log('[ciudadano.listener.chofer] snapshot dispositivo', { path: ref.path, exists: snapshot.exists(), data: snapshot.data() });
          observer.next(snapshot.exists() ? snapshot.data() : null);
        },
        (error: any) => observer.error(error),
      );
      return () => unsubscribe();
    });
  }

  async obtenerRutaDelRecorrido(recorridoId: string): Promise<RutaCiudadana | null> {
    const recorridoDoc = await this.leerDocumento('recorridos', recorridoId);
    if (!recorridoDoc?.rutaId) {
      return null;
    }

    const rutaDoc = await this.leerDocumento('rutas', recorridoDoc.rutaId);
    if (!rutaDoc) {
      return null;
    }

    return {
      id: rutaDoc.id,
      nombre_ruta: rutaDoc.nombre_ruta ?? rutaDoc.nombre ?? 'Ruta sin nombre',
      color_hex: rutaDoc.color_hex ?? '#22c55e',
      shape: rutaDoc.shape,
      coordenadas: this.extraerCoordenadasDesdeShape(rutaDoc.shape),
    } as RutaCiudadana;
  }

  observarEstadoConexion(): Observable<EstadoConexion> {
    return new Observable((observer) => {
      const actualizar = () => {
        const estado: EstadoConexion = {
          online: navigator.onLine,
          motivo: navigator.onLine ? 'Conexión disponible' : 'Sin conexión',
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

  obtenerPosicionesPorRecorrido(recorridoId: string): Observable<any[]> {
    return new Observable((observer) => {
      const posicionesRef = collection(firebaseDB, 'posiciones');
      const q = query(
        posicionesRef,
        where('recorridoId', '==', recorridoId),
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const posiciones = (snapshot.docs
            .map((item) => ({ id: item.id, ...(item.data() as any) })) as any[])
            .sort((a, b) => {
              const fechaA = a.fechaRegistro?.toDate?.()?.getTime?.() ?? a.fechaRegistro ?? 0;
              const fechaB = b.fechaRegistro?.toDate?.()?.getTime?.() ?? b.fechaRegistro ?? 0;
              return fechaA - fechaB;
            });

          observer.next(posiciones);
        },
        (error) => {
          if ((error as any)?.code === 'permission-denied') {
            observer.next([]);
            observer.complete();
            return;
          }
          observer.error(error);
        },
      );

      return () => unsubscribe();
    });
  }

  obtenerRecorridosActivos(): Observable<RecorridoCiudadano[]> {
    return new Observable((observer) => {
      let unsubscribe: (() => void) | undefined;
      let refreshTimer: number | undefined;

      const cargarRecorridos = () => {
        const recorridosRef = collection(firebaseDB, 'recorridos');
        const q = query(recorridosRef);

        unsubscribe?.();

        unsubscribe = onSnapshot(
          q,
          async (snapshot) => {
            const recorridos = (await Promise.all(
              snapshot.docs.map(async (item) => {
                const data = item.data() as DocumentData;
                const ruta = data.rutaId
                  ? await this.leerDocumento('rutas', data.rutaId)
                  : null;
                const vehiculo = data.vehiculoId
                  ? await this.leerDocumento('vehiculos', data.vehiculoId)
                  : null;

                const estado = String(data.estado ?? '').trim().toLowerCase();
                if (this.esEstadoTerminal(estado)) {
                  return null;
                }

                return {
                  id: item.id,
                  choferId: data.choferId ?? 'Sin chofer',
                  estado: data.estado ?? 'activo',
                  fechaInicio: data.fechaInicio?.toDate?.()
                    ? data.fechaInicio.toDate().toLocaleString('es-CO')
                    : 'Sin fecha',
                  rutaNombre: ruta?.nombre_ruta ?? 'Ruta no disponible',
                  vehiculoPlaca: vehiculo?.placa ?? 'Sin vehículo',
                  vehiculoMarca: vehiculo?.marca ?? '',
                  vehiculoModelo: vehiculo?.modelo ?? '',
                } as RecorridoCiudadano;
              }),
            )).filter(Boolean) as RecorridoCiudadano[];

            observer.next(recorridos);
          },
          (error) => {
            if ((error as any)?.code === 'permission-denied') {
              observer.next([]);
              observer.complete();
              return;
            }
            observer.error(error);
          },
        );
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
        unsubscribe?.();
      };
    });
  }

  obtenerRecorridosHistoricos(limite = 6): Observable<RecorridoCiudadano[]> {
    return new Observable((observer) => {
      const recorridosRef = collection(firebaseDB, 'recorridos');
      const q = query(recorridosRef, orderBy('fechaInicio', 'desc'));

      const unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          const recorridos = (await Promise.all(
            snapshot.docs.map(async (item) => {
              const data = item.data() as DocumentData;
              const estado = String(data.estado ?? '').trim().toLowerCase();
              if (!this.esEstadoTerminal(estado)) {
                return null;
              }

              const ruta = data.rutaId ? await this.leerDocumento('rutas', data.rutaId) : null;
              const vehiculo = data.vehiculoId ? await this.leerDocumento('vehiculos', data.vehiculoId) : null;

              return {
                id: item.id,
                choferId: data.choferId ?? 'Sin chofer',
                estado: data.estado ?? 'finalizado',
                fechaInicio: data.fechaInicio?.toDate?.()
                  ? data.fechaInicio.toDate().toLocaleString('es-CO')
                  : 'Sin fecha',
                rutaNombre: ruta?.nombre_ruta ?? 'Ruta no disponible',
                vehiculoPlaca: vehiculo?.placa ?? 'Sin vehículo',
                vehiculoMarca: vehiculo?.marca ?? '',
                vehiculoModelo: vehiculo?.modelo ?? '',
              } as RecorridoCiudadano;
            }),
          )).filter(Boolean) as RecorridoCiudadano[];

          observer.next(recorridos.slice(0, limite));
        },
        (error) => {
          if ((error as any)?.code === 'permission-denied') {
            observer.next([]);
            observer.complete();
            return;
          }
          observer.error(error);
        },
      );

      return () => unsubscribe();
    });
  }

  private esEstadoTerminal(estado: unknown): boolean {
    const valor = String(estado ?? '').trim().toLowerCase();
    return ['finalizado', 'finalizada', 'cancelado', 'cancelada'].includes(valor);
  }

  private async leerRecorrido(id: string): Promise<RecorridoCiudadano | null> {
    const item = await this.leerDocumento('recorridos', id);
    if (!item) return null;

    const ruta = item.rutaId ? await this.leerDocumento('rutas', item.rutaId) : null;
    const vehiculo = item.vehiculoId ? await this.leerDocumento('vehiculos', item.vehiculoId) : null;

    return {
      id: item.id,
      choferId: item.choferId ?? 'Sin chofer',
      estado: item.estado ?? 'activo',
      fechaInicio: item.fechaInicio?.toDate?.()
        ? item.fechaInicio.toDate().toLocaleString('es-CO')
        : 'Sin fecha',
      rutaNombre: ruta?.nombre_ruta ?? 'Ruta no disponible',
      vehiculoPlaca: vehiculo?.placa ?? 'Sin vehículo',
      vehiculoMarca: vehiculo?.marca ?? '',
      vehiculoModelo: vehiculo?.modelo ?? '',
    } as RecorridoCiudadano;
  }

  private extraerCoordenadasDesdeShape(shape: unknown): Array<[number, number]> {
    const normalizar = (valor: any): Array<[number, number]> => {
      if (!valor) {
        return [];
      }

      const geometry = valor?.geometry ?? valor;
      const coordenadas = geometry?.coordinates ?? valor?.coordinates ?? (Array.isArray(valor) ? valor : undefined);
      if (!Array.isArray(coordenadas) || !coordenadas.length) {
        return [];
      }

      return coordenadas
        .map((item: any) => {
          if (!Array.isArray(item) || item.length < 2) {
            return null;
          }

          const lng = Number(item[0]);
          const lat = Number(item[1]);
          return Number.isFinite(lat) && Number.isFinite(lng) ? ([lat, lng] as [number, number]) : null;
        })
        .filter((item): item is [number, number] => Boolean(item));
    };

    if (typeof shape === 'string') {
      try {
        const parsed = JSON.parse(shape);
        return normalizar(parsed);
      } catch (error) {
        console.warn('No fue posible parsear la ruta del recorrido desde shape:', error);
        return [];
      }
    }

    return normalizar(shape);
  }

  private async leerDocumento(coleccion: string, id: string) {
    const ref = doc(firebaseDB, coleccion, id);
    const snap = await getDoc(ref);
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as any) : null;
  }
}
