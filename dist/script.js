const projection = document.getElementById('projection');
projection.addEventListener('click', () => {
  const active = document.body.classList.toggle('projection');
  projection.setAttribute('aria-pressed', String(active));
  projection.textContent = active ? 'Вернуть подсказки' : 'Показать студентам';
});
document.getElementById('print').addEventListener('click', () => window.print());
let printDetails = [];
window.addEventListener('beforeprint', () => {
  printDetails = [...document.querySelectorAll('details')].filter(detail => !detail.open);
  printDetails.forEach(detail => { detail.open = true; });
});
window.addEventListener('afterprint', () => {
  printDetails.forEach(detail => { detail.open = false; });
  printDetails = [];
});
for (const block of document.querySelectorAll('pre')) {
  if (document.body.dataset.completeExamples === 'true' && block.dataset.complete !== 'true') continue;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'copy';
  button.textContent = 'Копировать';
  button.setAttribute('aria-label', 'Копировать пример кода');
  button.addEventListener('click', async () => {
    const content = block.querySelector('code').textContent;
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(content);
      button.textContent = 'Скопировано';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(block.querySelector('code'));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      button.textContent = 'Код выделен · Ctrl+C';
    }
    setTimeout(() => { button.textContent = 'Копировать'; }, 2500);
  });
  block.prepend(button);
}
