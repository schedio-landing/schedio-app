# Landing oficial de Schedio

Sitio estático, sin framework y sin build. Se publica en GitHub Pages sobre
`schedio.es`. El plan completo, el copy aprobado y la parte de Play Store están
en `Schedio/Documentos/landing-plan-y-copy.md`.

## Cómo verlo en local

```bash
python serve.py
```

Servidor propio (`serve.py`), no `http.server` a secas: manda
`Cache-Control: no-store` en todo. El `index.html` no puede llevar `?v=` en su
propia URL, así que sin esto el navegador te sigue sirviendo la versión
anterior después de cada cambio — costó tiempo real de depuración antes de
cambiarlo.

## Estructura

```
index.html               Home en español
iphone/index.html        Guía de instalación PWA — huérfana hasta agosto,
                          ahora enlazada desde la FAQ y el aviso "no Android"
en/index.html            Home en inglés
en/iphone/index.html     Guía de iPhone en inglés
privacidad/, terminos/, eliminar-cuenta/, feedback/
                          index.html cada una — patrón carpeta+index para
                          URLs limpias en GitHub Pages
css/tokens.css            Tokens portados 1:1 desde schedio-mobile/theme/tokens.js
css/styles.css            Todo lo demás
js/priority.js            Puerto de schedio-mobile/services/priority.js
js/main.js                Nav, revelado, móvil pegajoso, rangos y simulador —
                          bilingüe vía `document.documentElement.lang`
js/beta-form.js           El formulario de lista de espera — también bilingüe
js/config.js              Claves públicas de Firebase para el formulario
assets/                   Mark, capturas de Play Store, fuentes, OG
```

## Las tres reglas que no se rompen

1. **Ni un píxel de interfaz que no exista en la app.** Nada de mockups de
   escritorio ni pantallas idealizadas: o es captura real, o es réplica fiel
   construida con los tokens. Fue el error de las landings anteriores.
2. **Lenguaje plano.** Bordes de 1px, nunca sombras ni degradados. El acento
   `#2979FF` solo en CTA, estado activo y el elemento que resuelve.
3. **Nada que no sea cierto.** Los rangos son los seis reales de
   `services/gamification.js` y van por nivel, no por horas. El simulador corre
   el algoritmo de verdad, no una maqueta.

## Bilingüe (ES/EN)

Un árbol de páginas aparte en `en/`, no un interruptor con JavaScript. Cada
página enlaza a su pareja del otro idioma vía `.lang-switch` en el nav, con
`hreflang` recíproco en el `<head>` de las dos y en `sitemap.xml`. Español es
el idioma por defecto (`x-default`).

**La regla 1 de arriba se aplica también entre idiomas, y es la que más
cuesta recordar:** cualquier cosa que reproduzca la interfaz real de la app
—el teléfono del hero, las escenas de "Cómo funciona", los nombres y
descripciones de los rangos (dato real de `gamification.js`)— se queda en
**español en las dos versiones del sitio**. La app en sí es solo en español
hoy; traducir esos fragmentos mostraría una interfaz que no existe. Ya pasó
una vez con las escenas de `STEP_SCREENS` en `main.js` — se tradujeron y hubo
que revertirlo.

Lo que sí traduce: todo el copy de marketing, la FAQ, el formulario, y el
**simulador** (es un widget propio construido para la web, no una captura de
la app, así que sus etiquetas — "Urgencia"/"Urgency", los nombres de examen de
ejemplo — cambian de idioma libremente). El chrome que yo mismo añadí sobre
datos reales (la etiqueta "Nivel"/"Level", "Siguiente:"/"Next:") también
traduce; el dato que envuelve (el nombre del rango) no.

`main.js` y `beta-form.js` no están duplicados: leen
`document.documentElement.lang` una vez al principio y usan un diccionario
`T`/`isEN` para el puñado de cadenas que generan por JS. `priority.js` no
necesita nada — no tiene ni una palabra de texto.

**Las tres legales ya están traducidas** (`en/privacidad`, `en/terminos`,
`en/eliminar-cuenta`), con terminología real del GDPR en inglés (controller,
processor, legal basis...), no inventada. Cada una lleva una nota destacada
arriba: *"esta es una traducción informativa; la versión española es la
vinculante"* — es la práctica estándar para esto, y cubre que un matiz de
traducción se escape.

