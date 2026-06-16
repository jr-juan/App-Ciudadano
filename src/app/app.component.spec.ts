// Paul estuvo aquí
// Este archivo contiene las pruebas unitarias del componente raíz.
// Su propósito es validar el comportamiento básico del componente y su inicialización.
// Al exponerlo, tener en cuenta: conviene mantener pruebas simples para evitar fragilidad en la UI.

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed, async } from '@angular/core/testing';

import { AppComponent } from './app.component';

describe('AppComponent', () => {

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AppComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [],
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  // TODO: add more tests!

});
