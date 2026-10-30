# Auvioz

**Habla, transcribe y traduce.** Interfaz React con 12 idiomas, voz local descargable, reconocimiento de voz del navegador y Chromium Translator.

## Desarrollo

Requisitos: Node.js 22.12+ (validado con 24.19), npm, **eSpeak NG 1.52+**, **FFmpeg con libmp3lame** y ffprobe para las pruebas. En Debian/Ubuntu, instala los motores con `sudo apt-get install espeak-ng ffmpeg`.

```sh
npm ci
npm run dev
```

Vite usa el puerto 5173 y reenvía `/api` al servidor Node en 3001. Ambos procesos arrancan con `npm run dev`. Si los ejecutables no están en PATH, crea `.env.local` (ignorado por Git):

```dotenv
ESPEAK_BIN=/ruta/al/ejecutable/espeak-ng
FFMPEG_BIN=/ruta/al/ejecutable/ffmpeg
```

En el entorno cloud preparado, eSpeak está instalado sin privilegios en `/workspace/auvioz-tools`; `.env.local` ya apunta a su ejecutable. Estos archivos locales no forman parte del repositorio.

```sh
npm run build
npm start
```

En producción, Node sirve `dist` y la API desde el mismo origen. **Un despliegue exclusivamente estático no puede generar descargas**: se necesita el proceso Node con los motores instalados. `HOST` y `PORT` configuran la escucha (por defecto 127.0.0.1:3001); usa HTTPS para micrófono y APIs del navegador fuera de localhost. `AUVIOZ_ALLOWED_ORIGINS` acepta orígenes adicionales separados por comas (por defecto, el origen local de desarrollo). No hay claves ni proveedores de pago. Para publicar un servicio abierto, añade autenticación/cuotas en el proxy; la API limita longitud del texto y concurrencia, pero no implementa cuentas de usuario.

## Funciones y límites reales

- **Audio local:** eSpeak genera voz y FFmpeg aplica volumen, velocidad del motor y frecuencia de muestreo. WAV PCM o MP3 reales; reproducción y descarga usan el mismo Blob. Su calidad es sintética/robótica. Cambiar la frecuencia no mejora el detalle de la voz original. Volumen de 10–100% para evitar exportaciones silenciosas accidentales.
- **Voz del navegador:** opción de escucha con Web Speech, dependiente de las voces del sistema. No produce archivos ni admite elegir frecuencia de muestreo; los controles correspondientes se desactivan.
- **Símbolos:** opción que quita símbolos como `/` y `#` conservando letras, marcas Unicode y puntuación para pausas naturales. La duración exacta depende del motor.
- **Historial:** IndexedDB conserva texto, ajustes y el Blob de audio entre recargas. Exportar JSON guarda texto y ajustes, **no binarios de audio**. Descarga los audios por separado. Importar acepta también el campo `texto` del historial antiguo; permite regenerar audios, renombrarlos y eliminarlos.
- **Transcripción de micrófono:** `SpeechRecognition`/`webkitSpeechRecognition` y `MediaRecorder` para conservar la grabación original. Requiere permiso. El servicio de reconocimiento del navegador puede enviar audio a su proveedor y necesitar red.
- **Transcripción de archivos:** decodifica audio y entrega una pista `MediaStreamTrack` a `SpeechRecognition.start(track)`. Es experimental y requiere Chromium 135+ con esta sobrecarga implementada/habilitada; detectar la versión es solo una comprobación preliminar. No se promete reconocimiento sin conexión ni compatibilidad universal. Archivos de hasta 25 MB, procesados en tiempo real. Navegadores sin soporte muestran la limitación. La grabación original se descarga en el formato soportado por MediaRecorder (WebM/Ogg/M4A), no se etiqueta falsamente como MP3.
- **Traducción:** utiliza `Translator.availability`, `Translator.create` y `translate`; informa cuando un par no está disponible y muestra la descarga de modelos. Requiere un Chromium compatible, modelos disponibles y recursos suficientes. No sustituye la API por respuestas inventadas. Traducir al mismo idioma conserva el texto.
- **12 idiomas de interfaz:** español, inglés, portugués, francés, alemán, italiano, japonés, chino simplificado, ruso, árabe (RTL), hindi y turco. El idioma de interfaz es independiente del idioma del audio.

## Identidad

Logo original incorporado en `public/logo_auvioz.jpg`, utilizado en la cabecera, el favicon y el manifiesto.

## Validación

```sh
npm run lint
npm run build
# Si eSpeak está en una ruta personalizada, exporta ESPEAK_BIN para las pruebas:
ESPEAK_BIN=/ruta/al/ejecutable/espeak-ng node tests/audio.test.mjs
npm test
```

Las pruebas comprueban texto multilingüe y pausas, validación de entradas, cobertura de traducciones, WAV/MP3 decodificables con señal, frecuencias de 16/24/48 kHz y volumen reducido. La prueba de navegador requiere Python Playwright y Chromium: `python tests/browser_smoke.py`, con `npm run dev` activo. Comprueba descarga, persistencia del historial, 12 idiomas, RTL y móvil. Los modelos reales de Translator y el reconocimiento real de voz dependen del navegador y no se consideran validados solo por probar la interfaz.

Banderas circulares: [Circle Flags de HatScripts](https://github.com/HatScripts/circle-flags), licencia MIT incluida en `public/flags/LICENSE.md`. Las pruebas `python tests/browser_apis.py` usan dobles de las APIs para verificar la integración, no servicios reales.

## Intro responsive

Al abrir la página se reproduce una intro silenciosa de unos seis segundos. Se selecciona `public/media/Auvioz_app_logo_animation_1.mp4` para anchos de hasta 760 px y `_2.mp4` para pantallas mayores, una sola vez por carga de página. Se conserva la proporción del video sin recortarlo. Permite omitir con el botón o Escape; respeta movimiento reducido y continúa ante errores, bloqueo de autoplay o tras 10 segundos de espera máxima.

El menú contextual y arrastre se bloquean en la intro, sin controles de descarga. Esto no protege el archivo frente a herramientas de red ni impide capturas. El servidor de producción sirve `video/mp4` y admite peticiones Range para reproducción móvil. Prueba: `AUVIOZ_TEST_URL=http://127.0.0.1:3003 python tests/intro_browser.py`, con el servidor ejecutándose en ese puerto.
