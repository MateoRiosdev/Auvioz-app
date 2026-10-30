<div align="center">

<img src="public/logo_auvioz.jpg" alt="Auvioz Logo" width="150">

# Auvioz

### Habla, transcribe y traduce.

Una aplicación web gratuita y multilingüe para convertir texto en voz, transcribir audio mediante reconocimiento de voz y traducir textos en una interfaz intuitiva.

**[🌐 Probar Auvioz](https://auvioz-app-eta.vercel.app/)** · **[🇬🇧 English](#english)**

![Status](https://img.shields.io/badge/status-active-brightgreen)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)
![Vite](https://img.shields.io/badge/Vite-powered-646CFF)
![Languages](https://img.shields.io/badge/interface-10%20languages-blue)
![Deployment](https://img.shields.io/badge/deployment-Vercel-black)

</div>

---

## 📖 Acerca del proyecto

**Auvioz** es una aplicación web que reúne herramientas de voz, transcripción y traducción en una misma interfaz.

Está diseñada para facilitar la lectura de textos mediante voz, practicar idiomas y trabajar con contenido escrito o hablado.

La aplicación puede desplegarse como un sitio web estático y utiliza las capacidades disponibles en el navegador para ofrecer sus funciones principales, sin necesitar un servidor propio de síntesis de voz en la configuración actual.

## ✨ Características principales

### 🔊 Texto a voz (Text-to-Speech)

- Convierte texto escrito en voz utilizando Web Speech API.
- Permite seleccionar entre las voces disponibles en el dispositivo.
- Ofrece controles de volumen y velocidad.
- Detecta las voces disponibles cuando el navegador las comunica.
- Conserva los ajustes asociados a los textos del historial.
- Permite volver a sintetizar textos guardados.

### 🎙️ Reconocimiento de voz

- Permite utilizar las capacidades de reconocimiento de voz de los navegadores compatibles.
- Facilita la transcripción de voz a texto.
- Requiere permisos de micrófono cuando corresponda.
- La disponibilidad y el procesamiento dependen del navegador y de su proveedor.

### 🌍 Traducción

- Integra una herramienta de traducción sujeta a la compatibilidad del navegador.
- Permite copiar y escuchar el texto en los idiomas correspondientes.
- La disponibilidad puede depender de los modelos y las funciones implementados en el entorno del usuario.

### 🗂️ Historial local

- Guarda textos y ajustes en IndexedDB.
- Conserva el historial entre sesiones y recargas del navegador.
- Permite volver a reproducir textos guardados.
- Ofrece exportación JSON de textos y configuraciones.

**Nota:** el historial de Web Speech no equivale a una biblioteca de archivos de audio grabados. La síntesis actual no genera directamente archivos MP3 o WAV descargables.

### 🌐 Interfaz multilingüe

- Interfaz disponible en 10 idiomas.
- Selección del idioma inicial según las preferencias guardadas o los idiomas configurados en el navegador.
- Uso de inglés como alternativa cuando no se encuentra una preferencia compatible.

### 🎬 Introducción audiovisual

- Logotipo propio.
- Vídeos originales para distintos tamaños de pantalla.
- Opción para omitir la introducción.
- Compatibilidad con la preferencia de movimiento reducido.
- Alternativa de reproducción manual cuando la reproducción automática no está disponible.

---

## 🛠️ Tecnologías

El proyecto utiliza las siguientes tecnologías y herramientas:

- **JavaScript** — lógica de la aplicación.
- **Vite** — desarrollo y compilación.
- **Web Speech API** — síntesis y reconocimiento de voz, según la compatibilidad del navegador.
- **IndexedDB** — almacenamiento local del historial.
- **HTML y CSS** — estructura y presentación de la interfaz.
- **Playwright y Chromium** — pruebas automatizadas de navegador.
- **Vercel** — alojamiento y despliegue.

Las banderas locales proceden del proyecto [Circle Flags](https://github.com/HatScripts/circle-flags), distribuido bajo licencia MIT, cuya licencia se conserva en `public/flags/LICENSE.md`.

---

## 🚀 Instalación y ejecución

### Requisitos

- Node.js 22.12 o superior.
- npm.

### 1. Clonar el repositorio

```bash
git clone https://github.com/MateoRiosdev/Auvioz-app.git
cd Auvioz-app
```

### 2. Instalar las dependencias

```bash
npm ci
```

### 3. Iniciar el entorno de desarrollo

```bash
npm run dev
```

Vite mostrará la dirección local donde podrás abrir la aplicación.

### 4. Generar la versión de producción

```bash
npm run build
```

Los archivos compilados se generan en el directorio `dist/`.

### 5. Previsualizar la versión compilada

```bash
npm run preview
```

---

## 🧪 Pruebas y comprobaciones

El proyecto incluye comandos para comprobar la calidad del código y el funcionamiento de la aplicación.

### Comprobaciones generales

```bash
npm run lint
npm run build
npm test
```

### Pruebas de funciones del navegador

Para comprobar las funciones de voz y la interfaz mediante el adaptador de pruebas:

```bash
npm run preview -- --port 5174
```

En otra terminal:

```bash
python tests/browser_speech.py
```

Estas pruebas requieren Playwright y Chromium.

### Pruebas de la introducción audiovisual

Con la aplicación disponible en el puerto 5174:

```bash
AUVIOZ_TEST_URL=http://127.0.0.1:5174 python tests/intro_browser.py
```

### Pruebas del antiguo backend de audio

```bash
npm run test:audio
```

Estas pruebas están separadas del flujo actual y requieren eSpeak y FFmpeg.

**Importante:** las pruebas automatizadas con adaptadores controlados no garantizan que todas las funciones estén disponibles en todos los navegadores o dispositivos reales.

---

## 🔈 Compatibilidad y limitaciones

Auvioz utiliza capacidades del navegador que pueden variar según el sistema operativo, el dispositivo y el proveedor.

- **Voces:** dependen de las voces instaladas y disponibles en el navegador.
- **Síntesis de voz:** utiliza Web Speech API en la configuración actual.
- **Reconocimiento de voz:** requiere compatibilidad y puede utilizar servicios externos del proveedor.
- **Reconocimiento de archivos de audio:** la función experimental `start(audioTrack)` depende de versiones compatibles de Chromium.
- **Traducción:** depende de la compatibilidad con la API y de la disponibilidad de los modelos necesarios.
- **Duración de la reproducción:** la línea de tiempo es aproximada, ya que Web Speech no proporciona la duración real de un archivo de audio.
- **Búsqueda temporal:** los saltos de 10 segundos se calculan de manera aproximada a partir del texto y la velocidad. Al buscar, la frase actual se cancela y la reproducción se reinicia desde un fragmento estimado.
- **Archivos descargables:** la síntesis actual no genera directamente archivos MP3 o WAV. Los audios antiguos almacenados que ya dispongan de archivos pueden seguir reproduciéndose y descargándose.

---

## ☁️ Despliegue en Vercel

La aplicación está preparada para desplegarse como un sitio estático mediante Vercel.

Configuración:

| Opción | Valor |
|---|---|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Production Branch | `final` |

La aplicación publicada está disponible en:

**https://auvioz-app-eta.vercel.app/**

### Identificación de versiones

Cada compilación genera `version.json` con el SHA de Git disponible durante el proceso de construcción, utilizando `VERCEL_GIT_COMMIT_SHA` en Vercel.

Para comprobar qué versión se encuentra publicada, revisa el commit asociado al despliegue y la sección **Source** de Vercel.

El identificador del despliegue y el SHA del commit son valores diferentes. Volver a desplegar una versión anterior no incorpora automáticamente los cambios de un commit posterior.

---

## 🤝 Contribuciones

Las sugerencias, los informes de errores y las propuestas de mejora pueden ayudar a que Auvioz siga evolucionando.

Antes de proponer cambios importantes, comprueba las funciones existentes y sus limitaciones para evitar duplicar implementaciones.

---

## 📄 Licencia

Consulta el archivo `LICENSE` del repositorio para conocer las condiciones de uso, modificación y distribución del proyecto.

Los recursos de terceros mantienen sus respectivas licencias.

---

## English

<a id="english"></a>

# Auvioz — Speak, Transcribe and Translate

Auvioz is a free, multilingual web application that brings together text-to-speech, speech recognition and translation tools in a single interface.

### Features

- **Text-to-Speech:** read written text aloud using voices available through the browser.
- **Voice controls:** select available voices and adjust volume and speaking speed.
- **Speech recognition:** transcribe speech in supported browsers.
- **Translation:** translate text where the browser and required models support the feature.
- **Local history:** store text and settings in IndexedDB.
- **JSON export:** export text and configuration data.
- **Multilingual interface:** interface available in 10 languages.
- **Custom introduction:** original logo and introductory videos.
- **Static deployment:** build and deploy the application using Vite and Vercel.

### Technology stack

JavaScript, Vite, Web Speech API, IndexedDB, HTML, CSS, Playwright and Vercel.

### Getting started

Requirements: Node.js 22.12+ and npm.

```bash
git clone https://github.com/MateoRiosdev/Auvioz-app.git
cd Auvioz-app
npm ci
npm run dev
```

Build the production version:

```bash
npm run build
```

The compiled application is generated in `dist/`.

### Compatibility notes

Voice availability depends on the browser and operating system. Speech recognition and translation require browser support and may depend on external services or downloadable models.

The current Web Speech synthesis implementation does not directly generate downloadable MP3 or WAV files. Playback timelines are approximate because the API does not expose the duration of a recorded audio file.

### Live application

**https://auvioz-app-eta.vercel.app/**

### Deployment

Use Vite as the framework preset, `npm run build` as the build command, `dist` as the output directory and `final` as the production branch.

### License

See the repository's `LICENSE` file for the project's licensing terms. Third-party resources retain their respective licenses.

---

<div align="center">

**Auvioz — Habla, transcribe y traduce.**

[Probar aplicación](https://auvioz-app-eta.vercel.app/) · [Ver repositorio](https://github.com/MateoRiosdev/Auvioz-app)

</div>
