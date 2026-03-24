(function() {

  /* ── INJECT CONTACT EMAIL (bypass Cloudflare obfuscation) ── */
  var ctaContact = document.getElementById('cta-contact');
  if (ctaContact) {
    var u = 'support', d = 'auralayer', t = 'ai';
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
    if (cur === 2) {
      requestAnimationFrame(function() {
        requestAnimationFrame(function() { startAnim(); });
      });
    }
  }

  /* ══════════════════════════════════════════════════
     SLIDE 3 — REAL-TIME SLIDER ANIMATION
     Numbers count up/down live as the bar moves,
     exactly like the app sliders behave.
  ══════════════════════════════════════════════════ */

  var SEQ = [
    [38, 28, 20, 14],
    [55, 20, 15, 10],
    [20, 50, 20, 10],
    [25, 15, 20, 40],
    [38, 28, 20, 14]
  ];

  var seqIdx   = 0;
  var loopT    = null;
  var rafId    = null;
  var current  = [38, 28, 20, 14]; // live displayed values
  var fromVals = [38, 28, 20, 14]; // animation start values
  var toVals   = [38, 28, 20, 14]; // animation target values
  var activeSlider = -1;           // which slider is currently moving
  var animStart    = null;
  var SLIDE_DUR    = 900;          // ms to move each slider
  var PAUSE_DUR    = 600;          // ms pause between sliders
  var SEQ_PAUSE    = 2000;         // ms pause between full sequences

  /* Apply a value to DOM — slider fill width + number live */
  function applyVal(i, val) {
    var fill  = document.getElementById('fill-' + i);
    var label = document.getElementById('pct-'  + i);
    if (fill)  fill.style.width = val + '%';
    if (label) label.textContent = val + '%';
  }

  /* Highlight the active row */
  function setActive(i, on) {
    var thumb = document.getElementById('thumb-' + i);
    var label = document.getElementById('pct-'   + i);
    var row   = document.getElementById('tool-row-' + i);
    if (on) {
      if (thumb) { thumb.style.boxShadow = '0 0 20px rgba(201,168,76,.95),0 0 40px rgba(201,168,76,.5)'; thumb.style.transform = 'scale(1.3)'; }
      if (label) { label.style.color = '#E8C96B'; label.style.fontWeight = '900'; }
      if (row)   { row.style.background = 'rgba(201,168,76,.07)'; row.style.borderRadius = '8px'; }
    } else {
      if (thumb) { thumb.style.boxShadow = '0 0 8px rgba(201,168,76,.4)'; thumb.style.transform = 'scale(1)'; }
      if (label) { label.style.color = 'var(--gold)'; label.style.fontWeight = '800'; }
      if (row)   { row.style.background = 'transparent'; }
    }
  }

  /* easeInOut curve */
  function ease(t) {
    return t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
  }

  /* Animate one slider from fromVals[i] to toVals[i] */
  function animSlider(i, onDone) {
    if (rafId) cancelAnimationFrame(rafId);
    activeSlider = i;
    setActive(i, true);
    animStart = null;
    var from = fromVals[i];
    var to   = toVals[i];

    function frame(ts) {
      if (!animStart) animStart = ts;
      var elapsed = ts - animStart;
      var progress = Math.min(elapsed / SLIDE_DUR, 1);
      var eased = ease(progress);
      var val = Math.round(from + (to - from) * eased);
      current[i] = val;
      applyVal(i, val);

      if (progress < 1) {
        rafId = requestAnimationFrame(frame);
      } else {
        // Snap to exact target
        current[i] = to;
        applyVal(i, to);
        setActive(i, false);
        activeSlider = -1;
        loopT = setTimeout(onDone, PAUSE_DUR);
      }
    }
    rafId = requestAnimationFrame(frame);
  }

  /* Run one full sequence — animate each slider in turn */
  function runSeq(targets, onDone) {
    var btn = document.getElementById('activate-btn');
    // Only hide button on very first sequence start, keep visible after
    if (btn && seqIdx === 0) btn.style.opacity = '0';
    // Tags stay visible — no dimming between sequences
    ['tag-1','tag-2','tag-3'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.style.opacity = '1';
    });

    // Set from/to for all sliders
    for (var k = 0; k < 4; k++) {
      fromVals[k] = current[k];
      toVals[k]   = targets[k];
    }

    var step = 0;
    function next() {
      if (step >= 4) {
        // All done — show activate button and tags
        if (btn) btn.style.opacity = '1';
        setTimeout(function() { var t=document.getElementById('tag-1'); if(t) t.style.opacity='1'; }, 0);
        setTimeout(function() { var t=document.getElementById('tag-2'); if(t) t.style.opacity='1'; }, 180);
        setTimeout(function() { var t=document.getElementById('tag-3'); if(t) t.style.opacity='1'; }, 360);
        if (onDone) onDone();
        return;
      }
      animSlider(step, function() {
        step++;
        next();
      });
    }
    next();
  }

  function loop() {
    runSeq(SEQ[seqIdx], function() {
      loopT = setTimeout(function() {
        seqIdx = (seqIdx + 1) % SEQ.length;
        loop();
      }, SEQ_PAUSE);
    });
  }

  function startAnim() {
    stopAnim();
    seqIdx  = 0;
    // Start all sliders at 25% so the first animation always has visible movement
    current  = [25, 25, 25, 25];
    fromVals = [25, 25, 25, 25];
    // Reset all sliders instantly to starting position
    for (var i = 0; i < 4; i++) {
      var fill = document.getElementById('fill-' + i);
      var lbl  = document.getElementById('pct-'  + i);
      if (fill) { fill.style.transition = 'none'; fill.style.width = '25%'; }
      if (lbl)  lbl.textContent = '25%';
      setActive(i, false);
    }
    // Jump straight into first blend — no delay, no highlight cycle
    loopT = setTimeout(loop, 200);
  }

  function stopAnim() {
    if (rafId)  { cancelAnimationFrame(rafId); rafId = null; }
    if (loopT)  { clearTimeout(loopT);         loopT = null; }
    if (activeSlider >= 0) { setActive(activeSlider, false); activeSlider = -1; }
  }

})();
