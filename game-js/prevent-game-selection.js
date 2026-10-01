// Prevent native long-press selection in the game; retain editing in text fields.
(() => {
  const editable = target => {
    const element = target instanceof Element ? target : target?.parentElement;
    return !!element?.closest('input, textarea') || !!element?.isContentEditable;
  };
  for (const type of ['selectstart', 'contextmenu', 'dragstart']) {
    document.addEventListener(type, event => {
      if (!editable(event.target)) event.preventDefault();
    }, {capture: true});
  }
})();
