import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { environment, environmentFireBase } from 'src/environments/environment';
import { environmentFireBase as environmentFireBaseProd } from 'src/environments/environment.prod';
const firebaseConfig = environment.production || environmentFireBaseProd.production
    ? environmentFireBaseProd.firebaseConfig
    : environmentFireBase.firebaseConfig;
const app = initializeApp(firebaseConfig);
export const firebaseDB = getFirestore(app);
//# sourceMappingURL=firebase.config.js.map