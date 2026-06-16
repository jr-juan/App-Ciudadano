// Paul estuvo aquí
// Este archivo contiene el módulo de navegación por pestañas.
// Su propósito es registrar el componente y rutas que pertenecen al flujo de tabs.
// Al exponerlo, tener en cuenta: usa lazy-loading y módulos separados para mantener la app organizada.

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { Tab1Page } from '../tab1/tab1.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'tab1',
        component: Tab1Page,
      },
      {
        path: '',
        redirectTo: 'tab1',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  declarations: [TabsPage, Tab1Page],
  imports: [CommonModule, IonicModule, RouterModule.forChild(routes)],
})
export class TabsPageModule {}
