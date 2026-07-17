// Paul estuvo aquí
// Este archivo contiene la lógica del componente raíz de la interfaz.
// Su propósito es gestionar el arranque de la app y ocultar el splash screen cuando la vista está lista.
// Al exponerlo, tener en cuenta: depende de Capacitor para controlar el ciclo de vida visual.

import { Component } from '@angular/core';
import { SplashScreen } from '@capacitor/splash-screen';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  constructor() {
    this.initializeApp();
  }

  initializeApp() {
    /* To make sure we provide the fastest app loading experience
       for our users, hide the splash screen automatically
       when the app is ready to be used:

        https://capacitor.ionicframework.com/docs/apis/splash-screen#hiding-the-splash-screen
    */
    SplashScreen.hide();
  }
}
