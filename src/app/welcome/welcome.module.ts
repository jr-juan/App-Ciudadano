import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { WelcomePage } from './welcome.page';

const routes: Routes = [{ path: '', component: WelcomePage }];

@NgModule({
  imports: [CommonModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [WelcomePage],
})
export class WelcomePageModule {}
