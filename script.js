document.addEventListener('DOMContentLoaded', () => {

  // Mobile nav toggle
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

  // Navbar background on scroll
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.style.borderBottomColor = 'rgba(255,255,255,0.08)';
    } else {
      navbar.style.borderBottomColor = 'rgba(255,255,255,0.06)';
    }
  });

  // Scroll-triggered fade-in animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const animateElements = [
    ...document.querySelectorAll('.section-title'),
    ...document.querySelectorAll('.section-subtitle'),
    ...document.querySelectorAll('.what-is-statements'),
    ...document.querySelectorAll('.timeline'),
    ...document.querySelectorAll('.what-is-description'),
    ...document.querySelectorAll('.for-card'),
    ...document.querySelectorAll('.player-card'),
    ...document.querySelectorAll('.drama-card'),
    ...document.querySelectorAll('.log-entry'),
    ...document.querySelectorAll('.step'),
    ...document.querySelectorAll('.raise-form'),
    ...document.querySelectorAll('.timecode'),
  ];

  animateElements.forEach((el, i) => {
    el.classList.add('fade-in');
    el.style.transitionDelay = `${(i % 6) * 0.08}s`;
    observer.observe(el);
  });

  // Terminal log typing effect
  const logEntries = document.querySelectorAll('.log-entry');
  const logObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const textEl = entry.target.querySelector('.log-text');
        if (textEl && !textEl.dataset.typed) {
          const fullText = textEl.textContent;
          textEl.textContent = '';
          textEl.dataset.typed = 'true';
          let charIndex = 0;
          const typeInterval = setInterval(() => {
            textEl.textContent += fullText[charIndex];
            charIndex++;
            if (charIndex >= fullText.length) clearInterval(typeInterval);
          }, 25);
        }
        logObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  logEntries.forEach(entry => logObserver.observe(entry));

  // Form submission → Google Sheets
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
      artist: form.artist.value,
      city: form.city.value,
      email: form.email.value,
      message: form.message.value
    };

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      btn.textContent = 'Submitted!';
      btn.style.background = '#22c55e';
      form.reset();
    } catch (err) {
      btn.textContent = 'Error — try again';
      btn.style.background = '#ef4444';
    }

    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
      btn.disabled = false;
    }, 3000);
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 64;
        const position = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: position, behavior: 'smooth' });
      }
    });
  });

});
