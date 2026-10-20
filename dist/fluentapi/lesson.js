const teacher = document.body.dataset.view === 'teacher';
const $ = id => document.getElementById(id);
const esc = text => String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
let scene = 0, listCase = 0, traceStep = 0, showFix = false;
const queryScene = () => { const raw = location.hash.match(/(?:^#|&)scene=(\d+)(?:&|$)/); const n=raw ? Number(raw[1]) : 0; return Math.max(0,Math.min(scenes.length-1,n)); };
const box = (title, text, style='') => `<div class="panel ${style}"><h2>${title}</h2><p>${text}</p></div>`;
const chain = items => `<div class="chain">${items.map((x,i)=>`${i?'<span class="arrow" aria-hidden="true">→</span>':''}<div class="chain-item"><h2>${x[0]}</h2><p>${x[1]}</p></div>`).join('')}</div>`;
const code = text => `<pre><code>${esc(text)}</code></pre>`;
function listTrace() {
  const list = listCase ? ['Анна','Вика','Борис'] : ['Анна','Борис','Вика'];
  const frames = [{list:[...list],info:'Начальный список',i:null}];
  for(let i=0;i<list.length;i++) {
    const name=list[i],remove=name.length<=4;
    if(remove) list.splice(i,1);
    frames.push({list:[...list],info:`i = ${i}: ${name} — ${remove?'удалили':'оставили'}`,i});
  }
  frames.push({list:[...list],info:'Цикл завершён',i:null});
  return frames;
}
function traceHtml() {
  const frames=listTrace(),f=frames[Math.min(traceStep,frames.length-1)];
  const original=listCase?['Анна','Вика','Борис']:['Анна','Борис','Вика'];
  return `<div class="trace-grid"><div>${code(showFix?'names.RemoveAll(name =>\n    name.Length <= 4);':'for (var i = 0; i < names.Count; i++)\n{\n    if (names[i].Length <= 4)\n        names.RemoveAt(i);\n}')}<p class="small">C# · удаляем имена длиной ≤ 4</p></div><div class="trace-board"><div class="trace-label">До цикла</div><div class="chips">${original.map(n=>`<span>${n}</span>`).join('')}</div><div class="trace-label">${showFix?'После RemoveAll':esc(f.info)}</div><div class="chips ${!showFix&&traceStep===frames.length-1&&listCase?'wrong':''}">${(showFix?['Борис']:f.list).map((n,i)=>`<span><small>${i}</small>${n}</span>`).join('')}</div><p class="small">${showFix?'Оба порядка дают один результат.':'Трассировка алгоритма · шаг '+traceStep+' из '+(frames.length-1)}</p></div></div><div class="demo-controls"><button id="stepTrace" ${showFix||traceStep>=frames.length-1?'disabled':''}>Следующий шаг</button><button id="switchList">${listCase?'Вернуть первый список':'Поменять порядок'}</button><button id="toggleFix">${showFix?'Вернуть цикл':'Показать исправление'}</button><button id="resetTrace">Сбросить шаги</button></div>`;
}
function visual(kind) {
 switch(kind) {
 case 'opening':return `<div class="opening"><h1>Fluent API<br><span>ИИ и проекты</span></h1><div class="course-rule"><strong>Домашки</strong><span>ИИ запрещён правилами курса</span><strong>Проект</strong><span>Решение и вопросы по коду</span></div></div>`;
 case 'understand':return `<h1>Понимать свой код</h1><div class="understand"><div class="large-code">input<span>↓</span>твой код<span>↓</span>result</div><div class="verbs"><div>Объяснить</div><div>Проверить</div><div>Изменить</div></div></div>`;
 case 'task':return `<h1>Сначала — задача</h1><div class="timeline"><div class="time-case"><strong>Конфликт</strong><div class="rail"><span class="booking a">10:00–11:00</span></div><div class="rail"><span class="booking b">10:30–11:30</span></div></div><div class="time-case"><strong>Можно</strong><div class="rail"><span class="booking a">10:00–11:00</span></div><div class="rail"><span class="booking c">11:00–12:00</span></div></div></div><p class="footnote">Одна комната. Конец встречи может совпадать с началом следующей.</p>`;
 case 'harness':return `<h1>Как работает агент</h1><div class="harness"><div class="harness-title">Харнесс · среда работы</div><div class="agent-loop"><div class="model"><strong>Модель</strong><p>Выбирает действие</p></div><div class="roundtrip"><span>вызов инструмента →</span><span>← результат</span></div><div class="toolbox"><strong>Инструменты</strong><span>Читать файлы</span><span>Менять код</span><span>Запускать команды</span></div></div><div class="harness-footer"><span>Контекст</span><span>Разрешения</span><span>История работы</span></div></div>`;
 case 'extensions':return `<h1>Скиллы и плагины</h1><div class="extensions"><div class="skill"><h2>Скилл</h2><p>Инструкция для задачи</p>${code('SKILL.md\n\nКак проверить C#-проект\nЧто смотреть в результате')}</div><div class="plugin"><h2>Плагин</h2><p>Устанавливаемый пакет</p><div class="plugin-parts"><div>Скиллы</div><span>и / или</span><div>Подключения<br>к инструментам</div></div></div></div><p class="footnote">Инструкция не выдаёт доступ и не гарантирует правильный результат.</p>`;
 case 'scope':return `<h1>Одно понятное изменение</h1><div class="scope"><div class="vague">«Сделай весь сервис»</div><div class="specific"><strong>Проверка пересечения брони</strong><div class="scope-details"><span>Где создаётся бронь</span><span>Два примера</span><span>Небольшой diff</span></div></div></div>`;
 case 'trace':return `<h1>Один удачный запуск</h1>${traceHtml()}`;
 case 'evidence':return `<h1>Что именно проверили</h1><div class="evidence"><div><span class="check">✓</span><h2>Собралось</h2><p>Типы и зависимости</p></div><div><span class="check">✓</span><h2>Прошёл пример</h2><p>Конкретный вход и результат</p></div><div><span class="check">✓</span><h2>Работает сценарий</h2><p>Действие в приложении</p></div></div><p class="footnote">Разные проверки отвечают на разные вопросы.</p>`;
 case 'workflow':return `<h1>Рабочий шаг с агентом</h1>${chain([['Задача','Поведение и примеры'],['Правка','Понятный diff'],['Проверка','Ожидаемый результат'],['Git','Рабочая версия']])}<div class="repeat">Следующее небольшое изменение ↶</div>`;
 case 'api':return `<h1>Первый ASP.NET API</h1><div class="request-line"><span>POST /expenses</span><code>{ "amount": 500 }</code></div>${chain([['Запрос','Сумма и категория'],['Правило','Сумма > 0'],['Хранение','Новый расход'],['Ответ','201 Created']])}<div class="rejection">amount: −500 <span>→</span> 400 Bad Request</div>`;
 case 'projects':return `<h1>Идеи проектов</h1><div class="project-prompt"><div><span class="project-label">Идея</span><strong>Для кого и зачем</strong></div><div><span class="project-label">Навыки курса</span><strong>Какие решения покажешь</strong></div><div><span class="project-label">Первая версия</span><strong>Один работающий сценарий</strong></div></div>`;
 case 'next':return `<h1>Следующий шаг</h1><div class="next-step"><div class="broad">«Сделать backend»</div><div class="concrete">Создать бронь<br><span>и отклонить пересечение</span></div></div>`;
 case 'printer':return `<h1>ObjectPrinter</h1><div class="printer"><div>${code('Person\n  Name: string\n  Age:  int')}</div><div class="printer-rules"><span>Скрыть свойство</span><span>Изменить формат</span><span>Обрезать строку</span></div></div><div class="type-access"><code>Name → TrimTo(8)</code><code class="unavailable">Age → нет TrimTo</code></div><p class="footnote">Примеры вызовов и интерфейсы · без реализации</p>`;
 }
}
function teacherHtml(s) {
 const section=(title,body)=>`<section><h2>${title}</h2>${body}</section>`;
 const paragraphs=arr=>arr.map(t=>`<p>${esc(t)}</p>`).join('');
 return `<div class="teacher-heading"><span>${esc(s.time)}</span><h1>${esc(s.title)}</h1></div>`+
 section('Что сказать',`<div class="speech">${esc(s.say)}</div>`)+
 section('Для тебя',paragraphs(s.explain))+
 section('Что сделать',`<ol>${s.steps.map(t=>`<li>${esc(t)}</li>`).join('')}</ol>`)+
 section('Вопросы и ответы',s.qa.map(x=>`<details class="qa" open><summary>${esc(x.q)}</summary><p>${esc(x.a)}</p></details>`).join(''))+
 (s.code?section('Пример',`<button id="copyCode" class="copy">Копировать пример</button><span id="copyStatus" role="status"></span>${code(s.code)}<p class="code-note">${s.visual==='printer'?'Проектирование API: реализация принтера здесь отсутствует.':s.visual==='scope'?'Пример запроса к агенту для работы над проектом.':'Полный фрагмент для Program.cs консольного проекта. Веб-трассировка на слайде не запускает C#.'}</p>`):'')+
 (s.answer?`<details class="more"><summary>Один вариант интерфейсов</summary>${code(s.answer)}<p>Это сигнатуры для обсуждения. Реализации печати нет; For намеренно бросает NotImplementedException. Сборка в этой подготовке не запускалась.</p></details>`:'')+
 (s.extra?`<details class="more"><summary>Если нужно подробнее</summary><p>${esc(s.extra)}</p></details>`:'')+
 (s.sources.length?`<details class="more"><summary>Источники</summary><ul>${s.sources.map(([title,url])=>`<li><a href="${esc(url)}" target="_blank" rel="noopener">${esc(title)}</a></li>`).join('')}</ul></details>`:'');
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
 $('stage').innerHTML=teacher?teacherHtml(s):visual(s.visual);
 $('sceneSelect').value=String(scene);
 $('position').textContent=`${scene+1} / ${scenes.length}${s.time.startsWith('Запас')?' · запас':''}`;
 $('prev').disabled=scene===0; $('next').disabled=scene===scenes.length-1;
 $('progress').style.width=((scene+1)/scenes.length*100)+'%';
 document.title=s.title+(teacher?' — конспект':' — C# практика');
 $('otherView').href=(teacher?'index.html':'teacher.html')+'#scene='+scene;
 if(teacher) {
  $('contents').innerHTML=`<p>План пары</p>${scenes.map((x,i)=>`<button data-scene="${i}" ${i===scene?'aria-current="step"':''}><span>${i+1}</span>${esc(x.title)}</button>`).join('')}`;
  for(const btn of $('contents').querySelectorAll('button'))btn.onclick=()=>go(Number(btn.dataset.scene));
  if($('copyCode'))$('copyCode').onclick=async()=>{try{await navigator.clipboard.writeText(s.code);$('copyStatus').textContent='Скопировано';}catch{$('copyStatus').textContent='Выдели код и скопируй вручную';}};
 }
 if(!teacher&&s.visual==='trace') {
  const update=id=>{render();document.getElementById(id)?.focus({preventScroll:true});};
  $('stepTrace').onclick=()=>{traceStep++;update('stepTrace');};
  $('switchList').onclick=()=>{listCase=1-listCase;traceStep=0;showFix=false;update('switchList');};
  $('toggleFix').onclick=()=>{showFix=!showFix;update('toggleFix');};
  $('resetTrace').onclick=()=>{traceStep=0;showFix=false;update('resetTrace');};
 }
 requestAnimationFrame(fit);
}
function go(n) {
 scene=Math.max(0,Math.min(scenes.length-1,n));
 history.replaceState(null,'','#scene='+scene);
 render();window.scrollTo(0,0);
}
$('sceneSelect').innerHTML=scenes.map((s,i)=>`<option value="${i}">${i+1}. ${esc(s.title)}${i===scenes.length-1?' · запас':''}</option>`).join('');
$('sceneSelect').onchange=e=>go(Number(e.target.value));
$('prev').onclick=()=>go(scene-1);$('next').onclick=()=>go(scene+1);
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('position').textContent='Полный экран недоступен в этом окне';}};
addEventListener('keydown',e=>{if(e.target.closest('input,textarea,select,[contenteditable="true"]'))return;if(e.key==='ArrowRight'){e.preventDefault();go(scene+1);}if(e.key==='ArrowLeft'){e.preventDefault();go(scene-1);}});
addEventListener('hashchange',()=>{scene=queryScene();render();window.scrollTo(0,0);});
addEventListener('resize',()=>{if(innerWidth<=700){$('stage').style.transform='';$('stage').style.marginLeft='';$('stage').style.top='';}fit();});
document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'Выйти из полного экрана':'На весь экран';fit();});
scene=queryScene();render();
