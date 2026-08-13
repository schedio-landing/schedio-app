/**
 * Puerto al navegador de schedio-mobile/services/priority.js.
 *
 * Es el MISMO algoritmo que ordena el plan dentro de la app, no una
 * aproximación para la web. Se puede portar tal cual porque el original se
 * escribió puro a propósito: sin firebase y sin Date.now() salvo que se le pase,
 * precisamente para poder ejecutarse aislado.
 *
 * Si se tocan los pesos en la app, hay que tocarlos aquí. No se sincronizan.
 */
(function (global) {
  'use strict';

  var DIFFICULTY_MIN = 1;
  var DIFFICULTY_MAX = 10;
  var DIFFICULTY_NEUTRAL = 5;

  var GRADE_MAX = 10;
  var GRADE_NEUTRAL = 5;

  /** A URGENCY_HALF_LIFE días vista, la urgencia vale la mitad que hoy. */
  var URGENCY_HALF_LIFE = 7;

  /** Suman 100, así que el score se lee como porcentaje del máximo posible. */
  var WEIGHTS = {
    urgency: 40,
    risk: 20,
    difficulty: 15,
    coverage: 15,
    stakes: 10,
  };

  var STAKES_BY_TYPE = { exam: 1, task: 0.45 };

  var MANUAL_PRIORITY_NEUTRAL = 5;
  var MANUAL_PRIORITY_STEP = 0.05;
  var MANUAL_BOOST_RANGE = [0.8, 1.3];

  var BASE_EFFORT_MINUTES = { exam: 150, task: 45 };
  var EFFORT_DIFFICULTY_RANGE = [0.6, 1.8];

  var MS_PER_DAY = 24 * 60 * 60 * 1000;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function startOfDay(date) {
    var copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  /** Días naturales completos, comparados a medianoche: un examen más tarde
   *  *hoy* es 0 y no -1. */
  function daysBetween(from, to) {
    return Math.round((startOfDay(to) - startOfDay(from)) / MS_PER_DAY);
  }

  function normalizeDifficulty(subject) {
    var raw = Number(subject && subject.difficulty);
    if (!isFinite(raw) || raw <= 0) return DIFFICULTY_NEUTRAL;
    return clamp(raw, DIFFICULTY_MIN, DIFFICULTY_MAX);
  }

  function normalizeType(event) {
    return event && event.type === 'task' ? 'task' : 'exam';
  }

  /** 1 hoy, 0.5 a URGENCY_HALF_LIFE, asintótica a 0. Continua: dos distancias
   *  distintas nunca puntúan igual. */
  function urgencyFactor(daysUntil) {
    var days = Math.max(0, daysUntil);
    return 1 / (1 + days / URGENCY_HALF_LIFE);
  }

  function stakesFactor(event) {
    return STAKES_BY_TYPE[normalizeType(event)];
  }

  function difficultyFactor(subject) {
    return (normalizeDifficulty(subject) - DIFFICULTY_MIN) / (DIFFICULTY_MAX - DIFFICULTY_MIN);
  }

  /** Nota media baja = más en juego. Nota desconocida se queda en el medio, no
   *  finge ser un suspenso. */
  function riskFactor(subject) {
    var raw = Number(subject && subject.averageGrade);
    var grade = isFinite(raw) ? clamp(raw, 0, GRADE_MAX) : GRADE_NEUTRAL;
    return 1 - grade / GRADE_MAX;
  }

  function coverageFactor(studiedMinutes, effortMinutes) {
    if (!effortMinutes) return 1;
    return 1 - clamp((studiedMinutes || 0) / effortMinutes, 0, 1);
  }

  function manualBoost(event) {
    var raw = Number(event && (event.manualPriority != null ? event.manualPriority : event.priority));
    if (!isFinite(raw)) return 1;
    var boost = 1 + (raw - MANUAL_PRIORITY_NEUTRAL) * MANUAL_PRIORITY_STEP;
    return clamp(boost, MANUAL_BOOST_RANGE[0], MANUAL_BOOST_RANGE[1]);
  }

  function estimateEffortMinutes(event, subject) {
    var base = BASE_EFFORT_MINUTES[normalizeType(event)];
    var lo = EFFORT_DIFFICULTY_RANGE[0];
    var hi = EFFORT_DIFFICULTY_RANGE[1];
    return Math.round(base * (lo + difficultyFactor(subject) * (hi - lo)));
  }

  function computeExamPriority(event, subject, ctx) {
    ctx = ctx || {};
    var now = ctx.now || new Date();
    var studiedBySubject = ctx.studiedMinutesBySubject || {};

    var date = event && event.date ? new Date(event.date) : null;
    if (date && isNaN(date)) date = null;
    var daysUntil = date === null ? null : daysBetween(now, date);

    var effortMinutes = estimateEffortMinutes(event, subject);
    var studied = studiedBySubject[event && event.subjectId] || 0;

    var factors = {
      urgency:
        daysUntil === null ? urgencyFactor(URGENCY_HALF_LIFE * 4) : urgencyFactor(daysUntil),
      risk: riskFactor(subject),
      difficulty: difficultyFactor(subject),
      coverage: coverageFactor(studied, effortMinutes),
      stakes: stakesFactor(event),
    };

    /* La cobertura solo cuenta en la medida en que hay presión de tiempo. No
       haber abierto una asignatura cuyo examen es dentro de un mes es normal;
       no haberla abierto con el examen en tres días, no. Plana, daba a todo
       examen intacto un suelo de 15 puntos independientemente de la distancia. */
    var contributions = {
      urgency: factors.urgency,
      risk: factors.risk,
      difficulty: factors.difficulty,
      coverage: factors.coverage * factors.urgency,
      stakes: factors.stakes,
    };

    var weighted = Object.keys(WEIGHTS).reduce(function (total, key) {
      return total + WEIGHTS[key] * contributions[key];
    }, 0);

    var boost = manualBoost(event);

    return {
      score: clamp(weighted * boost, 0, 100),
      factors: factors,
      contributions: contributions,
      weighted: weighted,
      boost: boost,
      daysUntil: daysUntil,
      isUndated: daysUntil === null,
      isOverdue: daysUntil !== null && daysUntil < 0,
      effortMinutes: effortMinutes,
    };
  }

  /** Mayor score primero; los empates rompen por la fecha más cercana, para que
   *  el orden sea estable. */
  function rankExams(events, subjects, ctx) {
    if (!Array.isArray(events)) return [];
    var byId = {};
    (subjects || []).forEach(function (s) {
      if (s && s.id) byId[s.id] = s;
    });

    return events
      .map(function (event) {
        var detail = computeExamPriority(event, byId[event && event.subjectId] || null, ctx);
        return Object.assign({}, event, { priorityScore: detail.score, priorityDetail: detail });
      })
      .sort(function (a, b) {
        if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
        var aDays = a.priorityDetail.daysUntil;
        var bDays = b.priorityDetail.daysUntil;
        if (aDays === null) return 1;
        if (bDays === null) return -1;
        return aDays - bDays;
      });
  }

  global.SchedioPriority = {
    WEIGHTS: WEIGHTS,
    URGENCY_HALF_LIFE: URGENCY_HALF_LIFE,
    computeExamPriority: computeExamPriority,
    rankExams: rankExams,
    estimateEffortMinutes: estimateEffortMinutes,
    daysBetween: daysBetween,
  };
})(window);
