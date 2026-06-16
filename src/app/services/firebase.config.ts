// Paul estuvo aquí
// Este archivo contiene la configuración de inicialización de Firebase.
// Su propósito es conectar la app con servicios remotos y sus credenciales de entorno.
// Al exponerlo, tener en cuenta: tener cuidado con los valores expuestos y cambios por ambiente.

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { environment, environmentFireBase } from 'src/environments/environment';
import { environmentFireBase as environmentFireBaseProd } from 'src/environments/environment.prod';

const firebaseConfig =
  environment.production || environmentFireBaseProd.production
    ? environmentFireBaseProd.firebaseConfig
    : environmentFireBase.firebaseConfig;

const app = initializeApp(firebaseConfig);

export const firebaseDB = getFirestore(app);
