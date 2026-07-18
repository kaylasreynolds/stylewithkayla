const pageMetadata = {
  "/": {
    title: "Personal Stylist in Boise | Style with Kayla",
    description: "Complimentary personal styling appointments with Kayla at Macy's Boise Towne Square, personalized around your life, needs, and budget.",
    image: "/images/Hero-image.png",
  },
  "/index.html": {
    title: "Personal Stylist in Boise | Style with Kayla",
    description: "Complimentary personal styling appointments with Kayla at Macy's Boise Towne Square, personalized around your life, needs, and budget.",
    image: "/images/Hero-image.png",
  },
  "/about": {
    title: "About Kayla | Personal Stylist in Boise",
    description: "Meet Kayla, a personal stylist at Macy's Boise Towne Square who offers thoughtful, complimentary styling support.",
    image: "/images/fs.png",
  },
  "/about.html": {
    title: "About Kayla | Personal Stylist in Boise",
    description: "Meet Kayla, a personal stylist at Macy's Boise Towne Square who offers thoughtful, complimentary styling support.",
    image: "/images/fs.png",
  },
  "/events": {
    title: "Upcoming Store Events | Style with Kayla",
    description: "Explore upcoming fashion, beauty, community, and special events at Macy's Boise Towne Square.",
    image: "/images/Hero-image.png",
  },
  "/events.html": {
    title: "Upcoming Store Events | Style with Kayla",
    description: "Explore upcoming fashion, beauty, community, and special events at Macy's Boise Towne Square.",
    image: "/images/Hero-image.png",
  },
  "/womens-styling.html": {
    title: "Women's Styling Services | Style with Kayla",
    description: "Complimentary women's personal styling appointments with Kayla at Macy's Boise Towne Square.",
    image: "/images/womens-hero.jpg",
  },
  "/mens-styling.html": {
    title: "Men's Styling Services | Style with Kayla",
    description: "Complimentary men's personal styling appointments with Kayla at Macy's Boise Towne Square.",
    image: "/images/mens-styling.png",
  },
  "/more-ways.html": {
    title: "More Ways I Can Help | Style with Kayla",
    description: "Explore group styling, store events, nonprofit partnerships, special orders, and other ways Kayla can help.",
    image: "/images/more-ways-hero.webp",
  },
};

function ensureMeta(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.append(element);
  }
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
}

function ensureLink(rel, href) {
  let element = document.head.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.append(element);
  }
  element.setAttribute("href", href);
}

const currentMetadata = pageMetadata[window.location.pathname];
if (currentMetadata) {
  const canonicalPath = window.location.pathname === "/index.html" ? "/" : window.location.pathname;
  const canonicalUrl = new URL(canonicalPath, window.location.origin).href;
  const imageUrl = new URL(currentMetadata.image, window.location.origin).href;

  document.title = currentMetadata.title;
  ensureMeta('meta[name="description"]', { name: "description", content: currentMetadata.description });
  ensureMeta('meta[property="og:title"]', { property: "og:title", content: currentMetadata.title });
  ensureMeta('meta[property="og:description"]', { property: "og:description", content: currentMetadata.description });
  ensureMeta('meta[property="og:image"]', { property: "og:image", content: imageUrl });
  ensureMeta('meta[property="og:url"]', { property: "og:url", content: canonicalUrl });
  ensureMeta('meta[property="og:type"]', { property: "og:type", content: "website" });
  ensureMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
  ensureMeta('meta[name="twitter:title"]', { name: "twitter:title", content: currentMetadata.title });
  ensureMeta('meta[name="twitter:description"]', { name: "twitter:description", content: currentMetadata.description });
  ensureMeta('meta[name="twitter:image"]', { name: "twitter:image", content: imageUrl });
  ensureLink("canonical", canonicalUrl);
}

document.querySelectorAll("img").forEach((image) => {
  if (!image.getAttribute("alt")?.trim()) {
    image.setAttribute("alt", "");
    image.setAttribute("aria-hidden", "true");
  }
});

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

  previousButton?.addEventListener('click', () => showTestimonial(activeIndex - 1));
  nextButton?.addEventListener('click', () => showTestimonial(activeIndex + 1));

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
