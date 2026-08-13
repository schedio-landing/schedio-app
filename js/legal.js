/**
 * Índice lateral de las páginas legales: marca el apartado que estás leyendo.
 *
 * Sin JS el índice sigue funcionando como lista de enlaces normal; lo único
 * que se pierde es el resaltado.
 */
(function () {
  'use strict';

  var links = document.querySelectorAll('.toc a');
  if (!links.length || !('IntersectionObserver' in window)) return;

  var byId = {};
  var sections = [];

  links.forEach(function (link) {
    var id = (link.getAttribute('href') || '').replace('#', '');
    var section = id && document.getElementById(id);
    if (!section) return;
    byId[id] = link;
    sections.push(section);
  });

  var setCurrent = function (id) {
    links.forEach(function (link) {
      link.classList.toggle('is-current', link === byId[id]);
    });
  };

  /* Se marca el apartado cuyo encabezado ha cruzado la banda superior de la
     ventana. `rootMargin` recorta la mitad de abajo para que no gane el
     apartado que apenas asoma por el pie. */
  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setCurrent(entry.target.id);
      });
    },
    { rootMargin: '-96px 0px -55% 0px', threshold: 0 }
  );

  sections.forEach(function (section) {
    observer.observe(section);
  });

  // En móvil el índice va plegado: al elegir un apartado, se cierra solo.
  var toc = document.querySelector('.toc');
  if (toc && toc.tagName === 'DETAILS') {
    links.forEach(function (link) {
      link.addEventListener('click', function () {
        if (window.matchMedia('(max-width: 859px)').matches) toc.open = false;
      });
    });
  }
})();
