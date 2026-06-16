// Paul estuvo aquí
// Este archivo contiene el módulo raíz de Angular que registra la aplicación.
// Su propósito es inicializar la app, declarar el componente principal y configurar proveedores globales.
// Al exponerlo, tener en cuenta: integra Ionic y define el RouteReuseStrategy para el comportamiento de rutas.

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent]
})
export class AppModule {}
