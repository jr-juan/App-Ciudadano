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
} from 'firebase/firestore';
import { firebaseDB } from './firebase.config';

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

@Injectable({
  providedIn: 'root',
})
export class CiudadanoService {
  obtenerRecorridoPorId(id: string): Promise<RecorridoCiudadano | null> {
    return this.leerRecorrido(id);
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
      const recorridosRef = collection(firebaseDB, 'recorridos');
      const q = query(recorridosRef);

      const unsubscribe = onSnapshot(
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

              const estado = String(data.estado ?? '').toLowerCase();
              if (['finalizado', 'finalizada', 'cancelado', 'cancelada'].includes(estado)) {
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

      return () => unsubscribe();
    });
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

  private async leerDocumento(coleccion: string, id: string) {
    const ref = doc(firebaseDB, coleccion, id);
    const snap = await getDoc(ref);
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as any) : null;
  }
}
