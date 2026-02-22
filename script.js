document.addEventListener('DOMContentLoaded', () => {

  // ── Mobile Nav Toggle ──
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    navToggle.classList.toggle('active');
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.classList.remove('active');
    });
  });

  // ── Navbar scroll state ──
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  // ── Live Countdown Timer ──
  let totalSeconds = 45 * 60;
  const countdownEl = document.getElementById('countdownTimer');

  function updateCountdown() {
    totalSeconds--;
    if (totalSeconds <= 0) totalSeconds = 45 * 60;
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    countdownEl.textContent =
      String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
  }

  setInterval(updateCountdown, 1000);

  // ── Scroll-triggered Reveal Animations ──
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  const revealSelectors = [
    '.section-label',
    '.section-heading',
    '.concept-grid',
    '.concept-manifesto',
    '.perspectives-intro',
    '.path-card',
    '.scene-card',
    '.deep-header',
    '.deep-scene',
    '.deep-purpose',
    '.deep-trust',
    '.info-box',
    '.deep-cta',
    '.name-content',
    '.contact-intro',
    '.contact-form',
    '.contact-note',
  ];

  const revealEls = document.querySelectorAll(revealSelectors.join(', '));
  revealEls.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${(i % 5) * 0.07}s`;
    revealObserver.observe(el);
  });

  // ── Form Submission → Google Sheets ──
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwjNc6c6Ubv2F9VPDQo4iC6mH2ajznRYIeTNV5xwixJlz2U2fG2fq_dISsh0WzQKmJ-Rw/exec';

  const form = document.getElementById('raiseForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('.btn-submit');
    const originalText = btn.textContent;

    btn.textContent = 'Sending...';
    btn.disabled = true;

    const payload = {
      role: form.role.value,
      name: form.name.value,
      city: form.city?.value || '',
      email: form.email.value,
      message: form.message?.value || ''
    };

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      btn.textContent = 'Sent!';
      btn.style.background = '#22c55e';
      form.reset();
    } catch (err) {
      btn.textContent = 'Error — try again';
      btn.style.background = '#d44040';
    }

    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
      btn.disabled = false;
    }, 3000);
  });

  // ── Smooth Scroll for Anchor Links ──
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 60;
        const position = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: position, behavior: 'smooth' });
      }
    });
  });

});
