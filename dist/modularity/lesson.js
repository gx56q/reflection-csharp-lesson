const teacher = document.body.dataset.view === 'teacher';
const $ = id => document.getElementById(id);
const esc = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const bounded = n => Math.max(0,Math.min(scenes.length-1,n));
let current = bounded(Number(location.hash.match(/^#scene=(\d+)$/)?.[1] || 0));
const catalog = '<div class="module catalog"><span class="identifier">Catalog</span><h2>Каталог</h2><p>Товары<br>Варианты<br>Цены</p></div>';
const collaboration = '<div class="module collaboration"><span class="identifier">Collaboration</span><h2>Работа над заказом</h2><p>Черновик<br>Комментарии<br>Согласование</p></div>';
const source = `<a class="source" href="${caseUrl}" target="_blank" rel="noopener">Рабочий случай · Milan Jovanović · 20.06.2026</a>`;
function visual(scene) {
  switch(scene.kind) {
    case 'case': return `<h1>Каталог и работа над заказом</h1><p class="lead">Продавец и покупатель вместе собирают заказ.</p><div class="modules">${catalog}<div class="bridge"><span>Сообщение<br>об изменении</span><b>→</b></div>${collaboration}</div>${source}`;
    case 'requirement': return `<h1>При сохранении<br>нужна верная цена</h1><div class="requirement"><span>Новое требование</span><p>Изменили вариант товара — цена должна быть актуальной при сохранении заказа.</p></div><div class="flow"><div>Выбрать вариант</div><span>→</span><div>Подтвердить цену</div><span>→</span><div>Сохранить заказ</div></div><p class="caption">Схема нужного результата.</p>`;
    case 'connections': return `<h1>Обращений становилось больше</h1><div class="modules tangled">${catalog}<div class="bridge"><span>Изменение каталога <b>→</b></span><span><b>←</b> Запрос вариантов</span><span><b>←</b> Запрос цен</span><span><b>←</b> Проверка цены</span></div>${collaboration}</div><p class="caption">Изменения всё чаще затрагивали обе части.</p>${source}`;
    case 'options': return `<h1>Три варианта для команды</h1><div class="options"><div class="option"><h2>Пересчитать потом</h2><p>Сохранить заказ.<br>Обновить цену отдельно.</p></div><div class="option"><h2>Запросить цену при сохранении</h2><p>Сначала подтвердить цену.<br>Затем записать заказ.</p></div><div class="option"><h2>Общая операция</h2><p>Считать цену и сохранять заказ в одной части программы.</p></div></div><p class="caption">Варианты для обсуждения по этому случаю.</p>`;
    case 'changes': return `<h1>Три задачи в тот же проект</h1><div class="changes"><div>Новый цвет кнопки</div><div>Другая формула цены</div><div>Сохранение только с актуальной ценой</div></div><p class="caption">Учебные изменения на основе рабочего случая.</p>`;
    case 'activity': return `<h1>Шахматы</h1><p class="activity-task">Рефакторинг <code>ChessProblem</code><br>с сохранением поведения.</p><div class="downloads"><a class="primary" href="assets/SRP.Chess.zip" download>Скачать проект</a><a href="${courseUrl}" target="_blank" rel="noopener">Условие в ulearn</a></div><p class="caption">SRP.Chess · .NET 8</p>`;
    default: return '';
  }
}
function notes(scene) {
  const section = (title,text) => text ? `<section><h2>${title}</h2><p>${esc(text)}</p></section>` : '';
  return `<h1>${esc(scene.title)}</h1>`+section('Скажи',scene.say)+section('Покажи',scene.show)+section('Спроси',scene.ask)+section('Ответ',scene.answer)+section('Если группа молчит',scene.help)+(scene.extra ? `<div class="extra">${scene.extra}</div>` : '')+section('Дальше',scene.next)+`<details class="preview"><summary>Посмотреть слайд</summary><div class="visual">${visual(scene)}</div></details>`;
}
function render() {
  const scene=scenes[current];
  $('stage').innerHTML=teacher ? notes(scene) : `<div class="visual">${visual(scene)}</div>`;
  $('sceneSelect').value=current;
  $('prev').disabled=current===0; $('next').disabled=current===scenes.length-1;
  $('position').textContent=`${current+1} / ${scenes.length}`;
  $('otherView').href=`${teacher ? 'index.html' : 'teacher.html'}?v=case-v2#scene=${current}`;
  document.title=`${scene.title} — Модульность${teacher ? ' · конспект' : ''}`;
  if(teacher) $('contents').innerHTML=`<details open><summary>К занятию</summary><p>Показ и конспект листаются отдельно.</p><p>Сначала обсуждение рабочего случая. Затем — «Шахматы», без разбора решения на проекторе.</p><p><a href="${caseUrl}" target="_blank" rel="noopener">Статья — основа случая</a><br><a href="assets/SRP.Chess.zip" download>Заготовка активности</a></p><p>Для проекта нужен SDK .NET 8. Первый запуск может скачивать NuGet-пакеты.</p></details><nav aria-label="План пары">${scenes.map((s,i)=>`<button data-scene="${i}" ${i===current ? 'aria-current="step"' : ''}><span>${i+1}</span>${esc(s.title)}</button>`).join('')}</nav>`;
}
function go(n) {
  const next=bounded(n);
  if(next!==current) location.hash=`scene=${next}`;
}
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-scene]');
  if(button) go(Number(button.dataset.scene));
});
$('sceneSelect').innerHTML=scenes.map((s,i)=>`<option value="${i}">${i+1}. ${esc(s.title)}</option>`).join('');
$('sceneSelect').onchange=event=>go(Number(event.target.value));
$('prev').onclick=()=>go(current-1); $('next').onclick=()=>go(current+1);
$('fullscreen').onclick=async()=>{
  try { document.fullscreenElement ? await document.exitFullscreen() : await document.documentElement.requestFullscreen(); }
  catch { $('position').textContent='Полный экран недоступен в этом окне'; }
};
document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement ? 'Выйти из полного экрана' : 'На весь экран';});
addEventListener('hashchange',()=>{
  current=bounded(Number(location.hash.match(/^#scene=(\d+)$/)?.[1] || 0));
  render(); window.scrollTo(0,0);
});
addEventListener('keydown',event=>{
  if(event.target.closest('select,input,textarea,[contenteditable="true"]')||event.altKey||event.ctrlKey||event.metaKey)return;
  if(event.key==='ArrowRight'){event.preventDefault();go(current+1);}
  if(event.key==='ArrowLeft'){event.preventDefault();go(current-1);}
});
render();
