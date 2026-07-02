/* ============================================================
   leads.js — טפסי הרשמה / צור-קשר שנשמרים למסד (טבלת leads).
   כל <form data-lead="signup"> יטופל אוטומטית. השדות: name/phone/email/message.
   ============================================================ */
(function () {
  'use strict';

  function setMsg(form, text, ok) {
    var box = form.querySelector('[data-lead-msg]');
    if (!box) {
      box = document.createElement('p');
      box.setAttribute('data-lead-msg', '');
      form.appendChild(box);
    }
    box.textContent = text;
    box.classList.toggle('ok', !!ok);
    box.classList.toggle('err', !ok);
  }

  function handle(form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('[type="submit"]');
      var data = {
        name: (form.elements.name && form.elements.name.value || '').trim(),
        phone: (form.elements.phone && form.elements.phone.value || '').trim(),
        email: (form.elements.email && form.elements.email.value || '').trim(),
        message: (form.elements.message && form.elements.message.value || '').trim(),
        source: form.dataset.lead || 'form'
      };
      if (!data.name || (!data.phone && !data.email)) {
        setMsg(form, 'נא למלא שם וטלפון (או אימייל).', false);
        return;
      }
      if (btn) { btn.disabled = true; btn.dataset.txt = btn.textContent; btn.textContent = 'שולח…'; }

      window.whenSB(function (sb) {
        if (!sb) {
          setMsg(form, 'אירעה תקלה זמנית. אפשר לפנות אלינו בוואטסאפ.', false);
          if (btn) { btn.disabled = false; btn.textContent = btn.dataset.txt; }
          return;
        }
        sb.from('leads').insert(data).then(function (res) {
          if (res.error) {
            setMsg(form, 'לא הצלחנו לשלוח כרגע — נסו שוב או פנו בוואטסאפ.', false);
            if (btn) { btn.disabled = false; btn.textContent = btn.dataset.txt; }
            return;
          }
          form.reset();
          setMsg(form, 'תודה! קיבלנו את הפרטים וניצור קשר בהקדם. 🙏', true);
          if (btn) { btn.textContent = 'נשלח ✓'; }
        });
      });
    });
  }

  function init() {
    document.querySelectorAll('form[data-lead]').forEach(handle);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
