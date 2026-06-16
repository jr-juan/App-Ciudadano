// Paul estuvo aquí
// Este archivo contiene las pruebas del servicio de fotos.
// Su propósito es validar el comportamiento esperado del manejo de imágenes.
// Al exponerlo, tener en cuenta: evitar depender de mocks complejos si el flujo real es fácil de verificar.

import { TestBed } from '@angular/core/testing';
import { Platform } from '@ionic/angular';
import { Preferences } from '@capacitor/preferences';

import { PhotoService } from './photo.service';

describe('PhotoService', () => {
  let service: PhotoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PhotoService,
        {
          provide: Platform,
          useValue: {
            is: jasmine.createSpy('is').and.returnValue(false),
          },
        },
      ],
    });

    service = TestBed.inject(PhotoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should keep an empty list when no photos are stored', async () => {
    spyOn(Preferences, 'get').and.resolveTo({ value: undefined } as any);

    await expectAsync(service.loadSaved()).toBeResolved();
    expect(service.photos).toEqual([]);
  });
});
