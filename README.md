# SensoricaApp — Taller Sensórica Final

Desarrollador: Santiago Velandia

## Requisitos
Node.js LTS, npm, Expo Go compatible con SDK 52 y cuenta de Expo para compilar con EAS.

## Instalar y probar
```bash
npm install
npx expo start -c
```
Escanea el QR con Expo Go. Concede permisos de cámara, ubicación y galería.

## Generar APK desde GitHub Codespaces
```bash
npm install
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build --platform android --profile preview
```
Al terminar, EAS mostrará un enlace para descargar el APK.

## Funcionalidades
- Bienvenida de 5 segundos con nombre de desarrollador.
- Acelerómetro, giroscopio, magnetómetro y barómetro si el hardware los incorpora.
- GPS y mapa con marcador.
- Cámara, guardado en galería y compartir.

## Limitación importante de sensores
Expo Sensors SDK 52 no expone de forma universal temperatura de batería, temperatura interna, temperatura ambiental, humedad ni luz. El código no inventa lecturas: informa que estos datos requieren hardware y un módulo nativo específico. El dispositivo también puede carecer de esos sensores.

## Nota
El proyecto usa Expo SDK 52 (la versión que estaba configurada en el ZIP original). No actualices a SDK 58 sin confirmar primero que esa versión existe y es compatible con la versión de Expo Go instalada.
