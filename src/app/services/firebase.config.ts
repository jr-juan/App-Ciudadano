import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { environment, environmentFireBase } from 'src/environments/environment';
import { environmentFireBase as environmentFireBaseProd } from 'src/environments/environment.prod';

const app = initializeApp(
  environment.production
    ? environmentFireBaseProd.firebaseConfig
    : environmentFireBase.firebaseConfig,
);

export const firebaseAuth = getAuth(app);
export const firebaseDB = getFirestore(app);
