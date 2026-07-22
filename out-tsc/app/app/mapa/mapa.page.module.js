import { __decorate } from "tslib";
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { MapaPage } from './mapa.page';
const routes = [{ path: '', component: MapaPage }];
let MapaPageModule = class MapaPageModule {
};
MapaPageModule = __decorate([
    NgModule({
        imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
        declarations: [MapaPage],
    })
], MapaPageModule);
export { MapaPageModule };
//# sourceMappingURL=mapa.page.module.js.map