/**
 * Schedio — landing. Todo el JS de la página.
 *
 * Nada aquí es imprescindible para leer la web: sin JS el contenido sigue
 * completo y el simulador cae a un ejemplo estático escrito en el HTML.
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Único punto de bifurcación por idioma en todo el fichero: casi todo el
     texto vive en el HTML (index.html vs en/index.html), pero el simulador
     genera parte de su marcado desde aquí, así que ese puñado de cadenas
     necesita las dos versiones. Se lee de <html lang="…">, que cada página
     ya declara por su cuenta. */
  var isEN = document.documentElement.lang === 'en';

  /* Marca de "hay JS". Sin ella el CSS no oculta nada: el contenido es legible
     aunque este script no llegue a ejecutarse nunca. */
  if (!reduceMotion) document.documentElement.classList.add('js');

  /* Red de seguridad: si a los 2,5s el observer no ha revelado NADA, se asume
     roto y se desactiva el sistema entero quitando la clase `js`. Todo vuelve a
     ser visible. No revela elemento a elemento, porque los de más abajo tienen
     que seguir esperando su scroll. */
  var revealFired = false;
  window.setTimeout(function () {
    if (!revealFired) document.documentElement.classList.remove('js', 'mo');
  }, 2500);

  /* Un toque háptico mínimo al mover un control. Solo en pantallas táctiles y
     solo con gestos reales del usuario (`isTrusted`): las demos automáticas no
     deben hacer vibrar el móvil por su cuenta. iPhone no lo soporta y lo
     ignora sin más. */
  var coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  var lastTick = 0;
  function tick(ms) {
    if (reduceMotion || !coarsePointer || !navigator.vibrate) return;
    var now = Date.now();
    if (now - lastTick < 60) return;
    lastTick = now;
    try {
      navigator.vibrate(ms || 6);
    } catch (e) {
      /* algunos navegadores lo bloquean fuera de un gesto */
    }
  }

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
        /* Un observer vivo avisa una vez nada más empezar a observar, se vea o
           no el elemento: con eso basta para saber que funciona. Antes se
           marcaba solo al revelar algo, y en una carga normal —con todo lo
           revelable por debajo del primer pantallazo— la red de seguridad
           saltaba a los 2,5 s y apagaba el sistema entero. */
        revealFired = true;
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
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
    var detailEta = rankDetail.querySelector('.rank-detail__eta');

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

          // Leyenda es el último: no hay siguiente que enseñar. El nombre del
          // rango (next) es dato real de gamification.js y se queda en
          // español en las dos versiones — la etiqueta "Siguiente"/"Next" es
          // chrome nuestro, esa sí traduce.
          var next = button.dataset.next;
          if (next) {
            detailNext.innerHTML = (isEN ? 'Next: ' : 'Siguiente: ') + '<strong></strong>';
            detailNext.querySelector('strong').textContent = next;
            detailNext.hidden = false;
          } else {
            detailNext.textContent = isEN ? 'Nothing above this.' : 'No hay nada por encima.';
            detailNext.hidden = false;
          }

          paceRefresh();
          rankDetail.classList.remove('is-swapping');
        },
        reduceMotion ? 0 : 140
      );
    };

    /* Ritmo → cuánto tarda cada rango. Las reglas son las de la app
       (services/gamification.js): 10 XP por minuto de sesión y el nivel L
       exige 100·(L−1)² XP. En la app también se ganan 50 XP por cada tarea del
       plan marcada; aquí no cuentan, así que el resultado es el peor caso. */
    var paceWrap = document.getElementById('pace');
    var paceInput = document.getElementById('paceInput');
    var paceOut = document.getElementById('paceOut');
    var XP_PER_MINUTE = 10;
    var pace = 30;

    function xpForLevel(level) {
      return level <= 1 ? 0 : 100 * Math.pow(level - 1, 2);
    }

    function fmtDuration(days) {
      var n;
      if (days < 14) {
        n = Math.max(1, Math.round(days));
        return n + (isEN ? (n === 1 ? ' day' : ' days') : n === 1 ? ' día' : ' días');
      }
      if (days < 60) {
        return Math.round(days / 7) + (isEN ? ' weeks' : ' semanas');
      }
      if (days < 730) {
        return Math.round(days / 30.4) + (isEN ? ' months' : ' meses');
      }
      var years = days / 365;
      n = years < 10 ? (Math.round(years * 10) / 10).toLocaleString(isEN ? 'en-US' : 'es-ES') : String(Math.round(years));
      return n + (isEN ? ' years' : ' años');
    }

    function paceRefresh() {
      var daily = pace * XP_PER_MINUTE;

      rankButtons.forEach(function (button) {
        var eta = button.querySelector('.rank__eta');
        if (!eta) return;
        var level = Number(button.dataset.level);
        eta.textContent =
          level <= 1
            ? isEN ? 'You start here' : 'Empiezas aquí'
            : '≈ ' + fmtDuration(xpForLevel(level) / daily);
      });

      var active = document.querySelector('.rank.is-active');
      if (detailEta && active) {
        var lv = Number(active.dataset.level);
        if (lv <= 1) {
          detailEta.textContent = isEN ? 'Everyone starts here.' : 'Aquí empieza todo el mundo.';
        } else {
          var xp = xpForLevel(lv);
          detailEta.innerHTML =
            '<strong>' + xp.toLocaleString(isEN ? 'en-US' : 'es-ES') + ' XP</strong> · ' +
            (isEN ? 'at ' + pace + ' min a day, ' : 'a ' + pace + ' min al día, ') +
            '≈ ' + fmtDuration(xp / daily);
        }
      }

      if (paceOut) paceOut.textContent = pace + (isEN ? ' min a day' : ' min al día');
    }

    if (paceWrap && paceInput) {
      paceWrap.hidden = false;
      paceInput.addEventListener('input', function (event) {
        if (event.isTrusted) tick(6);
        pace = Number(paceInput.value);
        paceRefresh();
      });
    }
    paceRefresh();

    /* Al llegar a la escalera sube sola, de Novato a Leyenda, para que se vea
       qué es un rango antes de pedirte que toques uno. En cuanto el usuario
       interactúa, se detiene. */
    var ranksEl = document.querySelector('.ranks');
    var climbTimers = [];
    var stopClimb = function () {
      climbTimers.forEach(function (t) {
        window.clearTimeout(t);
      });
      climbTimers = [];
    };

    if (ranksEl && 'IntersectionObserver' in window && !reduceMotion) {
      ['pointerdown', 'pointerenter', 'focusin', 'touchstart'].forEach(function (type) {
        ranksEl.addEventListener(type, stopClimb, { passive: true });
      });

      var ranksObserver = new IntersectionObserver(
        function (entries) {
          if (!entries[0].isIntersecting) return;
          ranksObserver.disconnect();
          ranksEl.classList.add('is-seen');
          rankButtons.forEach(function (button, i) {
            if (i === 0) return;
            climbTimers.push(
              window.setTimeout(function () {
                selectRank(button);
              }, 900 + i * 560)
            );
          });
        },
        { threshold: 0.45 }
      );
      ranksObserver.observe(ranksEl);
    } else if (ranksEl) {
      ranksEl.classList.add('is-seen');
    }

    rankButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        tick(8);
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

  /* Estas escenas reproducen la interfaz real de la app (mismas clases que
     usa la app de verdad: app-card, subject-chip, timer…), así que se quedan
     en español SIEMPRE, en las dos versiones del sitio — la app en sí es
     solo en español hoy. Traducirlas mostraría una interfaz que no existe.
     Lo que sí cambia por idioma es el texto alrededor (main.js T dict), no
     esto. Ver también el simulador más abajo, que es un widget propio de la
     web y no una réplica de pantalla — a ese sí le toca su versión inglesa. */
  var STEP_SCREENS = [
    // 1 · Tus asignaturas
    '<p class="app-section-title">Tus asignaturas</p>' +
      subjectRow('Matemáticas', '--subject-mates') +
      subjectRow('Historia', '--subject-historia') +
      subjectRow('Química', '--subject-quimica') +
      subjectRow('Lengua', '--subject-lengua') +
      subjectRow('Inglés', '--subject-ingles'),

    // 2 · El plan de hoy. Entra tal como lo metiste (sin orden) y Schedio lo
    //     ordena delante de ti: ver planDemo.
    planScreen(!reduceMotion),

    // 3 · La sesión
    '<p class="app-section-title">Sesión de estudio</p>' +
      '<div class="app-card"><div class="timer">' +
      '<span class="timer__value" style="font-size:52px">25:00</span>' +
      '<span class="timer__label">Historia · Tema 6</span>' +
      '</div><span class="app-btn has-arrow">Empezar</span></div>',
  ];

  /** Pantalla "Hoy". `unsorted` la pinta en el orden en que se metieron los
   *  exámenes y con Historia sin destacar; la demo la ordena después. */
  function planScreen(unsorted) {
    var rows = {
      quimica: examRow('Química', '4 ago · en 11 días', 'Normal', false, 'quimica'),
      mates: examRow('Matemáticas', '30 jul · en 6 días', 'Normal', false, 'mates'),
      historia: unsorted
        ? examRow('Historia', '27 jul · en 3 días', 'Normal', false, 'historia')
        : examRow('Historia', '27 jul · en 3 días', 'Prioridad alta', true, 'historia'),
    };
    var order = unsorted ? ['quimica', 'mates', 'historia'] : ['historia', 'mates', 'quimica'];
    return (
      '<p class="app-section-title">Hoy</p>' +
      '<div class="app-card" id="planCard">' +
      '<span class="app-card__overline">PRÓXIMOS EXÁMENES</span>' +
      order
        .map(function (id) {
          return rows[id];
        })
        .join('') +
      '</div>'
    );
  }

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

  function examRow(name, meta, chip, isAccent, id) {
    return (
      '<div class="app-row"' + (id ? ' data-id="' + id + '"' : '') + '><div>' +
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

  /* Lo que ocurre en la pantalla tras montarla. Se cancela todo al cambiar de
     paso: si no, una demo a medias seguiría tocando una pantalla que ya no
     está. */
  var screenTimers = [];

  function clearScreenTimers() {
    screenTimers.forEach(function (t) {
      window.clearTimeout(t);
      window.clearInterval(t);
    });
    screenTimers = [];
  }

  function later(fn, ms) {
    screenTimers.push(window.setTimeout(fn, ms));
  }

  /** Paso 2: Schedio ordena. Historia sube al primer puesto y se marca. */
  function planDemo() {
    var card = document.getElementById('planCard');
    if (!card) return;
    later(function () {
      var rows = Array.prototype.slice.call(card.querySelectorAll('.app-row'));
      var top = card.querySelector('[data-id="historia"]');
      var before = rows.map(function (r) {
        return r.getBoundingClientRect().top;
      });

      var chip = top.querySelector('.chip');
      chip.textContent = 'Prioridad alta';
      chip.classList.add('chip--accent');

      ['historia', 'mates', 'quimica'].forEach(function (id) {
        card.appendChild(card.querySelector('[data-id="' + id + '"]'));
      });

      // FLIP: cada fila vuelve visualmente a donde estaba y se suelta.
      rows.forEach(function (row, i) {
        var delta = before[i] - row.getBoundingClientRect().top;
        if (!delta) return;
        row.style.transition = 'none';
        row.style.transform = 'translateY(' + delta + 'px)';
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () {
            row.style.transition = '';
            row.style.transform = '';
          });
        });
      });
    }, 1100);
  }

  /** Paso 3: se pulsa "Empezar" y el reloj corre un minuto y medio. */
  function timerDemo() {
    var value = stepScreen.querySelector('.timer__value');
    var button = stepScreen.querySelector('.app-btn');
    if (!value || !button) return;
    later(function () {
      button.classList.add('is-pressed');
    }, 850);
    later(function () {
      button.classList.remove('is-pressed');
      var seconds = 25 * 60;
      screenTimers.push(
        window.setInterval(function () {
          if (seconds <= 25 * 60 - 90) return;
          seconds -= 1;
          value.textContent = Math.floor(seconds / 60) + ':' + ('0' + (seconds % 60)).slice(-2);
        }, 1000)
      );
    }, 1050);
  }

  var SCREEN_DEMOS = [null, planDemo, timerDemo];

  function setStepScreen(index) {
    if (!stepScreen) return;
    if (stepScreen.dataset.step === String(index)) return;
    stepScreen.dataset.step = String(index);
    clearScreenTimers();

    steps.forEach(function (step) {
      step.classList.toggle('is-active', step.dataset.step === String(index));
    });

    stepScreen.style.opacity = '0';
    later(
      function () {
        stepScreen.innerHTML = STEP_SCREENS[index] || '';
        stepScreen.style.opacity = '1';
        if (!reduceMotion && SCREEN_DEMOS[index]) SCREEN_DEMOS[index]();
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
    var exams = isEN
      ? [
          { id: 'historia', name: 'History', color: '--subject-historia', days: 3, difficulty: 7, grade: 5.5 },
          { id: 'mates', name: 'Math', color: '--subject-mates', days: 6, difficulty: 8, grade: 7.5 },
          { id: 'quimica', name: 'Chemistry', color: '--subject-quimica', days: 11, difficulty: 5, grade: 8.5 },
        ]
      : [
          { id: 'historia', name: 'Historia', color: '--subject-historia', days: 3, difficulty: 7, grade: 5.5 },
          { id: 'mates', name: 'Matemáticas', color: '--subject-mates', days: 6, difficulty: 8, grade: 7.5 },
          { id: 'quimica', name: 'Química', color: '--subject-quimica', days: 11, difficulty: 5, grade: 8.5 },
        ];

    var FACTOR_LABELS = isEN
      ? { urgency: 'Urgency', risk: 'Your grade', difficulty: 'Difficulty', coverage: 'Untouched' }
      : { urgency: 'Urgencia', risk: 'Tu nota', difficulty: 'Dificultad', coverage: 'Sin tocar' };

    var T = isEN
      ? { exams: 'Your exams', left: 'Due in', difficulty: 'Difficulty', grade: 'Your average grade', day: ' day', days: ' days' }
      : { exams: 'Tus exámenes', left: 'Faltan', difficulty: 'Dificultad', grade: 'Tu nota media', day: ' día', days: ' días' };

    inputsEl.innerHTML =
      '<h3>' + T.exams + '</h3>' +
      exams
        .map(function (exam, i) {
          return (
            '<div class="sim-exam">' +
            '<div class="sim-exam__head"><span class="dot" style="--subject: var(' +
            exam.color +
            ')"></span>' +
            exam.name +
            '</div>' +
            field(i, 'days', T.left, exam.days, 0, 30, 1, T.days) +
            field(i, 'difficulty', T.difficulty, exam.difficulty, 1, 10, 1, ' / 10') +
            field(i, 'grade', T.grade, exam.grade, 0, 10, 0.5, '') +
            '</div>'
          );
        })
        .join('');

    /** Coma decimal en español, punto en inglés — cada uno se lee como toca. */
    function num(value) {
      return Number(value).toLocaleString(isEN ? 'en-US' : 'es-ES');
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
      if (event.isTrusted) tick(6);
      var index = Number(input.dataset.index);
      var key = input.dataset.key;
      exams[index][key] = Number(input.value);
      var out = document.getElementById('out-' + index + '-' + key);
      if (out) {
        var suffix = input.dataset.suffix || '';
        if (key === 'days' && Number(input.value) === 1) suffix = T.day;
        out.textContent = num(input.value) + suffix;
      }
      render();
    });

    /** "Es hoy" / "Mañana" / "En N días" — "Today" / "Tomorrow" / "In N days". */
    function plural(days) {
      if (isEN) {
        if (days === 0) return 'Today';
        if (days === 1) return 'Tomorrow';
        return 'In ' + days + ' days';
      }
      if (days === 0) return 'Es hoy';
      if (days === 1) return 'Mañana';
      return 'En ' + days + ' días';
    }

    /** Coma decimal en español, punto en inglés. */
    function hours(minutes) {
      return (Math.round((minutes / 60) * 10) / 10).toLocaleString(isEN ? 'en-US' : 'es-ES') + ' h';
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
          plural(detail.daysUntil) + ' · ' + hours(detail.effortMinutes) +
          (isEN ? ' of study estimated' : ' de estudio estimadas');

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

    /* Demo al llegar: Matemáticas se acerca a su examen, adelanta a Historia,
       y vuelve. Es el algoritmo real moviéndose, no una animación pregrabada.
       Cualquier gesto del usuario la corta y deja el simulador como estaba. */
    var cancelSimDemo = function () {};
    var simEl = document.querySelector('.sim');
    var slider = document.getElementById('sim-1-days');
    if (simEl && slider && 'IntersectionObserver' in window && !reduceMotion) {
      var demoTimers = [];
      var START = Number(slider.value);
      var touched = false;

      var setDays = function (value) {
        slider.value = value;
        slider.dispatchEvent(new Event('input', { bubbles: true }));
      };

      var stopDemo = function () {
        if (touched) return;
        touched = true;
        demoTimers.forEach(function (t) {
          window.clearTimeout(t);
        });
        if (Number(slider.value) !== START) setDays(START);
      };

      // Para cuando el simulador lo toca otra pieza (el reto de arriba): se
      // corta la demo sin devolver el slider a su sitio, porque los valores
      // nuevos los ha puesto esa pieza a propósito.
      cancelSimDemo = function () {
        touched = true;
        demoTimers.forEach(function (t) {
          window.clearTimeout(t);
        });
      };

      ['pointerdown', 'keydown', 'touchstart'].forEach(function (type) {
        simEl.addEventListener(type, stopDemo, { passive: true });
      });

      var demoObserver = new IntersectionObserver(
        function (entries) {
          if (!entries[0].isIntersecting || touched) return;
          demoObserver.disconnect();
          var path = [];
          for (var d = START - 1; d >= 1; d--) path.push(d);
          path.forEach(function (d, i) {
            demoTimers.push(
              window.setTimeout(function () {
                setDays(d);
              }, 1000 + i * 380)
            );
          });
          demoTimers.push(
            window.setTimeout(function () {
              setDays(START);
            }, 1000 + path.length * 380 + 2200)
          );
        },
        { threshold: 0.6 }
      );
      demoObserver.observe(simEl);
    }

    /* ───────────────────────────────── Ordénalo tú, luego Schedio
       Tres exámenes con sus datos: eliges por cuál empezarías, y después se
       ve lo que hace el algoritmo REAL (el mismo `rankExams` del simulador).
       Los tres casos están escogidos —y comprobados contra priority.js— para
       que el orden de Schedio no sea el del calendario; con un caso donde
       gana siempre el más cercano no se vería nada. Los textos de "por qué"
       son del caso, no del algoritmo: si cambian los pesos hay que revisarlos. */

    var challengeEl = document.getElementById('challenge');

    if (challengeEl) {
      var CH = isEN
        ? {
            q: 'Before you look: which would you start with today?',
            hint: 'Tap the exams in the order you would study them.',
            difficulty: 'Difficulty',
            grade: 'Your grade',
            go: 'See what Schedio would do',
            next: 'Try another case',
            toSim: 'Open this data in the simulator',
            you: function (o) { return 'You: ' + o; },
            youSame: function (o) { return 'You too: ' + o; },
            all: 'You agree on all three.',
            some: function (n) { return 'You agree on ' + n + ' of 3.'; },
            none: 'You disagree on all three.',
            clinched: 'Nailed it: ',
            tail: 'This is the app’s real algorithm. Change the numbers below and watch the order move.',
          }
        : {
            q: 'Antes de mirar: ¿por cuál empezarías hoy?',
            hint: 'Toca los exámenes en el orden en que los estudiarías.',
            difficulty: 'Dificultad',
            grade: 'Tu nota',
            go: 'Ver qué haría Schedio',
            next: 'Probar otro caso',
            toSim: 'Abrir estos datos en el simulador',
            you: function (o) { return 'Tú: ' + o; },
            youSame: function (o) { return 'Tú también: ' + o; },
            all: 'Coincidís en los tres.',
            some: function (n) { return 'Coincidís en ' + n + ' de 3.'; },
            none: 'No coincidís en ninguno.',
            clinched: 'Lo has clavado: ',
            tail: 'Es el algoritmo real de la app. Cambia los números de abajo y mira cómo se mueve el orden.',
          };

      var SCENARIOS = [
        {
          data: {
            mates: { days: 3, difficulty: 3, grade: 9 },
            historia: { days: 5, difficulty: 9, grade: 4.5 },
            quimica: { days: 8, difficulty: 5, grade: 7 },
          },
          why: isEN
            ? 'Math comes first on the calendar, but it’s easy and you’re sitting on a 9. History is the hardest and your weakest: that’s where studying today pays off most.'
            : 'Matemáticas cae antes, pero es fácil y vas con un 9. Historia es la que más te cuesta y donde peor vas: ahí es donde más se gana estudiando hoy.',
        },
        {
          data: {
            mates: { days: 2, difficulty: 2, grade: 9.5 },
            historia: { days: 4, difficulty: 9, grade: 4 },
            quimica: { days: 6, difficulty: 6, grade: 6 },
          },
          why: isEN
            ? 'Math is the closest, but you’ve almost got it covered. History is hard and your weakest; Chemistry is borderline. The order follows what you need most, not just the date.'
            : 'Matemáticas es la más cercana, pero la llevas casi de sobra. Historia es difícil y es donde peor vas; Química va justa. El orden sigue lo que más te falta, no solo la fecha.',
        },
        {
          data: {
            mates: { days: 2, difficulty: 3, grade: 9 },
            quimica: { days: 3, difficulty: 8, grade: 5 },
            historia: { days: 4, difficulty: 6, grade: 6.5 },
          },
          why: isEN
            ? 'Math has slack: it’s easy and you’re doing very well. Chemistry is a day later, but it’s hard and you’re borderline: that’s where today’s study counts most.'
            : 'Con Matemáticas hay margen: es fácil y vas muy bien. Química cae un día después, pero es difícil y vas justo: ahí rinde más estudiar hoy.',
        },
      ];

      var scenarioIndex = 0;
      var picks = [];
      var revealed = false;
      var cardEls = {};

      var examById = function (id) {
        for (var i = 0; i < exams.length; i++) if (exams[i].id === id) return exams[i];
        return null;
      };

      var ordinal = function (n) {
        return isEN ? ['1st', '2nd', '3rd'][n - 1] : n + '.º';
      };

      /** El orden que devuelve el algoritmo real para los datos de un caso. */
      var rankScenario = function (data) {
        var now = new Date();
        var ids = Object.keys(data);
        var events = ids.map(function (id) {
          var date = new Date(now);
          date.setDate(date.getDate() + data[id].days);
          return { id: id, subjectId: id, type: 'exam', date: date };
        });
        var subjects = ids.map(function (id) {
          return { id: id, difficulty: data[id].difficulty, averageGrade: data[id].grade };
        });
        return window.SchedioPriority.rankExams(events, subjects, { now: now });
      };

      var buildChallenge = function () {
        var data = SCENARIOS[scenarioIndex].data;
        var ids = Object.keys(data).sort(function (a, b) {
          return data[a].days - data[b].days;
        });
        picks = [];
        revealed = false;

        challengeEl.innerHTML =
          '<p class="challenge__q">' + CH.q + '</p>' +
          '<p class="challenge__hint">' + CH.hint + '</p>' +
          '<div class="challenge__cards" id="chCards">' +
          ids
            .map(function (id) {
              var exam = examById(id);
              var d = data[id];
              return (
                '<button type="button" class="ch-card" data-id="' + id + '" aria-pressed="false">' +
                '<span class="ch-card__pick" aria-hidden="true"></span>' +
                '<span class="ch-card__name"><span class="dot" style="--subject: var(' + exam.color + ')"></span>' + exam.name + '</span>' +
                '<span class="ch-card__when">' + plural(d.days) + '</span>' +
                '<span class="ch-card__stats"><span>' + CH.difficulty + ' ' + d.difficulty + '/10</span><span>' + CH.grade + ' ' + num(d.grade) + '</span></span>' +
                '<span class="ch-card__foot" hidden><span class="ch-card__you"></span><span class="ch-card__score">0</span></span>' +
                '</button>'
              );
            })
            .join('') +
          '</div>' +
          '<div class="challenge__bar">' +
          '<button type="button" class="btn btn--primary btn--sm" id="chGo" disabled>' + CH.go + '</button>' +
          '<button type="button" class="btn btn--ghost btn--sm" id="chNext" hidden>' + CH.next + '</button>' +
          '</div>' +
          '<div class="challenge__result" id="chResult" aria-live="polite" hidden></div>';

        cardEls = {};
        ids.forEach(function (id) {
          cardEls[id] = challengeEl.querySelector('[data-id="' + id + '"]');
        });
      };

      /** Pinta los puestos elegidos. Con dos elegidos el tercero se rellena solo. */
      var syncPicks = function () {
        var ids = Object.keys(cardEls);
        var full = picks.slice();
        if (picks.length === 2) {
          ids.forEach(function (id) {
            if (picks.indexOf(id) === -1) full.push(id);
          });
        }
        ids.forEach(function (id) {
          var pos = full.indexOf(id);
          var manual = picks.indexOf(id) !== -1;
          var card = cardEls[id];
          card.classList.toggle('is-picked', manual);
          card.classList.toggle('is-auto', pos !== -1 && !manual);
          card.setAttribute('aria-pressed', manual ? 'true' : 'false');
          card.querySelector('.ch-card__pick').textContent = pos === -1 ? '' : String(pos + 1);
        });
        document.getElementById('chGo').disabled = picks.length < 2;
        return full;
      };

      var revealChallenge = function () {
        var order = syncPicks();
        var scenario = SCENARIOS[scenarioIndex];
        var ranked = rankScenario(scenario.data);
        var container = document.getElementById('chCards');
        var ids = Object.keys(cardEls);

        revealed = true;

        // FLIP, paso 1: dónde está cada tarjeta ahora.
        var before = {};
        ids.forEach(function (id) {
          var box = cardEls[id].getBoundingClientRect();
          before[id] = { x: box.left, y: box.top };
        });

        var matches = 0;
        ranked.forEach(function (item, position) {
          var id = item.subjectId;
          var card = cardEls[id];
          var mine = order.indexOf(id);
          if (mine === position) matches++;

          container.appendChild(card);
          card.disabled = true;
          card.classList.remove('is-picked', 'is-auto');
          card.classList.add('is-revealed');
          card.classList.toggle('is-top', position === 0);
          card.setAttribute('aria-pressed', 'false');
          card.querySelector('.ch-card__pick').textContent = String(position + 1);

          var foot = card.querySelector('.ch-card__foot');
          foot.hidden = false;
          card.querySelector('.ch-card__you').textContent = (mine === position ? CH.youSame : CH.you)(ordinal(mine + 1));
          countTo(card.querySelector('.ch-card__score'), Math.round(item.priorityDetail.score));
        });

        // Paso 2: invertir el salto y soltarlo.
        if (!reduceMotion) {
          ids.forEach(function (id) {
            var card = cardEls[id];
            var box = card.getBoundingClientRect();
            var dx = before[id].x - box.left;
            var dy = before[id].y - box.top;
            if (!dx && !dy) return;
            card.style.transition = 'none';
            card.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
            window.requestAnimationFrame(function () {
              window.requestAnimationFrame(function () {
                card.style.transition = 'transform 560ms var(--ease), border-color 180ms var(--ease), background 180ms var(--ease)';
                card.style.transform = '';
                window.setTimeout(function () {
                  card.style.transition = '';
                }, 620);
              });
            });
          });
        }

        var headline = matches === 3 ? CH.all : matches === 0 ? CH.none : CH.some(matches);
        var why = matches === 3 ? CH.clinched + scenario.why : scenario.why;
        var result = document.getElementById('chResult');
        result.innerHTML =
          '<p class="challenge__match"></p><p class="challenge__why"></p>' +
          '<div class="challenge__bar"><button type="button" class="btn btn--ghost btn--sm" id="chSim"></button></div>';
        result.querySelector('.challenge__match').textContent = headline;
        result.querySelector('.challenge__why').textContent = why + ' ' + CH.tail;
        result.querySelector('#chSim').textContent = CH.toSim;
        result.hidden = false;

        document.getElementById('chGo').hidden = true;
        document.getElementById('chNext').hidden = false;
      };

      /** Mete los datos del caso en el simulador de abajo y baja hasta él. */
      var loadIntoSim = function () {
        cancelSimDemo();
        var data = SCENARIOS[scenarioIndex].data;
        exams.forEach(function (exam, i) {
          ['days', 'difficulty', 'grade'].forEach(function (key) {
            var input = document.getElementById('sim-' + i + '-' + key);
            input.value = data[exam.id][key];
            input.dispatchEvent(new Event('input', { bubbles: true }));
          });
        });
        document.querySelector('.sim').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      };

      challengeEl.addEventListener('click', function (event) {
        var target = event.target;
        var card = target.closest('.ch-card');

        if (card && !revealed) {
          var id = card.dataset.id;
          var at = picks.indexOf(id);
          if (event.isTrusted) tick(8);
          if (at !== -1) picks.splice(at, 1);
          else if (picks.length < 3) picks.push(id);
          syncPicks();
        } else if (target.closest('#chGo')) {
          if (picks.length >= 2) revealChallenge();
        } else if (target.closest('#chNext')) {
          scenarioIndex = (scenarioIndex + 1) % SCENARIOS.length;
          buildChallenge();
        } else if (target.closest('#chSim')) {
          loadIntoSim();
        }
      });

      buildChallenge();
      challengeEl.hidden = false;
    }
  }
})();
