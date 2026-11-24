'use strict';
(function () {
  function $(id) { return document.getElementById(id); }
  var form = $('lead');
  var rules = {
    nombre: function (v) { return v.length >= 2 ? '' : 'Escribe tu nombre.'; },
    tel: function (v) { var d = v.replace(/\D/g, ''); return d.length >= 10 ? '' : 'Escribe un celular de 10 dígitos, por ejemplo 713 555 0123.'; },
    objetivo: function (v) { return v ? '' : 'Elige un objetivo para preparar tu evaluación.'; }
  };
  function check(k) {
    var i = $(k), msg = rules[k](i.value.trim()), e = $('err-' + k);
    e.textContent = msg; e.hidden = !msg; i.setAttribute('aria-invalid', String(!!msg));
    if (msg) i.setAttribute('aria-describedby', 'err-' + k); else i.removeAttribute('aria-describedby');
    return !msg;
  }
  Object.keys(rules).forEach(function (k) { $(k).addEventListener('blur', function () { if ($(k).value) check(k); }); });
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var bad = Object.keys(rules).filter(function (k) { return !check(k); });
    if (bad.length) { $(bad[0]).focus(); return; }
    var nombre = $('nombre').value.trim().split(' ')[0], obj = $('objetivo').value, hora = document.querySelector('input[name="hora"]:checked').value;
    $('t-title').textContent = '¡Listo, ' + nombre + '!';
    $('t-text').textContent = 'Apartamos tu semana gratis. Objetivo: ' + obj.toLowerCase() + '. Horario: ' + hora.toLowerCase() + '.';
    $('t-wa').href = 'https://wa.me/?text=' + encodeURIComponent('Hola Forja, soy ' + nombre + '. Quiero mi semana gratis. Objetivo: ' + obj + '. Horario: ' + hora + '.');
    form.hidden = true; var t = $('thanks'); t.hidden = false; t.focus();
  });
  // Botón fijo en móvil: se oculta cuando el formulario está a la vista
  var sticky = $('sticky'), card = $('prueba');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { sticky.classList.toggle('hide', es[0].isIntersecting); }, { threshold: 0.2 }).observe(card);
  }
})();
