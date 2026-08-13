/**
 * Cuestionario de la beta: una pregunta cada vez y envío a Firestore.
 *
 * Escribe por la API REST de Firestore en vez de con el SDK de Firebase: son
 * unas pocas líneas de `fetch` en lugar de ~100 KB de librería, y las reglas de
 * seguridad se aplican exactamente igual. La colección está en modo
 * solo-crear, sin lectura (ver el bloque de reglas en el README).
 */
(function () {
  'use strict';

  var form = document.getElementById('betaForm');
  if (!form) return;

  var cfg = window.SCHEDIO_CONFIG || {};
  var steps = [].slice.call(form.querySelectorAll('.quiz__step'));
  var bar = document.getElementById('quizBar');
  var count = document.getElementById('quizCount');
  var backBtn = document.getElementById('quizBack');
  var nextBtn = document.getElementById('quizNext');
  var sendBtn = document.getElementById('quizSend');
  var errorEl = document.getElementById('quizError');
  var doneEl = document.getElementById('quizDone');
  var androidWarn = document.getElementById('quizAndroidWarn');

  var current = 0;

  function showError(message) {
    errorEl.textContent = message || '';
    errorEl.hidden = !message;
  }

  function paint() {
    steps.forEach(function (step, i) {
      step.classList.toggle('is-active', i === current);
    });

    bar.style.width = ((current + 1) / steps.length) * 100 + '%';
    count.textContent = 'Pregunta ' + (current + 1) + ' de ' + steps.length;

    backBtn.hidden = current === 0;
    var last = current === steps.length - 1;
    nextBtn.hidden = last;
    sendBtn.hidden = !last;
    showError('');

    // Enfocar el primer campo del paso ayuda en móvil y con teclado.
    var field = steps[current].querySelector('input, textarea');
    if (field && field.type !== 'radio') field.focus({ preventScroll: true });
  }

  /** Valida solo el paso visible; el navegador no puede hacerlo por nosotros
   *  porque los demás pasos están ocultos y `checkValidity` los ignoraría. */
  function validateStep() {
    var step = steps[current];

    var email = step.querySelector('#q-email');
    if (email) {
      var value = email.value.trim();
      if (!value) return 'Necesitamos un email para poder avisarte.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return 'Ese email no parece válido.';
      return null;
    }

    var radios = step.querySelectorAll('input[type="radio"]');
    if (radios.length) {
      var picked = [].slice.call(radios).some(function (r) {
        return r.checked;
      });
      return picked ? null : 'Elige una opción para seguir.';
    }

    var consent = step.querySelector('#q-consent');
    if (consent && !consent.checked) {
      return 'Necesitamos tu permiso para guardar el email.';
    }

    return null;
  }

  nextBtn.addEventListener('click', function () {
    var problem = validateStep();
    if (problem) {
      showError(problem);
      return;
    }
    current = Math.min(current + 1, steps.length - 1);
    paint();
  });

  backBtn.addEventListener('click', function () {
    current = Math.max(current - 1, 0);
    paint();
  });

  // Enter avanza en vez de enviar el formulario a medias.
  form.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter') return;
    if (event.target.tagName === 'TEXTAREA') return;
    event.preventDefault();
    (current === steps.length - 1 ? sendBtn : nextBtn).click();
  });

  // Aviso si dice que no tiene Android: mejor decírselo antes de que se apunte.
  form.addEventListener('change', function (event) {
    if (event.target.name === 'android') {
      androidWarn.hidden = event.target.value !== 'no';
    }
  });

  /** Firestore REST espera cada campo con su tipo declarado. */
  function toFirestoreFields(data) {
    return {
      email: { stringValue: data.email },
      curso: { stringValue: data.curso },
      android: { booleanValue: data.android },
      dolor: { stringValue: data.dolor },
      creado: { timestampValue: new Date().toISOString() },
    };
  }

  function mailtoFallback(data) {
    var body =
      'Email: ' + data.email +
      '\nCurso: ' + data.curso +
      '\nAndroid: ' + (data.android ? 'si' : 'no') +
      '\nQue peor lleva: ' + (data.dolor || '-');
    return (
      'mailto:' + cfg.contactEmail +
      '?subject=' + encodeURIComponent('Quiero entrar en la lista de espera de Schedio') +
      '&body=' + encodeURIComponent(body)
    );
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var problem = validateStep();
    if (problem) {
      showError(problem);
      return;
    }

    // Si la trampa viene rellena, es un bot: se finge éxito y no se escribe.
    if (form.querySelector('#q-web').value) {
      form.hidden = true;
      doneEl.hidden = false;
      return;
    }

    var data = {
      email: form.querySelector('#q-email').value.trim(),
      curso: (form.querySelector('input[name="curso"]:checked') || {}).value || '',
      android: (form.querySelector('input[name="android"]:checked') || {}).value === 'si',
      dolor: form.querySelector('#q-dolor').value.trim(),
    };

    // Sin configuración de Firestore no se falla en silencio: se ofrece el
    // correo con todo ya escrito.
    if (!cfg.apiKey || !cfg.projectId) {
      window.location.href = mailtoFallback(data);
      return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = 'Enviando';
    showError('');

    var url =
      'https://firestore.googleapis.com/v1/projects/' + cfg.projectId +
      '/databases/(default)/documents/' + cfg.collection + '?key=' + cfg.apiKey;

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFirestoreFields(data) }),
    })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        document.getElementById('quizDoneEmail').textContent = data.email;
        form.hidden = true;
        doneEl.hidden = false;
      })
      .catch(function () {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Entrar en la lista';
        showError('No se ha podido enviar. Escríbenos a ' + cfg.contactEmail + ' y te apuntamos.');
      });
  });

  paint();
})();
