// Paul estuvo aquí
// Este archivo contiene el servicio encargado de la captura y carga de fotos.
// Su propósito es gestionar almacenamiento, lectura y subida de imágenes.
// Al exponerlo, tener en cuenta: revisar permisos y manejo de errores al exponer funciones con medios.

import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  public photos: UserPhoto[] = [];
  private PHOTO_STORAGE: string = 'photos';

  constructor(private platform: Platform) {}

  public async loadSaved() {
    // Retrieve cached photo array data
    try {
      const photoList = await Preferences.get({ key: this.PHOTO_STORAGE });
      const storedValue = photoList.value;

      if (storedValue) {
        const parsed = JSON.parse(storedValue);
        this.photos = Array.isArray(parsed) ? parsed : [];
      } else {
        this.photos = [];
      }
    } catch (error) {
      this.photos = [];
    }

    // If running on the web...
    if (!this.platform.is('hybrid')) {
      // Display the photo by reading into base64 format
      for (const photo of this.photos) {
        try {
          // Read each saved photo's data from the Filesystem
          const readFile = await Filesystem.readFile({
            path: photo.filepath,
            directory: Directory.Data,
          });

          // Web platform only: Load the photo as base64 data
          photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
        } catch (error) {
          photo.webviewPath = '';
        }
      }
    }
  }

  /* Use the device camera to take a photo:
  // https://capacitor.ionicframework.com/docs/apis/camera

  // Store the photo data into permanent file storage:
  // https://capacitor.ionicframework.com/docs/apis/filesystem

  // Store a reference to all photo filepaths using Storage API:
  // https://capacitor.ionicframework.com/docs/apis/storage
  */
  public async addNewToGallery() {
    // Take a photo
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri, // file-based data; provides best performance
      source: CameraSource.Camera, // automatically take a new photo with the camera
      quality: 100, // highest quality (0 to 100)
    });

    const savedImageFile = await this.savePicture(capturedPhoto);

    // Add new photo to Photos array
    this.photos.unshift(savedImageFile);

    // Cache all photo data for future retrieval
    await Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos),
    });
  }

  // Save picture to file on device
  private async savePicture(photo: Photo) {
    // Convert photo to base64 format, required by Filesystem API to save
    const base64Data = await this.readAsBase64(photo);

    // Write the file to the data directory
    const fileName = `${new Date().getTime()}.jpeg`;
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
    });

    if (this.platform.is('hybrid')) {
      // Display the new image by rewriting the 'file://' path to HTTP
      // Details: https://ionicframework.com/docs/building/webview#file-protocol
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
      };
    } else {
      // Use webPath to display the new image instead of base64 since it's
      // already loaded into memory
      return {
        filepath: fileName,
        webviewPath: photo.webPath || '',
      };
    }
  }

  // Read camera photo into base64 format based on the platform the app is running on
  private async readAsBase64(photo: Photo) {
    // "hybrid" will detect Cordova or Capacitor
    if (this.platform.is('hybrid')) {
      // Read the file into base64 format
      const path = photo.path || '';
      const file = await Filesystem.readFile({
        path,
      });

      return file.data;
    } else {
      const source = photo.webPath || '';
      if (!source) {
        throw new Error('No se encontró la ruta de la imagen para convertirla a base64.');
      }

      // Fetch the photo, read as a blob, then convert to base64 format
      const response = await fetch(source);
      const blob = await response.blob();

      return (await this.convertBlobToBase64(blob)) as string;
    }
  }

  // Delete picture by removing it from reference data and the filesystem
  public async deletePicture(photo: UserPhoto, position: number) {
    // Remove this photo from the Photos reference data array
    this.photos.splice(position, 1);

    // Update photos array cache by overwriting the existing photo array
    await Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos),
    });

    // delete photo file from filesystem
    const filename = photo.filepath.split('/').pop() || photo.filepath;

    try {
      await Filesystem.deleteFile({
        path: filename,
        directory: Directory.Data,
      });
    } catch (error) {
      // Ignore delete errors if the file is already missing.
    }
  }

  convertBlobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(String(reader.result));
      };
      reader.readAsDataURL(blob);
    });
}

export interface UserPhoto {
  filepath: string;
  webviewPath: string;
}
