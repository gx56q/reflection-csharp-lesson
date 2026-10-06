const scenes = window.experiments;
const editor = document.getElementById('code');
const output = document.getElementById('output');
const runButton = document.getElementById('run');
const runtime = document.getElementById('runtime');
const frame = document.getElementById('runner');
let ready = false, running = false, request = 0;
let selected = 0;
const drafts = scenes.map(scene => scene.code);

function selectScene(index) {
  drafts[selected] = editor.value || drafts[selected];
  selected = index;
  const scene = scenes[index];
  editor.value = drafts[index];
  document.getElementById('scene-title').textContent = scene.title;
  document.getElementById('prompt').textContent = scene.prompt;
  document.getElementById('challenge').textContent = scene.challenge;
  document.getElementById('takeaway').textContent = scene.takeaway;
  document.getElementById('read').href = `conspect.html#${scene.read}`;
  document.querySelectorAll('[role=tab]').forEach((tab, i) => tab.setAttribute('aria-selected', String(i === index)));
  document.getElementById('previous').disabled = index === 0;
  document.getElementById('next').disabled = index === scenes.length - 1;
  showOutput('Сначала предположи, что выведет программа. Потом запускай.', true);
  history.replaceState(null, '', `#experiment-${index + 1}`);
}
function showOutput(text, empty = false) {
  output.textContent = text;
  output.classList.toggle('empty', empty);
}
function updateControls() { runButton.disabled = !ready || running; }
function run() {
  if (!ready || running) return;
  running = true;
  updateControls();
  showOutput('Компилирую и выполняю C#…', true);
  frame.contentWindow.postMessage({type:'csharp-run', id:++request, code:editor.value}, location.origin);
}
for (const [index, scene] of scenes.entries()) {
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('role', 'tab');
  button.setAttribute('aria-controls', 'experiment');
  button.setAttribute('aria-selected', 'false');
  button.textContent = `${index + 1}. ${scene.title}`;
  const label = document.createElement('small');
  label.textContent = `${scene.time} мин · ${scene.topic}`;
  button.append(label);
  button.addEventListener('click', () => selectScene(index));
  document.getElementById('scenes').append(button);
}
runButton.addEventListener('click', run);
document.getElementById('reset').addEventListener('click', () => {
  editor.value = drafts[selected] = scenes[selected].code;
  showOutput('Исходный пример восстановлен. Можно запускать.', true);
});
document.getElementById('break').addEventListener('click', () => {
  const scene = scenes[selected];
  if (!editor.value.includes(scene.breakFrom)) {
    showOutput('Ты уже изменил этот участок. Верни исходный пример, чтобы применить заготовленный поворот.', true);
    return;
  }
  editor.value = editor.value.replace(scene.breakFrom, scene.breakTo);
  showOutput('Код изменён. Предскажи результат и нажми «Запустить C#».', true);
});
document.getElementById('previous').addEventListener('click', () => selectScene(selected - 1));
document.getElementById('next').addEventListener('click', () => selectScene(selected + 1));
editor.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); run(); }
  if (event.key === 'Tab' && !event.shiftKey) {
    event.preventDefault();
    editor.setRangeText('    ', editor.selectionStart, editor.selectionEnd, 'end');
  }
});
document.getElementById('restart').addEventListener('click', () => {
  ready = running = false;
  request++;
  updateControls();
  runtime.className = 'runtime';
  document.getElementById('runtime-text').textContent = 'Перезапускаю .NET…';
  frame.src = 'runner/index.html';
  showOutput('Перезапуск очищает загруженные программы. Твой код в редакторе остаётся.', true);
});
addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
  const message = event.data;
  if (message.type === 'csharp-ready') {
    ready = true;
    runtime.className = 'runtime ready';
    document.getElementById('runtime-text').textContent = '.NET готов. Можно запускать.';
    updateControls();
  }
  if (message.type === 'csharp-error') {
    ready = running = false;
    runtime.className = 'runtime failed';
    document.getElementById('runtime-text').textContent = 'Не удалось загрузить .NET. Попробуй перезапуск.';
    showOutput(message.text);
    updateControls();
  }
  if (message.type === 'csharp-result' && message.id === request) {
    running = false;
    updateControls();
    showOutput(message.text);
  }
});
const initial = Number(location.hash.match(/^#experiment-(\d)$/)?.[1] || 1) - 1;
selectScene(Math.min(Math.max(initial, 0), scenes.length - 1));
