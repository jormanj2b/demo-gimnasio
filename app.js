'use strict';
(function () {
  function $(id) { return document.getElementById(id); }
  // Validación de campos: ayuda a quien escribe y evita datos raros. La protección de verdad es que
  // todo lo que escribe el usuario se muestra con textContent, nunca como HTML.
  var NAME_RE = /^\p{L}(?:[\p{L}\p{M}]|['’ -](?=\p{L}))*$/u;
  function clean(v) { return String(v || '').normalize('NFC').replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028\u2029\uFEFF]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function cleanLong(v) { return String(v || '').normalize('NFC').replace(/[\u0000-\u0009\u000B-\u001F\u007F-\u009F\u200B-\u200F\u2028\u2029\uFEFF]/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim(); }
  function nameMsg(v, min, max, empty) {
    if (!v) return empty;
    if (/[^\p{L}\p{M}\d '’-]/u.test(v)) return 'Usa solo letras, espacios, apóstrofes y guiones (sin símbolos como < > / ; =).';
    if (/\d/.test(v)) return 'El nombre no puede llevar números.';
    if (!NAME_RE.test(v)) return 'Usa solo letras, espacios, apóstrofes y guiones.';
    if (v.length < min) return 'Escribe al menos ' + min + ' letras.';
    if (v.length > max) return 'Máximo ' + max + ' caracteres.';
    return '';
  }
  function phoneMsg(v, min, short) {
    if (/(?!^\+)\D/.test(v)) return 'El teléfono solo lleva números (y + al inicio para el código de país).';
    var d = v.replace(/\D/g, '');
    if (d.length < min) return short;
    if (d.length > 15) return 'Sobran dígitos: revisa el número.';
    return '';
  }
  function textMsg(v, max) {
    if (/[<>]/.test(v)) return 'Sin los signos < y >, por favor.';
    if (max && v.length > max) return 'Máximo ' + max + ' caracteres.';
    return '';
  }
  function isCharMsg(m) { return /números|Usa solo|solo lleva|solo acepta|signos/.test(m); }
  // Valida al escribir solo si hay un carácter no permitido (o si el campo ya estaba marcado), y siempre al salir del campo
  function live(input, rule, show) {
    input.addEventListener('input', function () { var m = rule(input.value); if (input.getAttribute('aria-invalid') === 'true' || isCharMsg(m)) show(m); });
    input.addEventListener('blur', function () { if (input.value) show(rule(input.value)); });
  }
  // Filtro al escribir o pegar: quita lo que no corresponde al tipo de campo y lo avisa.
  var FILTERS = {
    name: [/[^\p{L}\p{M} '’-]/gu, 'Este campo solo acepta letras, espacios, apóstrofes y guiones.'],
    digits: [/\D/g, 'Este campo solo acepta números.'],
    phone: [/(?!^\+)\D/g, 'El teléfono solo acepta números (y + al inicio para el código de país).'],
    user: [/[^A-Za-z0-9._-]/g, 'El usuario solo lleva letras sin acentos, números, puntos y guiones.'],
    text: [/[<>]/g, 'Los signos < y > no están permitidos.']
  };
  function filter(input, kind, show) {
    input.addEventListener('input', function () {
      var k = typeof kind === 'function' ? kind() : kind, f = FILTERS[k];
      if (!f) return;
      var v = input.value, c = v.replace(f[0], '');
      if (c === v) return;
      var pos = Math.max(0, (input.selectionStart || c.length) - (v.length - c.length));
      input.value = c;
      try { input.setSelectionRange(pos, pos); } catch (e) {}
      if (show) show(f[1]);
    });
  }
  // Campos type=number: bloquea e, E, +, -, punto y coma (el navegador sí los deja escribir)
  function digitsOnlyNumber(input) {
    input.addEventListener('keydown', function (e) { if (['e', 'E', '+', '-', '.', ','].indexOf(e.key) > -1) e.preventDefault(); });
    input.addEventListener('paste', function (e) { var t = (e.clipboardData || window.clipboardData).getData('text'); if (/\D/.test(t)) e.preventDefault(); });
  }
  var form = $('lead');
  var rules = {
    nombre: function (v) { return nameMsg(clean(v), 2, 60, 'Escribe tu nombre.'); },
    tel: function (v) { return phoneMsg(clean(v), 10, 'Escribe un celular de 10 dígitos, por ejemplo 7135550123.'); },
    objetivo: function (v) { return v ? '' : 'Elige un objetivo para preparar tu evaluación.'; }
  };
  function show(k, msg) {
    var i = $(k), e = $('err-' + k);
    e.textContent = msg; e.hidden = !msg; i.setAttribute('aria-invalid', String(!!msg));
    if (msg) i.setAttribute('aria-describedby', 'err-' + k); else i.removeAttribute('aria-describedby');
    return !msg;
  }
  function check(k) { var i = $(k); if (i.tagName === 'INPUT') i.value = clean(i.value); return show(k, rules[k](i.value)); }
  Object.keys(rules).forEach(function (k) {
    if ($(k).tagName === 'INPUT') { live($(k), rules[k], function (m) { show(k, m); }); filter($(k), k === 'tel' ? 'phone' : 'name', function (m) { show(k, m); }); }
    else $(k).addEventListener('change', function () { check(k); });
  });
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var bad = Object.keys(rules).filter(function (k) { return !check(k); });
    if (bad.length) { $(bad[0]).focus(); return; }
    var nombre = clean($('nombre').value).split(' ')[0], obj = $('objetivo').value, hora = document.querySelector('input[name="hora"]:checked').value;
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
