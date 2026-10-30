# Auvioz

**Habla, transcribe y traduce.** Interfaz en 12 idiomas, lista para alojamiento estático en Vercel.

## Desarrollo y despliegue

Node 22.12+ y npm. Ejecuta `npm ci` y `npm run dev`. `npm run build` genera `dist`; `npm run preview` permite comprobar ese resultado. En Vercel, selecciona Vite, build `npm run build`, salida `dist` y rama de producción `final`.

La interfaz ya no llama al servidor local de eSpeak/FFmpeg. No necesita claves ni backend para sintetizar voz con Web Speech. Los archivos `server/` se conservan como implementación anterior opcional, fuera del flujo actual.

## Voz e historial

La lista de voces se actualiza con `voiceschanged` y muestra las voces instaladas para el idioma elegido. Se respeta la selección explícita; si existe una voz española con nombre masculino conocido, se preselecciona. La API no expone género y las voces dependen del dispositivo: no se puede crear una voz que el sistema no ofrece.

El historial guarda texto, idioma, voz, volumen y velocidad en IndexedDB. Permite volver a sintetizar cada frase, incluso tras recargar. No almacena un archivo grabado de Web Speech ni ofrece descargas MP3/WAV. Los audios antiguos que ya estaban almacenados siguen pudiendo reproducirse y descargarse. JSON exporta texto y ajustes.

La opción de omitir símbolos conserva puntuación para pausas y letras/marcas Unicode. El idioma inicial respeta una selección guardada y, en su ausencia, `navigator.languages`; no requiere geolocalización IP. Se usa inglés si ninguna preferencia es compatible.

## Transcripción y traducción

SpeechRecognition requiere un navegador compatible y permisos; puede usar servicios externos del proveedor. El reconocimiento de archivos mediante `start(audioTrack)` es experimental en Chromium 135+. Translator también depende de compatibilidad y modelos descargables. Ambos lados del traductor tienen copiar y escuchar con el idioma correspondiente. Ninguna prueba con dobles sustituye una comprobación real del proveedor.

## Intro e identidad

Logo original: `public/logo_auvioz.jpg`. Videos originales de seis segundos en `public/media`: `_1.mp4` para hasta 760 px y `_2.mp4` para pantallas mayores. Se reproducen silenciosamente por carga, sin recorte, con omisión y Escape. Si autoplay se bloquea se ofrece reproducir manualmente; un error o espera máxima de 20 segundos permite continuar. Se respeta movimiento reducido. Se bloquean menú contextual y arrastre de la intro; esto no impide extraer los archivos con herramientas de red.

Banderas locales de [Circle Flags](https://github.com/HatScripts/circle-flags), licencia MIT incluida en `public/flags/LICENSE.md`.

## Comprobaciones

- `npm run lint`, `npm run build`, `npm test`.
- Con `npm run preview -- --port 5174`, ejecutar `python tests/browser_speech.py` (Playwright y Chromium): persistencia, voces, interfaz, idioma, traducción y móvil con un adaptador de voz controlado.
- `AUVIOZ_TEST_URL=http://127.0.0.1:5174 python tests/intro_browser.py`: reproducción real de ambas intros, omisión, errores y movimiento reducido.
- Las pruebas del antiguo backend están separadas en `npm run test:audio` y requieren eSpeak/FFmpeg.
