const contactForm = document.querySelector('[data-contact-form]');

if (contactForm) {
  const submitButton = contactForm.querySelector('[data-contact-submit]');
  const status = contactForm.querySelector('[data-contact-status]');

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!contactForm.reportValidity()) return;

    submitButton.disabled = true;
    submitButton.textContent = 'Sending…';
    status.className = 'contact-form__status';
    status.textContent = 'Sending your message…';

    const formData = new FormData(contactForm);
    const payload = {
      inquiryType: formData.get('inquiry-type'),
      fullName: formData.get('full-name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      preferredContactMethod: formData.get('contact-method'),
      message: formData.get('message'),
      website: formData.get('website'),
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const fieldErrors = result?.error?.fieldErrors;
        const firstFieldError = fieldErrors && Object.values(fieldErrors)[0];
        throw new Error(firstFieldError || result?.error?.message || 'Your message could not be sent.');
      }

      contactForm.reset();
      status.className = 'contact-form__status contact-form__status--success';
      status.textContent = 'Message received! Thank you for reaching out. I typically respond within 1–2 business days.';
    } catch (error) {
      status.className = 'contact-form__status contact-form__status--error';
      status.textContent = error instanceof Error
        ? error.message
        : 'Your message could not be sent. Please try again.';
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Send Message';
    }
  });
}
