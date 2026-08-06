(() => {
  const message = document.querySelector("#rsvp-message");
  if (!message) return;

  const confirmation =
    "Thanks for booking! For all appointment details and calendar notifications, check your confirmation email. I can’t wait to see you there!";

  const updateConfirmation = () => {
    if (message.textContent?.trim().startsWith("You’re registered!")) {
      message.textContent = confirmation;
      message.classList.add("rsvp-form__message--success");
    }
  };

  new MutationObserver(updateConfirmation).observe(message, {
    childList: true,
    characterData: true,
    subtree: true,
  });

  updateConfirmation();
})();
