/**
 * Schedio — landing. Todo el JS de la página.
 *
 * Nada aquí es imprescindible para leer la web: sin JS el contenido sigue
 * completo y el simulador cae a un ejemplo estático escrito en el HTML.
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Marca de "hay JS". Sin ella el CSS no oculta nada: el contenido es legible
     aunque este script no llegue a ejecutarse nunca. */
  if (!reduceMotion) document.documentElement.classList.add('js');

  /* Red de seguridad: si a los 2,5s el observer no ha revelado NADA, se asume
     roto y se desactiva el sistema entero quitando la clase `js`. Todo vuelve a
     ser visible. No revela elemento a elemento, porque los de más abajo tienen
     que seguir esperando su scroll. */
  var revealFired = false;
  window.setTimeout(function () {
    if (!revealFired) document.documentElement.classList.remove('js');
  }, 2500);

  /* ───────────────────────────────── Nav */

  var nav = document.getElementById('nav');
  if (nav) {
    var onScroll = function () {
      nav.dataset.scrolled = window.scrollY > 8 ? 'true' : 'false';
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ───────────────────────────────── Revelado al entrar en viewport */

  var revealables = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduceMotion) {
    revealables.forEach(function (el) {
      el.classList.add('is-in');
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          revealFired = true;
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.15 }
    );
    revealables.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ───────────────────────────────── Inclinado del móvil del hero
     En escritorio sigue al cursor. En táctil NO sigue al dedo: el dedo está
     haciendo scroll y capturarlo pelearía con el gesto, así que se inclina
     según su posición en la pantalla mientras la página se desplaza. */

  var heroPhone = document.getElementById('heroPhone');
  var stage = heroPhone && heroPhone.closest('.hero__stage');

  if (heroPhone && stage && !reduceMotion) {
    var MAX_Y = 7; // grados al girar sobre el eje vertical
    var MAX_X = 5;
    var pending = false;
    var nextRx = 0;
    var nextRy = 0;

    function apply() {
      pending = false;
      heroPhone.style.setProperty('--rx', nextRx.toFixed(2) + 'deg');
      heroPhone.style.setProperty('--ry', nextRy.toFixed(2) + 'deg');
    }

    function schedule(rx, ry) {
      nextRx = rx;
      nextRy = ry;
      if (pending) return;
      pending = true;
      window.requestAnimationFrame(apply);
    }

    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (finePointer) {
      stage.addEventListener('pointermove', function (event) {
        var box = heroPhone.getBoundingClientRect();
        // -1..1 respecto al centro del móvil.
        var px = (event.clientX - (box.left + box.width * 0.5)) / (box.width * 0.5);
        var py = (event.clientY - (box.top + box.height * 0.5)) / (box.height * 0.5);
        px = Math.max(-1, Math.min(1, px));
        py = Math.max(-1, Math.min(1, py));
        heroPhone.classList.add('is-tracking');
        schedule(-py * MAX_X, px * MAX_Y);
      });

      stage.addEventListener('pointerleave', function () {
        heroPhone.classList.remove('is-tracking');
        schedule(0, 0);
      });
    } else {
      // Táctil: la inclinación la marca el scroll, no el dedo.
      var onTiltScroll = function () {
        var box = heroPhone.getBoundingClientRect();
        var centre = box.top + box.height * 0.5;
        var offset = (centre - window.innerHeight * 0.5) / (window.innerHeight * 0.5);
        offset = Math.max(-1, Math.min(1, offset));
        schedule(offset * MAX_X, offset * MAX_Y * 0.4);
      };
      onTiltScroll();
      window.addEventListener('scroll', onTiltScroll, { passive: true });
    }
  }

  /* ───────────────────────────────── Rangos interactivos
     Datos reales de services/gamification.js. Sin JS la lista se lee igual y
     el panel se queda con el primer rango, que ya viene puesto en el HTML. */

  var rankButtons = document.querySelectorAll('.rank');
  var rankDetail = document.getElementById('rankDetail');

  if (rankButtons.length && rankDetail) {
    var detailIcon = rankDetail.querySelector('use');
    var detailName = rankDetail.querySelector('.rank-detail__name');
    var detailLevel = rankDetail.querySelector('.rank-detail__level strong');
    var detailDesc = rankDetail.querySelector('.rank-detail__desc');
    var detailNext = rankDetail.querySelector('.rank-detail__next');

    var selectRank = function (button) {
      if (button.classList.contains('is-active')) return;

      rankButtons.forEach(function (b) {
        b.classList.toggle('is-active', b === button);
      });

      rankDetail.classList.add('is-swapping');
      window.setTimeout(
        function () {
          detailIcon.setAttribute('href', '#' + button.dataset.icon);
          detailName.textContent = button.dataset.name;
          detailLevel.textContent = button.dataset.level;
          detailDesc.textContent = button.dataset.desc;

          // El panel hereda el color del rango seleccionado.
          ['--rank-color', '--rank-soft', '--rank-line'].forEach(function (prop) {
            rankDetail.style.setProperty(prop, button.style.getPropertyValue(prop));
          });

          // Leyenda es el último: no hay siguiente que enseñar.
          var next = button.dataset.next;
          if (next) {
            detailNext.innerHTML = 'Siguiente: <strong></strong>';
            detailNext.querySelector('strong').textContent = next;
            detailNext.hidden = false;
          } else {
            detailNext.textContent = 'No hay nada por encima.';
            detailNext.hidden = false;
          }

          rankDetail.classList.remove('is-swapping');
        },
        reduceMotion ? 0 : 140
      );
    };

    rankButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        selectRank(button);
      });
      // Con el ratón encima basta: pedir un clic para ver la descripción
      // esconde el contenido detrás de una interacción de más.
      if (window.matchMedia('(hover: hover)').matches) {
        button.addEventListener('mouseenter', function () {
          selectRank(button);
        });
      }
    });
  }

  /* ───────────────────────────────── Móvil pegajoso de "Cómo funciona"
     Cambia de pantalla según el paso que estés leyendo. Solo en escritorio:
     en móvil cada paso lleva su propia escena bajo el texto. */

  var stepScreen = document.getElementById('stepScreen');
  var steps = document.querySelectorAll('.step');

  var STEP_SCREENS = [
    // 1 · Tus asignaturas
    '<p class="app-section-title">Tus asignaturas</p>' +
      subjectRow('Matemáticas', '--subject-mates') +
      subjectRow('Historia', '--subject-historia') +
      subjectRow('Química', '--subject-quimica') +
      subjectRow('Lengua', '--subject-lengua') +
      subjectRow('Inglés', '--subject-ingles'),

    // 2 · El plan de hoy, ya ordenado
    '<p class="app-section-title">Hoy</p>' +
      '<div class="app-card">' +
      '<span class="app-card__overline">PRÓXIMOS EXÁMENES</span>' +
      examRow('Historia', '27 jul · en 3 días', 'Prioridad alta', true) +
      examRow('Matemáticas', '30 jul · en 6 días', 'Normal', false) +
      examRow('Química', '4 ago · en 11 días', 'Normal', false) +
      '</div>',

    // 3 · La sesión
    '<p class="app-section-title">Sesión de estudio</p>' +
      '<div class="app-card"><div class="timer">' +
      '<span class="timer__value" style="font-size:52px">25:00</span>' +
      '<span class="timer__label">Historia · Tema 6</span>' +
      '</div><span class="app-btn has-arrow">Empezar</span></div>',
  ];

  function subjectRow(name, colorVar) {
    return (
      '<div class="app-card" style="padding:10px 12px">' +
      '<div class="app-row" style="padding:0">' +
      '<div class="app-row__name" style="display:flex;align-items:center;gap:8px">' +
      '<span class="dot" style="--subject: var(' +
      colorVar +
      ');width:8px;height:8px"></span>' +
      name +
      '</div></div></div>'
    );
  }

  function examRow(name, meta, chip, isAccent) {
    return (
      '<div class="app-row"><div>' +
      '<div class="app-row__name">' +
      name +
      '</div><div class="app-row__meta">' +
      meta +
      '</div></div><span class="chip' +
      (isAccent ? ' chip--accent' : '') +
      '">' +
      chip +
      '</span></div>'
    );
  }

  function setStepScreen(index) {
    if (!stepScreen) return;
    if (stepScreen.dataset.step === String(index)) return;
    stepScreen.dataset.step = String(index);
    stepScreen.style.opacity = '0';
    window.setTimeout(
      function () {
        stepScreen.innerHTML = STEP_SCREENS[index] || '';
        stepScreen.style.opacity = '1';
      },
      reduceMotion ? 0 : 140
    );
  }

  if (stepScreen) {
    stepScreen.style.transition = 'opacity 180ms cubic-bezier(0.2,0.8,0.2,1)';
    setStepScreen(0);

    if ('IntersectionObserver' in window) {
      var stepObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) setStepScreen(Number(entry.target.dataset.step));
          });
        },
        { rootMargin: '-45% 0px -45% 0px' }
      );
      steps.forEach(function (step) {
        stepObserver.observe(step);
      });
    }
  }

  /* ───────────────────────────────── Indicador de arrastre de la cascada
     Se muestra solo si la tira desborda de verdad. En escritorio la cascada
     usa `overflow: visible` y cabe entera, así que nunca aparece. */

  var cascade = document.querySelector('.cascade');
  var cascadeHint = document.getElementById('cascadeHint');

  if (cascade && cascadeHint) {
    var thumb = cascadeHint.querySelector('.cascade-scroll__thumb');

    var syncHint = function () {
      var overflow = cascade.scrollWidth - cascade.clientWidth;
      if (overflow <= 4) {
        cascadeHint.hidden = true;
        return;
      }
      cascadeHint.hidden = false;

      var visible = cascade.clientWidth / cascade.scrollWidth;
      var progress = cascade.scrollLeft / overflow;
      thumb.style.width = (visible * 100).toFixed(2) + '%';
      // Se desplaza dentro del hueco que le queda al rail.
      thumb.style.transform = 'translateX(' + (progress * (1 / visible - 1) * 100).toFixed(2) + '%)';

      if (cascade.scrollLeft > 12) cascadeHint.classList.add('is-used');
    };

    syncHint();
    cascade.addEventListener('scroll', syncHint, { passive: true });
    window.addEventListener('resize', syncHint, { passive: true });

    /* Al primer pase el layout todavía no está asentado —faltan las fuentes y
       las imágenes en diferido— y la medida sale mal, dejando el indicador
       visible en escritorio, donde la cascada cabe entera. Hay que volver a
       medir cada vez que el bloque cambia de tamaño. */
    if ('ResizeObserver' in window) {
      new ResizeObserver(syncHint).observe(cascade);
    } else {
      window.addEventListener('load', syncHint);
    }
  }

  /* ───────────────────────────────── Simulador de prioridad
     Corre services/priority.js portado: mismos pesos, misma fórmula. */

  var inputsEl = document.getElementById('simInputs');
  var resultEl = document.getElementById('simResult');

  if (inputsEl && resultEl && window.SchedioPriority) {
    var exams = [
      { id: 'historia', name: 'Historia', color: '--subject-historia', days: 3, difficulty: 7, grade: 5.5 },
      { id: 'mates', name: 'Matemáticas', color: '--subject-mates', days: 6, difficulty: 8, grade: 7.5 },
      { id: 'quimica', name: 'Química', color: '--subject-quimica', days: 11, difficulty: 5, grade: 8.5 },
    ];

    var FACTOR_LABELS = {
      urgency: 'Urgencia',
      risk: 'Tu nota',
      difficulty: 'Dificultad',
      coverage: 'Sin tocar',
    };

    inputsEl.innerHTML =
      '<h3>Tus exámenes</h3>' +
      exams
        .map(function (exam, i) {
          return (
            '<div class="sim-exam">' +
            '<div class="sim-exam__head"><span class="dot" style="--subject: var(' +
            exam.color +
            ')"></span>' +
            exam.name +
            '</div>' +
            field(i, 'days', 'Faltan', exam.days, 0, 30, 1, ' días') +
            field(i, 'difficulty', 'Dificultad', exam.difficulty, 1, 10, 1, ' / 10') +
            field(i, 'grade', 'Tu nota media', exam.grade, 0, 10, 0.5, '') +
            '</div>'
          );
        })
        .join('');

    /** Los decimales van con coma: esto se lee en español. */
    function num(value) {
      return Number(value).toLocaleString('es-ES');
    }

    function field(index, key, label, value, min, max, step, suffix) {
      return (
        '<div class="field">' +
        '<label for="sim-' + index + '-' + key + '">' + label +
        '<output id="out-' + index + '-' + key + '">' + num(value) + suffix + '</output></label>' +
        '<input type="range" id="sim-' + index + '-' + key + '" data-index="' + index +
        '" data-key="' + key + '" data-suffix="' + suffix + '" min="' + min + '" max="' + max +
        '" step="' + step + '" value="' + value + '" />' +
        '</div>'
      );
    }

    inputsEl.addEventListener('input', function (event) {
      var input = event.target;
      if (input.type !== 'range') return;
      var index = Number(input.dataset.index);
      var key = input.dataset.key;
      exams[index][key] = Number(input.value);
      var out = document.getElementById('out-' + index + '-' + key);
      if (out) {
        var suffix = input.dataset.suffix || '';
        if (key === 'days' && Number(input.value) === 1) suffix = ' día';
        out.textContent = num(input.value) + suffix;
      }
      render();
    });

    /** "Es hoy" / "Mañana" / "En N días". */
    function plural(days) {
      if (days === 0) return 'Es hoy';
      if (days === 1) return 'Mañana';
      return 'En ' + days + ' días';
    }

    /** Coma decimal, que esto va en español. */
    function hours(minutes) {
      return (Math.round((minutes / 60) * 10) / 10).toLocaleString('es-ES') + ' h';
    }

    /* Las tarjetas se crean UNA vez y se reordenan, en vez de reconstruir el
       HTML en cada cambio. Es lo que permite verlas moverse a su nueva
       posición: si se regenera el marcado, aparecen ya ordenadas y se pierde
       justo lo que hace entender que hay un cálculo detrás. */
    var cards = {};

    exams.forEach(function (exam) {
      var card = document.createElement('article');
      card.className = 'sim-card';
      card.innerHTML =
        '<div class="sim-card__top">' +
        '<div class="sim-card__name"><span class="dot" style="--subject: var(' + exam.color + ')"></span>' +
        exam.name + '</div>' +
        '<span class="sim-card__score">0</span>' +
        '</div>' +
        '<p class="sim-card__meta"></p>' +
        '<div class="factors">' +
        Object.keys(FACTOR_LABELS)
          .map(function (key) {
            return (
              '<div class="factor" data-factor="' + key + '"><span>' + FACTOR_LABELS[key] + '</span>' +
              '<span class="factor__bar"><span class="factor__fill" style="width:0%"></span></span>' +
              '<span class="factor__val">0</span></div>'
            );
          })
          .join('') +
        '</div>';
      cards[exam.id] = card;
      resultEl.appendChild(card);
    });

    /** El número sube hasta su valor en vez de saltar. */
    function countTo(el, to) {
      var from = Number(el.textContent) || 0;
      if (reduceMotion || from === to) {
        el.textContent = to;
        return;
      }

      if (el._raf) window.cancelAnimationFrame(el._raf);
      if (el._fallback) window.clearTimeout(el._fallback);

      var DURATION = 420;

      /* Red de seguridad: `requestAnimationFrame` se congela en pestañas en
         segundo plano, y sin esto el marcador se quedaría con el valor a medias
         (o a 0) hasta que el usuario volviera. El número tiene que ser correcto
         aunque la animación no llegue a correr. */
      el._fallback = window.setTimeout(function () {
        if (el._raf) window.cancelAnimationFrame(el._raf);
        el.textContent = to;
      }, DURATION + 120);

      var start = null;
      var step = function (stamp) {
        if (start === null) start = stamp;
        var t = Math.min(1, (stamp - start) / DURATION);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(from + (to - from) * eased);
        if (t < 1) {
          el._raf = window.requestAnimationFrame(step);
        } else {
          window.clearTimeout(el._fallback);
        }
      };
      el._raf = window.requestAnimationFrame(step);
    }

    function render() {
      var now = new Date();

      var events = exams.map(function (exam) {
        var date = new Date(now);
        date.setDate(date.getDate() + exam.days);
        return { id: exam.id, subjectId: exam.id, type: 'exam', date: date };
      });

      var subjects = exams.map(function (exam) {
        return { id: exam.id, difficulty: exam.difficulty, averageGrade: exam.grade };
      });

      var ranked = window.SchedioPriority.rankExams(events, subjects, { now: now });

      // FLIP, paso 1: dónde está cada tarjeta ahora.
      var before = {};
      Object.keys(cards).forEach(function (id) {
        before[id] = cards[id].getBoundingClientRect().top;
      });

      // Paso 2: reordenar y actualizar contenido.
      ranked.forEach(function (item, position) {
        var card = cards[item.subjectId];
        var detail = item.priorityDetail;

        card.classList.toggle('is-top', position === 0);
        countTo(card.querySelector('.sim-card__score'), Math.round(detail.score));
        card.querySelector('.sim-card__meta').textContent =
          plural(detail.daysUntil) + ' · ' + hours(detail.effortMinutes) + ' de estudio estimadas';

        card.querySelectorAll('.factor').forEach(function (row) {
          var pct = Math.round(detail.contributions[row.dataset.factor] * 100);
          row.querySelector('.factor__fill').style.width = pct + '%';
          row.querySelector('.factor__val').textContent = pct;
        });

        resultEl.appendChild(card); // reinserta en el orden nuevo
      });

      if (reduceMotion) return;

      // Paso 3: invertir el salto y soltarlo, para que el cambio se vea.
      Object.keys(cards).forEach(function (id) {
        var card = cards[id];
        var delta = before[id] - card.getBoundingClientRect().top;
        if (!delta) return;
        card.style.transition = 'none';
        card.style.transform = 'translateY(' + delta + 'px)';
        window.requestAnimationFrame(function () {
          card.style.transition = 'transform 420ms var(--ease), border-color 180ms var(--ease)';
          card.style.transform = '';
        });
      });
    }

    render();
  }
})();
