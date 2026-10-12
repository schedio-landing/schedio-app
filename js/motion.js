/**
 * Schedio — landing. Movimiento que no necesita saber nada del resto de la
 * página: titulares por líneas, cifra del hero y parallax de la cascada.
 *
 * Lo que sí depende de otras piezas (la demo del simulador, la escalera de
 * rangos, los pasos) vive en main.js, pegado a lo que mueve.
 *
 * Sin JS, o con prefers-reduced-motion, no hace nada y la página queda tal
 * cual está en el HTML. `html.mo` (puesta en el <head>) es el interruptor.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  if (!root.classList.contains('mo')) return;

  /* ───────────────────────────────── Titulares por líneas
     Cada <br /> de un titular parte una línea; cada línea queda envuelta en una
     máscara y su texto sube al revelarse. Se parte en el cliente para que el
     HTML se mantenga como texto normal con <br />. El hero ya viene partido de
     fábrica porque se anima al cargar, antes de que este script pudiera
     actuar. */

  document.querySelectorAll('h2.display').forEach(function (heading) {
    if (heading.querySelector('.ln')) return;
    var lines = heading.innerHTML.split(/<br\s*\/?>/i);
    heading.innerHTML = lines
      .map(function (html, i) {
        return '<span class="ln"><span style="--l: ' + i + '">' + html.trim() + '</span></span>';
      })
      .join('');
    heading.classList.add('has-lines');
  });

  /* ───────────────────────────────── Cifra del hero
     La media sube desde cero hasta su valor mientras el móvil se monta. El
     valor final es el que ya está escrito en el HTML ("8,0"). */

  var metricValues = document.querySelectorAll('.phone--tilt .metric__value');
  var average = metricValues[metricValues.length - 1];

  if (average) {
    var target = parseFloat(average.textContent.replace(',', '.'));
    var finalText = average.textContent;

    if (!isNaN(target)) {
      average.textContent = '0,0';

      window.setTimeout(function () {
        var DURATION = 1300;
        var start = null;

        var frame = function (stamp) {
          if (start === null) start = stamp;
          var t = Math.min(1, (stamp - start) / DURATION);
          var eased = 1 - Math.pow(1 - t, 3);
          average.textContent = (target * eased).toFixed(1).replace('.', ',');
          if (t < 1) window.requestAnimationFrame(frame);
        };
        window.requestAnimationFrame(frame);

        // rAF se congela en pestañas ocultas: el valor tiene que acabar bien.
        window.setTimeout(function () {
          average.textContent = finalText;
        }, DURATION + 200);
      }, 1900);
    }
  }

  /* ───────────────────────────────── Parallax de la cascada
     Solo donde las capturas forman la diagonal (escritorio). Escribe una sola
     variable CSS por fotograma; el desplazamiento de cada captura sale de ahí
     (motion.css). */

  var cascade = document.querySelector('.cascade');
  var wide = window.matchMedia('(min-width: 860px)');

  if (cascade && 'IntersectionObserver' in window) {
    var ticking = false;
    var active = false;

    var update = function () {
      ticking = false;
      var box = cascade.getBoundingClientRect();
      // -1 con la cascada entrando por abajo, 0 centrada, 1 saliendo por arriba.
      var p = (window.innerHeight * 0.5 - (box.top + box.height * 0.5)) / window.innerHeight;
      p = Math.max(-1, Math.min(1, p));
      cascade.style.setProperty('--par', (p * 34).toFixed(1) + 'px');
    };

    var onScroll = function () {
      if (ticking || !active || !wide.matches) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    new IntersectionObserver(
      function (entries) {
        active = entries[0].isIntersecting;
        if (active) onScroll();
      },
      { rootMargin: '10% 0px' }
    ).observe(cascade);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
  }

  /* ───────────────────────────────── FAQ con altura suave
     <details> abre y cierra de golpe. Aquí se intercepta el clic y se anima la
     altura con la API de animaciones, que funciona en todos los navegadores
     (la alternativa solo CSS, `::details-content`, aún no). El teclado sigue
     igual: Intro/Espacio sobre <summary> dispara el mismo clic. */

  var EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

  document.querySelectorAll('.faq details').forEach(function (details) {
    var summary = details.querySelector('summary');
    if (!summary || !details.animate) return;
    var running = null;

    var run = function (from, to, onDone) {
      if (running) running.cancel();
      details.style.boxSizing = 'border-box';
      details.style.overflow = 'hidden';
      running = details.animate(
        { height: [from + 'px', to + 'px'] },
        { duration: 320, easing: EASE }
      );
      running.onfinish = running.oncancel = function () {
        running = null;
        details.style.boxSizing = '';
        details.style.overflow = '';
        if (onDone) onDone();
      };
    };

    summary.addEventListener('click', function (event) {
      event.preventDefault();
      var from = details.getBoundingClientRect().height;

      if (details.open) {
        var closed = summary.getBoundingClientRect().height + 1; // + borde inferior
        run(from, closed, function () {
          details.open = false;
        });
      } else {
        details.open = true;
        var full = details.getBoundingClientRect().height;
        run(from, full);
      }
    });
  });
})();
