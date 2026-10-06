const examples = window.v2Examples;
const editor = document.getElementById('v2-editor');
const output = document.getElementById('v2-output');
const frame = document.getElementById('v2-runner');
const runButton = document.getElementById('v2-run');
const status = document.getElementById('runtime-state');
let selected = 'step-1', ready = false, running = false, request = 0;
const drafts = {...examples};

function controls() {
  runButton.disabled = !ready || running;
  editor.readOnly = running;
  document.querySelectorAll('[data-demo], #v2-reset').forEach(button => {
    button.disabled = running;
  });
}
function select(key) {
  drafts[selected] = editor.value;
  selected = key;
  editor.value = drafts[key];
  output.textContent = 'Нажми «Запустить C#».';
  document.getElementById('playground').scrollIntoView({behavior:'smooth'});
}
editor.value = examples[selected];
document.querySelectorAll('[data-demo]').forEach(button => {
  button.addEventListener('click', () => select(button.dataset.demo));
});
runButton.addEventListener('click', () => {
  if (!ready || running) return;
  running = true;
  controls();
  output.textContent = 'Компилирую и выполняю C#…';
  frame.contentWindow.postMessage({type:'csharp-run', id:++request, code:editor.value}, location.origin);
});
document.getElementById('v2-reset').addEventListener('click', () => {
  editor.value = drafts[selected] = examples[selected];
  output.textContent = 'Исходный пример восстановлен.';
});
document.getElementById('v2-restart').addEventListener('click', () => {
  ready = running = false;
  request++;
  controls();
  status.textContent = 'Перезапускаю .NET…';
  frame.src = 'runner/index.html?restart=' + Date.now();
});
addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
  const message = event.data;
  if (!message || typeof message !== 'object') return;
  if (message.type === 'csharp-ready') {
    ready = true;
    status.textContent = '.NET готов. Можно запускать.';
  } else if (message.type === 'csharp-error') {
    ready = running = false;
    status.textContent = 'Не удалось загрузить .NET. Можно попробовать перезапуск.';
    output.textContent = String(message.text);
  } else if (message.type === 'csharp-result' && message.id === request) {
    running = false;
    output.textContent = String(message.text || 'Программа завершилась без вывода.');
  }
  controls();
});
