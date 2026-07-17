import { __decorate, __metadata } from "tslib";
import { Component } from '@angular/core';
import { SplashScreen } from '@capacitor/splash-screen';
let AppComponent = class AppComponent {
    constructor() {
        this.initializeApp();
    }
    initializeApp() {
        SplashScreen.hide();
    }
};
AppComponent = __decorate([
    Component({
        selector: 'app-root',
        templateUrl: 'app.component.html',
        styleUrls: ['app.component.scss'],
    }),
    __metadata("design:paramtypes", [])
], AppComponent);
export { AppComponent };
//# sourceMappingURL=app.component.js.map