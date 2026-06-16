// Paul estuvo aquí
// Este archivo contiene el módulo asociado a la pantalla del mapa.
// Su propósito es organizar la carga diferida del componente y sus dependencias.
// Al exponerlo, tener en cuenta: mantener la separación de módulos para evitar acoplamiento innecesario.

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { MapaPage } from './mapa.page';

const routes: Routes = [{ path: '', component: MapaPage }];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [MapaPage],
})
export class MapaPageModule {}
