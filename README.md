<div align="center">

# 🗺️ App Ciudadano

### Sistema de Recolección de Basura

![Ionic](https://img.shields.io/badge/Ionic-8-3880FF?style=for-the-badge&logo=ionic&logoColor=white)
![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Mapbox](https://img.shields.io/badge/Mapbox-000000?style=for-the-badge&logo=mapbox&logoColor=white)

_Aplicación móvil que permite a los ciudadanos rastrear en tiempo real los camiones de recolección de basura, visualizando rutas asignadas y posiciones GPS en vivo mediante Firebase Firestore y un mapa interactivo._

</div>

---

## 🔗 Ecosistema del proyecto

Este repositorio forma parte de un sistema compuesto por tres aplicaciones que trabajan en conjunto:

| Aplicación                         | Repositorio                                                         | Descripción                                                      |
| ---------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 🌐 App Web (Angular)               | [Proyecto-Angular](https://github.com/jr-juan/Proyecto-Angular.git) | Panel administrativo para gestión de rutas, vehículos y usuarios |
| 📱 **App Ciudadano** _(este repo)_ | [App-Ciudadano](https://github.com/jr-juan/App-Ciudadano.git)       | Visualización en tiempo real de rutas y camiones                 |
| 🚛 App Chofer                      | [App-Chofer](https://github.com/jr-juan/App-Chofer.git)             | Transmisión GPS en tiempo real del conductor                     |

---

## ✨ Funcionalidades

- 🔐 Autenticación segura con Firebase Auth
- 🗺️ Visualización de rutas de recolección sobre mapa interactivo con Mapbox
- 📡 Rastreo en tiempo real de la ubicación de los camiones
- 🔄 Integración con API REST del sistema administrativo

---

## 🛠️ Tecnologías

| Tecnología         | Uso                           | Documentación                                                     |
| ------------------ | ----------------------------- | ----------------------------------------------------------------- |
| Ionic 8            | Framework de desarrollo móvil | [ionicframework.com](https://ionicframework.com/docs)             |
| Angular            | Framework web para la lógica  | [angular.dev](https://angular.dev)                                |
| Firebase Auth      | Autenticación de usuarios     | [firebase.google.com](https://firebase.google.com/docs/auth)      |
| Firebase Firestore | Base de datos en tiempo real  | [firebase.google.com](https://firebase.google.com/docs/firestore) |
| Mapbox             | Mapas interactivos            | [mapbox.com](https://docs.mapbox.com)                             |

---

## ⚙️ Instalación

```bash
# Clonar el repositorio
git clone https://github.com/jr-juan/App-Ciudadano.git

# Entrar al proyecto
cd App-Ciudadano

# Instalar dependencias
npm install

# Ejecutar en el navegador
ionic serve
```

---

## 👥 Equipo de desarrollo

<div align="center">

Proyecto universitario desarrollado como parte del curso de desarrollo móvil.

**Sistema de Gestión de Rutas de Recolección de Basura**

| Nombre | Rol |
|---|---|
| 👨‍💻 Juan Roman Cuero Ordoñez | Desarrollador  |
| 👩‍💻 Heily Alexandra Estupiñan Marulanda | Desarrolladora |
| 👨‍💻 Pablo Murillo Lemus | Desarrollador  |
| 👨‍💻 _¿nuevo miembro?_ | Desarrollador  |

_Construido con ❤️ usando Ionic, Angular y Firebase_

</div>
