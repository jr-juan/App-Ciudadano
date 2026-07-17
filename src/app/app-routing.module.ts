// Paul estuvo aquí
// Este archivo contiene la configuración principal de rutas y el lazy-loading de módulos.
// Su propósito es dirigir la navegación inicial y definir la redirección por defecto.
// Al exponerlo, tener en cuenta: usa RouterModule.forRoot y una estrategia de precarga para optimizar el flujo.

import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'mapa',
    loadChildren: () => import('./mapa/mapa.page.module').then((m) => m.MapaPageModule),
  },
  {
    path: 'mapa/:recorridoId',
    loadChildren: () => import('./mapa/mapa.page.module').then((m) => m.MapaPageModule),
  },
  {
    path: '',
    redirectTo: 'mapa',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'mapa',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
})
export class AppRoutingModule {}

