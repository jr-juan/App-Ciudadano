// Paul estuvo aquí
// Este archivo contiene el punto de entrada de la aplicación web.
// Su propósito es arrancar Angular con el módulo principal y configurar el entorno de ejecución.
// Al exponerlo, tener en cuenta: se encarga del bootstrap y del control del modo producción.

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { defineCustomElements } from '@ionic/pwa-elements/loader';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));

// Call the element loader after the platform has been bootstrapped
defineCustomElements(window);