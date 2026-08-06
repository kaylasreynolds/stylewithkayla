(() => {
  const dialogs = [...document.querySelectorAll("dialog")];
  if (!dialogs.length) return;

  let lockedScrollY = 0;

  const lockPage = () => {
    if (document.body.classList.contains("modal-scroll-locked")) return;

    lockedScrollY = window.scrollY || window.pageYOffset || 0;
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.classList.add("modal-scroll-locked");
  };

  const unlockPage = () => {
    if (!document.body.classList.contains("modal-scroll-locked")) return;

    document.body.classList.remove("modal-scroll-locked");
    document.body.style.top = "";
    window.scrollTo(0, lockedScrollY);
  };

  const syncScrollLock = () => {
    const modalIsOpen = dialogs.some(dialog => dialog.open);
    if (modalIsOpen) {
      lockPage();
    } else {
      unlockPage();
    }
  };

  const observer = new MutationObserver(syncScrollLock);

  dialogs.forEach(dialog => {
    observer.observe(dialog, { attributes: true, attributeFilter: ["open"] });
    dialog.addEventListener("close", syncScrollLock);
    dialog.addEventListener("cancel", syncScrollLock);
  });

  syncScrollLock();
})();
