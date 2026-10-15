# Irene Sánchez — una sola página HTML

Esta versión utiliza **un único `index.html`** para todo el portfolio. Conserva la estructura de tres archivos de código del ZIP de referencia:

- `index.html`: portada, tarjetas, textos y galerías completas de los cuatro proyectos, sobre mí, CV, contacto y traducciones.
- `style.css`: diseño, responsive y animaciones.
- `script.js`: selector ES/EN, ventanas de proyectos, copiar email y apariciones al hacer scroll.
- `assets/`: imágenes y fuentes locales. Es necesaria para que la web funcione sin Framer ni servicios de fuentes externos.

## Abrir

Abre `index.html` con Chrome, Safari, Firefox o Edge. No hace falta instalar nada. Mantén los tres archivos y la carpeta `assets` juntos. El botón de copiar email puede requerir HTTPS; si no está disponible, puedes seleccionar el email o pulsarlo para abrir tu aplicación de correo.

## Editar textos y proyectos

Todo está en `index.html`, dividido por comentarios numerados. El texto español está dentro de las etiquetas y el inglés en `data-en`. Ejemplo:

```html
<h2 data-en="About me">Sobre mí</h2>
```

El CV utiliza dos bloques HTML por apartado, identificados con `data-language="es"` y `data-language="en"`. Edita ambos. Las fichas completas están en los artículos `project-nogue`, `project-greeno`, `project-starbucks` y `project-polydor`. Los proyectos no se generan desde JavaScript.

Las tarjetas abren los artículos en una ventana a pantalla completa. Se puede cerrar con × o Escape. El navegador mantiene el proyecto en la URL mediante su ancla; el botón Atrás también permite salir. Si JavaScript está deshabilitado o el navegador no admite ventanas dialog, las fichas permanecen disponibles dentro de la página.

El selector conserva el idioma cuando el navegador permite almacenamiento local. `?lang=en` selecciona inglés y `?lang=es` español. El cambio mantiene el proyecto abierto.

## Contenidos verificados

Se conservan los cuatro proyectos y las galerías recuperadas de la web de Framer. El CV sigue los datos de su web actual y del documento original: cuarto curso, UDIT 2023–2027, Interbrand, Borneo, inglés C1 y francés A2. Se ha corregido el B2 que figuraba en el ZIP de ejemplo. No se han añadido fechas de proyecto sin confirmar.

El estilo parte del ZIP de referencia: fondo crema, negro, nombre grande, composición editorial y proyectos en ventanas superpuestas. Usa Inter local para evitar descargar tipografías de terceros. Las imágenes se sirven localmente y NOGUE conserva su animación. Con movimiento reducido se desactivan las animaciones y se usa la imagen fija.

## Publicación y SEO

Publica el contenido de esta carpeta completo. Cambia el dominio `https://irenesansa.github.io/Portfolio` por tu dominio definitivo en `index.html`, `robots.txt` y `sitemap.xml` antes de alojarlo en otra dirección. Para servir desde una subcarpeta, incluye también esa ruta en las URLs absolutas.

El HTML contiene títulos semánticos, descripción, datos estructurados, textos alternativos e información para compartir en redes. El sitemap apunta a una única página. El contenido original en español está en el HTML y puede leerse sin JavaScript. El inglés es un cambio interactivo dentro de la misma página: no se presenta como una segunda página estática independiente para SEO. No se incluyen etiquetas hreflang que prometan páginas inexistentes.

La copia alojada para revisión es privada y no se indexará públicamente mientras siga siendo privada. El posicionamiento no está garantizado.

## Comprobaciones

Comprobados la sintaxis de JavaScript, los enlaces internos, los identificadores únicos, la presencia de los cuatro proyectos, los recursos locales y las traducciones de la interfaz. Queda pendiente una prueba visual e interactiva en navegador, no disponible en este entorno.