"Mochila" se queda sin traducir en las tres, a propósito: es el nombre real
de una función de la app, y la app en sí es solo en español — traducirlo a
"Backpack" haría que alguien buscara en la app algo que no existe con ese
nombre. Mismo principio que con los rangos.

**`/feedback` también está traducida.** Sus cuatro `mailto` (asunto y cuerpo)
se recalcularon con `encodeURIComponent`, no a mano — traducir uno a mano fue
justo el fallo que se encontró y corrigió en `eliminar-cuenta` (el asunto se
quedó en español pese a que el texto de al lado ya decía "Delete account" en
inglés). Verificado con `decodeURIComponent` en el navegador, no solo
leyendo el HTML.

El sitio bilingüe está completo: las ocho páginas (home, iphone, privacidad,
terminos, eliminar-cuenta, feedback × 2 idiomas) tienen su pareja, sin ningún
`(ES)` suelto.

## Dos ficheros que hay que mantener a mano

- `css/tokens.css` ← `schedio-mobile/theme/tokens.js`
- `js/priority.js` ← `schedio-mobile/services/priority.js`

**No se sincronizan solos.** Si se tocan los pesos del algoritmo o los colores en
la app, hay que replicarlo aquí. El puerto se pudo hacer tal cual porque el
original se escribió puro a propósito: sin firebase y sin `Date.now()` salvo que
se le pase.

## Pendiente

### Bloqueante antes de publicar

- [x] ~~Fuentes.~~ Hechas. `inter-var.woff2` (47,1 KB, **variable**: un solo
      fichero cubre 400-700) y `bebas-neue-400.woff2` (13,4 KB). Subconjunto
      latino de Google Fonts, ambas OFL, con `<link rel="preload">`.
      Nota: el subconjunto latino de Inter **no incluye U+2192 (→)**, así que las
      flechas de los botones las pinta una fuente de respaldo.
- [x] ~~El cuestionario.~~ Cuatro pasos, una pregunta cada vez, con barra de
      progreso, validación por paso, trampa antispam y consentimiento sin
      premarcar. Escribe por la **API REST de Firestore**, no con el SDK: unas
      líneas de `fetch` en vez de ~100 KB de librería, y las reglas se aplican
      igual.

      **Faltan dos cosas para que funcione de verdad:**

      1. Rellenar `js/config.js` con `apiKey` y `projectId`, copiados de
         `schedio-mobile/.env.local`. No son secretos: identifican el proyecto,
         no dan acceso. Mientras estén vacíos, el formulario cae a un `mailto`
         con los datos ya escritos en vez de fallar en silencio.

      2. Añadir esto a `schedio-mobile/firestore.rules` y desplegarlo. Solo
         permite crear, con los campos y tamaños acotados; nadie puede leer la
         lista de altas desde el cliente:

      ```
      match /betaSignups/{docId} {
        allow create: if request.resource.data.keys().hasOnly(
                           ['email','curso','android','dolor','creado'])
          && request.resource.data.email is string
          && request.resource.data.email.size() > 5
          && request.resource.data.email.size() < 200
          && request.resource.data.email.matches('^[^@]+@[^@]+[.][^@]+$')
          && request.resource.data.curso in ['ESO','Bachillerato','Universidad','Otro']
          && request.resource.data.android is bool
          && request.resource.data.dolor is string
          && request.resource.data.dolor.size() < 1000;
        allow read, update, delete: if false;
      }
      ```

      **Ojo antes de desplegar:** las reglas del repo y las que están vivas en
      producción llevan tiempo desincronizadas, así que `firebase deploy
      --only firestore:rules` no es inocente — repasa el diff completo, no solo
      este bloque.
- [x] ~~`/privacidad`, `/terminos` y `/eliminar-cuenta`.~~ Hechas — no
      generadas automáticamente desde `schedio-mobile/legal/*.md` como se
      planteó aquí en un principio, se escribieron a mano a partir de ese
      contenido. Ya divergen del `.md` (privacidad.html tiene el apartado del
      formulario de la web, que el `.md` no tiene) — es una decisión asumida,
      no un descuido: ver la nota en `constants/legal.js` de la app.
