const teacher = document.body.dataset.view === 'teacher';
const $ = id => document.getElementById(id);
const esc = text => String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
let scene = 0;
const queryScene = () => { const raw=location.hash.match(/(?:^#|&)scene=(\d+)(?:&|$)/); return Math.max(0,Math.min(scenes.length-1,raw?Number(raw[1]):0)); };
const chain = items => `<div class="chain">${items.map((x,i)=>`${i?'<span class="arrow" aria-hidden="true">→</span>':''}<div class="card"><h2>${x[0]}</h2><p>${x[1]}</p></div>`).join('')}</div>`;
const cards = items => `<div class="cards">${items.map(x=>`<div class="card"><h2>${x[0]}</h2><p>${x[1]}</p></div>`).join('')}</div>`;
const sourcesHtml = s => `<footer class="sources">${s.sources.map(([t,u])=>`<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>`).join('')}</footer>`;
function visual(kind) {
 switch(kind) {
 case 'overview':return `<p class="eyebrow">ИИ-агенты · вводный обзор</p><h1>От задачи<br>к изменению программы</h1>${chain([['Прочитать','Файлы и задачу'],['Изменить','Код проекта'],['Проверить','Результат работы']])}`;
 case 'harness':return `<h1>Модель и харнесс</h1><div class="harness"><div class="tag">Харнесс — программа, которая ведёт работу</div><div class="agent-loop"><div class="card accent"><h2>Модель</h2><p>Выбирает действие</p></div><div class="roundtrip"><span>вызов →</span><span>← результат</span></div><div class="card"><h2>Инструменты</h2><p>Файлы · команды · сервисы</p></div></div><div class="harness-footer"><span>Контекст</span><span>История</span><span>Разрешения</span></div></div><p class="footnote">Следующий шаг: ещё одно действие или ответ пользователю</p>`;
 case 'context':return `<h1>Контекст: что известно модели</h1><div class="context-flow"><div class="stack"><span>Задача пользователя</span><span>AGENTS.md и документы</span><span>Прочитанный код</span><span>Результаты инструментов</span></div><span class="arrow" aria-hidden="true">→</span><div class="context-window"><h2>Контекст</h2><p>Сведения для следующего шага</p><span class="tag">Размер ограничен</span></div></div>`;
 case 'mcp':return `<h1>MCP: доступ к внешним данным</h1>${chain([['Приложение','Внутри — MCP-клиент'],['MCP-сервер','Предоставляет инструменты'],['Sentry','Сведения об ошибках']])}<div class="return-line">← результат запроса</div><p class="footnote">Открытый протокол · пример из документации MCP</p>`;
 case 'skill':return `<h1>Скилл: как выполнять задачу</h1><div class="skill-flow"><div class="card"><span class="tag">Пример из документации</span><h2>GitHub Fix CI</h2><p>Разобраться с упавшей проверкой</p></div><span class="arrow" aria-hidden="true">→</span><div class="file"><strong>SKILL.md</strong><p>Когда применять<br>Порядок работы<br>Как проверить результат</p><small>+ скрипты и материалы, если нужны</small></div></div><p class="footnote">Сначала название и описание → полная инструкция по необходимости</p>`;
 case 'plugin':return `<h1>Плагин: устанавливаемый пакет</h1><div class="plugin"><span class="tag">ChatGPT / Codex</span><div class="plugin-parts"><div><h2>Скиллы</h2><p>Инструкции</p></div><span>и / или</span><div><h2>MCP-сервер</h2><p>Инструменты и данные</p></div></div></div><p class="footnote">Плагин объединяет компоненты для установки и распространения</p>`;
 case 'prompt':return `<h1>Понятная задача агенту</h1><div class="prompt-grid"><div><span>01</span><h2>Цель</h2><p>Что должно измениться?</p></div><div><span>02</span><h2>Контекст</h2><p>Какие файлы и ошибки важны?</p></div><div><span>03</span><h2>Ограничения</h2><p>Что нужно сохранить?</p></div><div><span>04</span><h2>Готово, когда…</h2><p>Как проверить результат?</p></div></div>`;
 case 'verify':return `<h1>Агенту нужно видеть результат</h1>${cards([['Diff','Что изменилось в коде'],['Проверки','Вывод команд и тестов'],['Поведение','Приложение, логи, метрики']])}<div class="check-loop"><span>Изменение</span><b>→</b><span>Проверка</span><b>→</b><span>Результат</span></div><p class="footnote">Если цель не достигнута — следующий шаг исправления ↶</p>`;
 case 'subagent':return `<h1>Субагент: часть работы отдельно</h1><div class="delegate"><div class="card accent"><h2>Основной агент</h2><p>Общая задача</p></div><div class="roundtrip"><span>подзадача →</span><span>← результат</span></div><div class="harness"><span class="tag">Отдельный контекст</span><h2>Субагент</h2><p class="mini-loop">Модель ⇄ инструменты</p></div></div><p class="footnote">Отдельный контекст ≠ автоматически отдельная копия файлов</p>`;
 case 'coordinator':return `<h1>Координатор и специалисты</h1><div class="org"><div class="user-node">Пользователь</div><div class="vertical-label">задача ↓ &nbsp; ↑ итог</div><div class="coordinator">Координатор</div><svg class="branches" viewBox="0 0 1000 82" aria-hidden="true"><defs><marker id="a" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10" fill="currentColor"/></marker></defs><path d="M480 4V24H164V72"/><path d="M500 4V72"/><path d="M520 4V24H836V72"/><path class="return-path" d="M184 72V42H470V4"/><path class="return-path" d="M520 72V4"/><path class="return-path" d="M856 72V42H540V4"/></svg><div class="specialists"><div>Специалист A</div><div>Специалист B</div><div>Специалист C</div></div><div class="legend"><span>↓ подзадачи</span><span>↑ результаты</span></div></div><p class="footnote">Паттерн agents as tools · итог собирает координатор</p>`;
 case 'choice':return `<h1>Один агент или несколько?</h1><div class="choice"><div><span class="tag">Один</span><h2>Короткая задача</h2><p>Шаги зависят друг от друга<br>Изменяется общий ресурс</p></div><div><span class="tag">Несколько</span><h2>Независимые подзадачи</h2><p>Можно работать параллельно<br>Результаты можно объединить</p></div></div><p class="footnote">Сравниваем качество, общее время и стоимость</p>`;
 }
}
function teacherHtml(s) {
 const section=(t,b)=>`<section><h2>${t}</h2>${b}</section>`;
 return `<div class="teacher-heading"><span>${esc(s.time)}</span><h1>${esc(s.title)}</h1></div>`+
 section('Что сказать',`<div class="speech">${esc(s.say)}</div>`)+
 section('Для тебя',s.explain.map(t=>`<p>${esc(t)}</p>`).join(''))+
 section('На слайде',s.steps.map(t=>`<p>${esc(t)}</p>`).join(''))+
 section('Если спросят',s.qa.map(x=>`<details class="qa" open><summary>${esc(x.q)}</summary><p>${esc(x.a)}</p></details>`).join(''))+
 section(scene===scenes.length-1?'После показа':'Переход к следующему слайду',`<div class="transition">${esc(s.transition)}</div>`)+
 `<details class="more"><summary>Источники и происхождение примеров</summary>${sourcesHtml(s)}<p class="source-note">Реплики — пересказ для устного объяснения, не цитаты. Дата «проверено» обозначает дату сверки документации.</p></details>`+
 (scene===scenes.length-1?'<a class="oral-link" href="oral.html" target="_blank" rel="noopener">После показа: памятка для разговора о проектах →</a>':'');
}
function fit() {
 if(teacher||innerWidth<=700)return;
 const stage=$('stage'); stage.style.transform='none';
 const top=document.querySelector('header').getBoundingClientRect().bottom+14;
 const available=document.querySelector('.bottom').getBoundingClientRect().top-top-18;
 const scale=Math.min((innerWidth-40)/1360,available/stage.offsetHeight,1.5);
 stage.style.top=top+'px'; stage.style.transform=`scale(${scale})`; stage.style.marginLeft=(-680*scale)+'px';
}
function render() {
 const s=scenes[scene];
 $('stage').innerHTML=teacher?teacherHtml(s):visual(s.visual)+sourcesHtml(s);
 $('sceneSelect').value=String(scene);
 $('position').textContent=`${scene+1} / ${scenes.length}`;
 $('prev').disabled=scene===0; $('next').disabled=scene===scenes.length-1;
 $('progress').style.width=((scene+1)/scenes.length*100)+'%';
 document.title=s.title+(teacher?' — конспект':' — C# практика');
 $('otherView').href=(teacher?'index.html':'teacher.html')+'#scene='+scene;
 if(teacher) {
  $('contents').innerHTML=`<p>План пары</p>${scenes.map((x,i)=>`<button data-scene="${i}" ${i===scene?'aria-current="step"':''}><span>${i+1}</span>${esc(x.title)}</button>`).join('')}`;
  for(const btn of $('contents').querySelectorAll('button'))btn.onclick=()=>go(Number(btn.dataset.scene));
 }
 requestAnimationFrame(fit);
}
function go(n) {
 scene=Math.max(0,Math.min(scenes.length-1,n));
 history.replaceState(null,'','#scene='+scene);
 render();window.scrollTo(0,0);
}
$('sceneSelect').innerHTML=scenes.map((s,i)=>`<option value="${i}">${i+1}. ${esc(s.title)}</option>`).join('');
$('sceneSelect').onchange=e=>go(Number(e.target.value));
$('prev').onclick=()=>go(scene-1);$('next').onclick=()=>go(scene+1);
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('position').textContent='Полный экран недоступен в этом окне';}};
addEventListener('keydown',e=>{if(e.target.closest('input,textarea,select,[contenteditable="true"]'))return;if(e.key==='ArrowRight'){e.preventDefault();go(scene+1);}if(e.key==='ArrowLeft'){e.preventDefault();go(scene-1);}});
addEventListener('hashchange',()=>{scene=queryScene();render();window.scrollTo(0,0);});
addEventListener('resize',()=>{if(innerWidth<=700){$('stage').style.transform='';$('stage').style.marginLeft='';$('stage').style.top='';}fit();});
document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'Выйти из полного экрана':'На весь экран';fit();});
scene=queryScene();render();
