(function() {
  /* ── INJECT CONTACT EMAIL (bypass Cloudflare obfuscation) ── */
  var ctaContact = document.getElementById('cta-contact');
  if (ctaContact) {
    var u = 'support';
    var d = 'auralayer';
    var t = 'ai';
    ctaContact.textContent = u + '@' + d + '.' + t;
    ctaContact.style.color = 'var(--muted)';
    ctaContact.style.fontFamily = 'var(--fb)';
    ctaContact.style.fontSize = '16px';
    ctaContact.style.marginTop = '12px';
  }



  /* ── NAV ── */
  var cur = 0, total = 10;
  var slides  = document.querySelectorAll('.slide');
  var dotsEl  = document.getElementById('dots');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');

  for (var i = 0; i < total; i++) {
    var d = document.createElement('div');
    d.className = 'dot' + (i === 0 ? ' active' : '');
    (function(n) { d.addEventListener('click', function() { goTo(n); }); })(i);
    dotsEl.appendChild(d);
  }

  prevBtn.addEventListener('click', function() { goTo(cur - 1); });
  nextBtn.addEventListener('click', function() { goTo(cur + 1); });
  prevBtn.disabled = true;

  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(cur + 1);
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goTo(cur - 1);
  });

  function goTo(n) {
    if (n < 0 || n >= total) return;
    if (cur === 2) stopAnim();
    slides[cur].classList.remove('active');
    document.querySelectorAll('.dot')[cur].classList.remove('active');
    cur = n;
    slides[cur].classList.add('active');
    document.querySelectorAll('.dot')[cur].classList.add('active');
    prevBtn.disabled = (cur === 0);
    nextBtn.disabled = (cur === total - 1);
    if (cur === 2) startAnim();
  }

  /* ── SLIDE 3 SLIDER ANIMATION ── */
  var SEQ = [
    [38, 28, 20, 14],
    [55, 20, 15, 10],
    [20, 50, 20, 10],
    [25, 15, 20, 40],
    [38, 28, 20, 14]
  ];
  var seqIdx = 0, loopT = null, stepT = null;

  function setSlider(i, pct, on) {
    var fill  = document.getElementById('fill-'  + i);
    var label = document.getElementById('pct-'   + i);
    var thumb = document.getElementById('thumb-' + i);
    var row   = document.getElementById('tool-row-' + i);
    if (!fill) return;
    fill.style.width = pct + '%';
    if (label) label.textContent = pct + '%';
    if (on) {
      if (thumb) { thumb.style.boxShadow = '0 0 20px rgba(201,168,76,.95),0 0 40px rgba(201,168,76,.5)'; thumb.style.transform = 'scale(1.4)'; }
      if (label) { label.style.color = '#E8C96B'; label.style.fontSize = '24px'; }
      if (row)   { row.style.background = 'rgba(201,168,76,.07)'; row.style.borderRadius = '8px'; }
    } else {
      if (thumb) { thumb.style.boxShadow = '0 0 8px rgba(201,168,76,.4)'; thumb.style.transform = 'scale(1)'; }
      if (label) { label.style.color = 'var(--gold)'; label.style.fontSize = '20px'; }
      if (row)   { row.style.background = 'transparent'; }
    }
  }

  function runSeq(vals, done) {
    var btn = document.getElementById('activate-btn');
    if (btn) btn.style.opacity = '0';
    ['tag-1','tag-2','tag-3'].forEach(function(id) {
      var el = document.getElementById(id); if (el) el.style.opacity = '0.25';
    });
    var step = 0;
    function tick() {
      if (step > 0) setSlider(step - 1, vals[step - 1], false);
      if (step < 4) {
        setSlider(step, vals[step], true);
        step++;
        stepT = setTimeout(tick, 820);
      } else {
        setSlider(3, vals[3], false);
        stepT = setTimeout(function() {
  /* ── INJECT CONTACT EMAIL (bypass Cloudflare obfuscation) ── */
  var ctaContact = document.getElementById('cta-contact');
  if (ctaContact) {
    var u = 'support';
    var d = 'auralayer';
    var t = 'ai';
    ctaContact.textContent = u + '@' + d + '.' + t;
    ctaContact.style.color = 'var(--muted)';
    ctaContact.style.fontFamily = 'var(--fb)';
    ctaContact.style.fontSize = '16px';
    ctaContact.style.marginTop = '12px';
  }


          if (btn) btn.style.opacity = '1';
          setTimeout(function() {
  /* ── INJECT CONTACT EMAIL (bypass Cloudflare obfuscation) ── */
  var ctaContact = document.getElementById('cta-contact');
  if (ctaContact) {
    var u = 'support';
    var d = 'auralayer';
    var t = 'ai';
    ctaContact.textContent = u + '@' + d + '.' + t;
    ctaContact.style.color = 'var(--muted)';
    ctaContact.style.fontFamily = 'var(--fb)';
    ctaContact.style.fontSize = '16px';
    ctaContact.style.marginTop = '12px';
  }

 var t=document.getElementById('tag-1'); if(t) t.style.opacity='1'; }, 0);
          setTimeout(function() {
  /* ── INJECT CONTACT EMAIL (bypass Cloudflare obfuscation) ── */
  var ctaContact = document.getElementById('cta-contact');
  if (ctaContact) {
    var u = 'support';
    var d = 'auralayer';
    var t = 'ai';
    ctaContact.textContent = u + '@' + d + '.' + t;
    ctaContact.style.color = 'var(--muted)';
    ctaContact.style.fontFamily = 'var(--fb)';
    ctaContact.style.fontSize = '16px';
    ctaContact.style.marginTop = '12px';
  }

 var t=document.getElementById('tag-2'); if(t) t.style.opacity='1'; }, 200);
          setTimeout(function() {
  /* ── INJECT CONTACT EMAIL (bypass Cloudflare obfuscation) ── */
  var ctaContact = document.getElementById('cta-contact');
  if (ctaContact) {
    var u = 'support';
    var d = 'auralayer';
    var t = 'ai';
    ctaContact.textContent = u + '@' + d + '.' + t;
    ctaContact.style.color = 'var(--muted)';
    ctaContact.style.fontFamily = 'var(--fb)';
    ctaContact.style.fontSize = '16px';
    ctaContact.style.marginTop = '12px';
  }

 var t=document.getElementById('tag-3'); if(t) t.style.opacity='1'; }, 400);
          if (done) done();
        }, 300);
      }
    }
    tick();
  }

  function loop() {
    runSeq(SEQ[seqIdx], function() {
      loopT = setTimeout(function() {
  /* ── INJECT CONTACT EMAIL (bypass Cloudflare obfuscation) ── */
  var ctaContact = document.getElementById('cta-contact');
  if (ctaContact) {
    var u = 'support';
    var d = 'auralayer';
    var t = 'ai';
    ctaContact.textContent = u + '@' + d + '.' + t;
    ctaContact.style.color = 'var(--muted)';
    ctaContact.style.fontFamily = 'var(--fb)';
    ctaContact.style.fontSize = '16px';
    ctaContact.style.marginTop = '12px';
  }


        seqIdx = (seqIdx + 1) % SEQ.length;
        loop();
      }, 2000);
    });
  }

  function startAnim() {
    stopAnim();
    seqIdx = 0;
    loopT = setTimeout(loop, 500);
  }

  function stopAnim() {
    if (loopT) { clearTimeout(loopT); loopT = null; }
    if (stepT) { clearTimeout(stepT); stepT = null; }
  }

})();
