const testimonialSlider = document.querySelector('[data-testimonial-slider]');

if (testimonialSlider) {
  const slides = Array.from(testimonialSlider.querySelectorAll('[data-testimonial-slide]'));
  const dots = Array.from(testimonialSlider.querySelectorAll('[data-testimonial-dot]'));
  const previousButton = testimonialSlider.querySelector('[data-testimonial-prev]');
  const nextButton = testimonialSlider.querySelector('[data-testimonial-next]');
  let activeIndex = 0;

  const showTestimonial = (nextIndex) => {
    activeIndex = (nextIndex + slides.length) % slides.length;

    slides.forEach((slide, index) => {
      const isActive = index === activeIndex;
      slide.classList.toggle('testimonial-slide--active', isActive);
      slide.hidden = !isActive;
    });

    dots.forEach((dot, index) => {
      const isActive = index === activeIndex;
      dot.classList.toggle('testimonial-dot--active', isActive);
      dot.setAttribute('aria-selected', String(isActive));
    });
  };

  previousButton.addEventListener('click', () => showTestimonial(activeIndex - 1));
  nextButton.addEventListener('click', () => showTestimonial(activeIndex + 1));

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => showTestimonial(index));

    dot.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        const direction = event.key === 'ArrowRight' ? 1 : -1;
        const nextIndex = (index + direction + dots.length) % dots.length;

        dots[nextIndex].focus();
        showTestimonial(nextIndex);
      }
    });
  });
}

// Service detail dialogs
const serviceDialogTriggers = document.querySelectorAll('[data-dialog-open]');
let lastServiceDialogTrigger = null;

serviceDialogTriggers.forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const dialog = document.getElementById(trigger.dataset.dialogOpen);

    if (!dialog || typeof dialog.showModal !== 'function' || dialog.open) return;

    lastServiceDialogTrigger = trigger;
    dialog.showModal();
    document.body.classList.add('service-dialog-open');
  });
});

document.querySelectorAll('.service-dialog').forEach((dialog) => {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener('close', () => {
    document.body.classList.remove('service-dialog-open');

    if (lastServiceDialogTrigger) {
      lastServiceDialogTrigger.focus();
      lastServiceDialogTrigger = null;
    }
  });
});

// Shared legal links for every static public page.
document.querySelectorAll('a[href="#privacy"]').forEach((link) => {
  link.setAttribute('href', '/Legal/privacy');
});

document.querySelectorAll('.site-footer').forEach((footer) => {
  if (footer.nextElementSibling?.classList.contains('site-legal-links')) return;

  const legalLinks = document.createElement('nav');
  legalLinks.className = 'site-legal-links';
  legalLinks.setAttribute('aria-label', 'Legal links');
  legalLinks.style.cssText = [
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'flex-wrap:wrap',
    'gap:10px',
    'margin:0',
    'padding:8px 24px 12px',
    'border-top:1px solid #ddd2ca',
    'background:#fcf9f6',
    'color:#5a5552',
    'font-size:12px',
    'line-height:1.4'
  ].join(';');

  legalLinks.innerHTML = '<a href="/Legal/privacy" style="color:inherit;text-decoration:underline;text-underline-offset:4px">Privacy Policy</a><span aria-hidden="true">|</span><a href="/Legal/terms" style="color:inherit;text-decoration:underline;text-underline-offset:4px">Terms of Use</a>';
  footer.insertAdjacentElement('afterend', legalLinks);
});
