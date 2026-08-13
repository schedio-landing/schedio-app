# Landing oficial de Schedio

Sitio estático, sin framework y sin build. Se publica en GitHub Pages sobre
`schedio.es`. El plan completo, el copy aprobado y la parte de Play Store están
en `Schedio/Documentos/landing-plan-y-copy.md`.

## Cómo verlo en local

```bash
python -m http.server 4173 --directory schedio-landing
```

## Estructura

```
index.html          La página entera
css/tokens.css      Tokens portados 1:1 desde schedio-mobile/theme/tokens.js
css/styles.css      Todo lo demás
js/priority.js      Puerto de schedio-mobile/services/priority.js
js/main.js          Nav, revelado, móvil pegajoso y simulador
assets/             Mark, wordmark y capturas de Play Store a 720px
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
- [ ] **`/privacidad`, `/terminos` y `/borrar-datos`**, generadas desde
      `schedio-mobile/legal/*.md`. Más `privacidad.html` y `terminos.html` que
      redirijan, para no romper el legal de los APK de beta ya repartidos.
- [x] ~~Imagen OG.~~ `assets/og.png`, 1200×630, 43 KB. Generada con
      System.Drawing a partir de los tokens y las TTF reales de Bebas e Inter,
      no de una interpretación. Declarada con `width`/`height`/`alt` en las
      cinco páginas.
- [ ] **`CNAME`** con `schedio.es` y el DNS del registrador.

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
- [ ] **Regenerar la captura de Rangos.** La que había mostraba cinco rangos por
      XP y sin "Estudiante"; la app tiene seis por nivel. Está fuera de la
      cascada hasta entonces — y la misma captura desfasada sigue en la ficha
      de Play Store.

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