- [x] ~~Imagen OG.~~ `assets/og.png`, 1200×630, 43 KB. Generada con
      System.Drawing a partir de los tokens y las TTF reales de Bebas e Inter,
      no de una interpretación. Declarada con `width`/`height`/`alt` en las
      cinco páginas.
- [x] ~~`CNAME` y DNS.~~ En vivo en `schedio.es`, detrás de Cloudflare →
      GitHub Pages, publicado desde `schedio-landing/schedio-app` (repo
      distinto de este directorio local — el despliegue se hace vía PR desde
      un fork de `hugo-divi`, ver el historial de la conversación para el
      porqué).
- [x] ~~Modo lanzamiento (Schedio ya sale).~~ Hecho el 5 sept 2026, siguiendo
      el borrador de `preview-lanzamiento.html` (ya borrado, su contenido es
      ahora el real):
      - [x] FAQ actualizada ("¿Cuándo sale?" y "¿iPhone?" en modo presente, ES+EN).
      - [x] Hero (Inicio) reconstruido para reflejar la app real de hoy: racha
        0, nivel 4 con barra de XP, media con coma decimal, calendario de
        septiembre con puntos de color por asignatura, y la barra de
        navegación inferior (antes no estaba). Se quitó la sección "Por
        calificar": la captura nueva no llegaba a mostrarla y no hay
        confirmación de que siga ahí — si sigue existiendo, avisar para
        reponerla con datos reales.
      - [x] Nav + hero CTA en las 12 páginas (ES+EN): de "Lista de espera" al
        enlace real de Play Store
        (`play.google.com/store/apps/details?id=com.schedio.mobile`),
        `target="_blank"`.
      - [x] Cierre: fuera el formulario de 4 preguntas y `js/beta-form.js`
        (ya no se carga en ninguna página). Entra el badge + "¿Tienes
        iPhone? Instálala como app web" → `/iphone`.
      - [x] `/iphone` y `/en/iphone`: reescrito el párrafo de cierre sin
        mención a la lista de espera.
      - [x] Copy de "Por qué existe": ya no menciona que Hugo acaba de
        terminar Bachillerato ni el grado que empieza — sustituido por algo
        más genérico y duradero, ES+EN.
      - [x] ~~Badge provisional de texto.~~ Sustituido por el PNG oficial de
        Google (`assets/google-play-badge-es.png`), copiado el 5 sept 2026
        desde `Schedio/GetItOnGooglePlay_Badge_Web_color_Spanish.png`.
      - [x] ~~Badge en inglés.~~ `assets/google-play-badge-en.png`, recortado
        de un PNG de 5000×5000 vía detección de bordes (bounding box del
        contenido contra el fondo blanco, no a ojo). `en/index.html` ya no
        reutiliza el español.
      - [x] ~~Limpieza tras quitar el formulario de 4 preguntas.~~ Borrado
        `js/beta-form.js` (ya no lo cargaba ninguna página) y ~230 líneas de
        CSS huérfano: todo el bloque `.quiz*`, `.nav__download`,
        `.nav__iphone-link`, `.closer__iphone-link` y el símbolo SVG
        `i-bar-chart` (las métricas del hero usan emoji de verdad ahora, no
        SVG — ver más abajo).
      - [x] ~~Cabecera y emojis del móvil del hero, a partir de una captura
        real que pasó Hugo.~~ La pastilla blanca con el logo se quitó — ahora
        es solo el icono (con `filter: brightness(0) invert(1)`, porque
        `mark-96.png` es un trazo negro sobre transparente y así se pinta de
        blanco sin necesitar un segundo asset) + "Schedio" en blanco, sin
        fondo. Los iconos de RACHA/NIVEL/MEDIA dejaron de ser SVG a medida
        (`i-flame`/`i-zap`/`i-bar-chart`) y ahora son los emoji reales
        (🔥⚡📊), que es lo que se ve en la app.
      - [ ] El enlace de instalación de `/iphone` (paso 1, "abre schedio.es
        en Safari") va a cambiar por uno "más formal" — pendiente de que
        Hugo lo pase.

### Mejoras, no bloquean

- [x] ~~Favicon propio.~~ Squircle blanco con el mark, en 32/180/512 px.
- [x] ~~Flecha `→` como SVG.~~ Clase `.has-arrow`, máscara CSS con la flecha en
      un data URI. Hereda `currentColor` y escala con el tamaño de letra. Ya no
      queda ni un carácter `→` en la página: el subconjunto latino de Inter no
      trae U+2192 y lo pintaba una tipografía de respaldo distinta en cada
      sistema.
- [x] ~~Indicador de arrastre de la cascada.~~ Rail con recorrido proporcional,
      visible solo si la tira desborda de verdad; la etiqueta desaparece tras el
      primer arrastre.
- [x] ~~Capturas a WebP.~~ **267 KB → 60 KB (−77%)** con `cwebp -q 82 -m 6`,
      servidas por `<picture>` con el PNG de respaldo. Y `mark.png` pasó de
      58 KB a 4,3 KB (`mark-96.png`): pesaba como si fuera a mostrarse a 500px
      cuando se ve a 30. Ahí el problema no era el formato, era el tamaño.

      Para regenerar (libwebp instalado con `winget install Google.Libwebp`):

      ```
      cwebp -q 82 -m 6 assets/screens/NOMBRE.png -o assets/screens/NOMBRE.webp
      ```

      `og.png` y los iconos **se quedan en PNG a propósito**: los rastreadores
      de Open Graph y los formatos de icono no tratan WebP de forma fiable.
- [ ] Logo reveal de entrada — falta el canvas original del proyecto de Claude
      Design.
- [x] ~~Regenerar la captura de Rangos.~~ La captura real del Perfil (rango
      Novato, nivel 4, insignias, Mis Materias) pasó a ocupar el hueco de
      "Estadísticas" en la cascada — no hay ya una figura de "Rango" separada.
      La misma captura desfasada sigue en la ficha de Play Store — pendiente
      ahí.
- [x] ~~Cascada sin cohesión de tamaño.~~ Dos pasadas: primero se reescalaron
      Plan, Estudiar, Mochila y Estadísticas al mismo ancho (460 px — antes
      había tres anchos nativos distintos). Después, a petición expresa de
      Hugo ("bien alineado aunque haya que recortarlo, siempre con cabeza"),
      Plan y Estadísticas se recortaron además en altura hasta su corte
      natural más cercano — Plan justo después de "+ Añadir tarea suelta"
      (1165 px, fuera queda "Esta semana"), Estadísticas justo después de la
      primera fila de Mis Materias (1220 px, fuera quedan las otras tres
      filas). El resultado: 630–1220 px de alto en vez de 630–1984. Mochila
      se queda en 630 porque ya no tiene más contenido real que enseñar —
      estirarla sería el mismo hueco vacío que se arregló antes.
- [x] ~~El icono de Schedio no se veía en la maqueta final de `/iphone`
      ("Y ya está — así queda").~~ No era que faltara el icono: la fila de
      `.homescreen` desbordaba el marco del móvil y la casilla con el icono
      quedaba cortada por el `overflow: hidden` del contenedor, dejando solo
      las tres primeras (grises) a la vista. `repeat(4, 1fr)` no evita que un
      `<img>` con tamaño intrínseco fuerce su columna más allá de su reparto
      — hace falta `repeat(4, minmax(0, 1fr))` para que el mínimo automático
      de cada columna sea 0 de verdad. Se reprodujo aislando el componente en
      una página suelta antes de tocar el CSS, porque una lectura del DOM
      decía que todo estaba bien (imagen cargada, estilos correctos) y solo
      viéndolo renderizado se notaba el corte.

## Verificado

- Sin desbordamiento horizontal a 262px ni a 2545px de viewport.
- Simulador: reordena en vivo y los números salen del algoritmo real.
- Escritorio: hero a dos columnas, móvil pegajoso en "Cómo funciona".
- Consola limpia salvo los 404 de las fuentes que faltan.

**No verificado:** el revelado al hacer scroll y las animaciones de
`animation-timeline`. `IntersectionObserver` no dispara en el panel de vista
previa porque sin composición no corre el ciclo de render — se comprobó que un
observer trivial también da cero. Hay que mirarlo en un navegador de verdad.
El fallo está cubierto: si el observer no dispara en 2,5s, `main.js` quita la
clase `js` del `<html>` y todo el contenido vuelve a ser visible.
