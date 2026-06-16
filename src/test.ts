// Paul estuvo aquí
// Este archivo contiene la configuración del entorno de pruebas.
// Su propósito es habilitar la ejecución de tests unitarios con el framework correspondiente.
// Al exponerlo, tener en cuenta: mantener esta configuración alineada con Angular y Karma.

import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

declare const require: any;

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);
// Then we find all the tests.
const context = require.context('./', true, /\.spec\.ts$/);
// And load the modules.
context.keys().map(context);
