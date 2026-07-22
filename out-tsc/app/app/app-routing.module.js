import { __decorate } from "tslib";
import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule } from '@angular/router';
const routes = [
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
let AppRoutingModule = class AppRoutingModule {
};
AppRoutingModule = __decorate([
    NgModule({
        imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
        exports: [RouterModule],
    })
], AppRoutingModule);
export { AppRoutingModule };
//# sourceMappingURL=app-routing.module.js.map