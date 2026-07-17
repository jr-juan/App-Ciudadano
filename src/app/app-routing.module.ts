
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
