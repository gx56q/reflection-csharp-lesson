const teacher = document.body.dataset.view === 'teacher';
const $ = id => document.getElementById(id);
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const bounded = n => Math.max(0, Math.min(scenes.length - 1, n));
let current = bounded(Number(location.hash.match(/^#scene=(\d+)$/)?.[1] || 0));
let variant = 'receiptAfter';
let selectedStatus = 'ok';
let rookMoved = false;
let hintOpen = false;

function highlight(source) {
    return source.split(/(\/\/[^\n]*|\$?"[^"\n]*"|\b(?:public|private|static|return|var|new|if|else|using|decimal|string|bool|record|class|true|false|null)\b|\b\d+(?:\.\d+)?m?\b)/g).map(token => {
        const style = token.startsWith('//') ? 'comment' : token.includes('"') ? 'string' : /^\d/.test(token) ? 'number' : /^(public|private|static|return|var|new|if|else|using|decimal|string|bool|record|class|true|false|null)$/.test(token) ? 'keyword' : '';
        return style ? `<span class="${style}">${esc(token)}</span>` : esc(token);
    }).join('');
}

function code(name, lines = []) {
    return `<div class="codebox"><div class="code-label"><span>C#</span><button type="button" data-copy="${name}">Копировать</button></div><pre tabindex="0"><code>${examples[name].split('\n').map((line, i) => `<span class="code-line${lines.includes(i + 1) ? ' changed' : ''}"><span class="line-number" aria-hidden="true">${i + 1}</span>${highlight(line) || ' '}</span>`).join('')}</code></pre></div>`;
}

function board(rows, path = '') {
    const pieces = {K:'♔',Q:'♕',R:'♖',B:'♗',N:'♘',k:'♚',q:'♛',r:'♜',b:'♝',n:'♞'};
    const cells = rows.flatMap((row, y) => [...row].map((piece, x) => `<rect x="${32 + x * 48}" y="${32 + y * 48}" width="48" height="48" fill="${(x + y) % 2 ? '#9dc4ba' : '#edf4f0'}"/>${pieces[piece] ? `<text x="${56 + x * 48}" y="${57 + y * 48}" dominant-baseline="central" text-anchor="middle" class="piece">${pieces[piece]}</text>` : ''}`)).join('');
    const labels = [...'abcdefgh'].map((x, i) => `<text x="${56 + i * 48}" y="438" text-anchor="middle">${x}</text><text x="16" y="${62 + i * 48}" text-anchor="middle">${8 - i}</text>`).join('');
    return `<svg class="board" role="img" aria-label="${esc(rows.join(' / '))}. K — белый король, k — чёрный; R — ладья, Q — ферзь, B — слон, N — конь; строчные буквы обозначают чёрные фигуры." viewBox="0 0 448 448"><defs><marker id="arrowhead" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6" fill="currentColor"/></marker></defs>${cells}${labels}${path}</svg>`;
}

function visual(scene) {
    switch (scene.kind) {
        case 'intro': return `<h1>Меняем скидку.<br>Формат чека прежний.</h1><div class="flow"><div class="input-node">Покупка<br><strong>1200 ₽</strong></div><span class="arrow">→</span><div class="module green"><span>Расчёт</span><strong>Скидка 10%</strong><small>от 1000 ₽</small></div><span class="arrow">→</span><div class="module blue"><span>Формат</span><strong>Текст чека</strong><small>«К оплате: 1080 ₽»</small></div></div>`;
        case 'receiptBefore': return `<h1>Сумма и текст — вместе</h1>${code('receiptBefore', [5, 6])}<p class="caption">Правило скидки и формат чека меняются по разным причинам.</p>`;
        case 'receiptAfter': return `<h1>Расчёт можно вызвать отдельно</h1><div class="tabs" role="group" aria-label="Варианты изменения"><button data-variant="receiptAfter" aria-pressed="${variant === 'receiptAfter'}">После разделения</button><button data-variant="priceChange" aria-pressed="${variant === 'priceChange'}">Меняется скидка</button><button data-variant="formatChange" aria-pressed="${variant === 'formatChange'}">Меняется текст</button></div>${code(variant, variant === 'receiptAfter' ? [5, 9, 10] : variant === 'priceChange' ? [2] : [4])}<p class="caption">${variant === 'receiptAfter' ? 'Результат прежний. Каждый метод отвечает за свою часть.' : 'Фрагмент для замены одного метода. Остальной код остаётся прежним.'}</p>`;
        case 'regression': return `<h1>На 1200 ₽ всё ещё работает</h1>${code('regression', [2])}<table class="comparison"><thead><tr><th>Покупка</th><th>Было: ≥ 1000</th><th>Стало: &gt; 1000</th></tr></thead><tbody><tr><td>999 ₽</td><td>999 ₽</td><td>999 ₽</td></tr><tr class="failure"><td>1000 ₽</td><td>900 ₽</td><td>1000 ₽</td></tr><tr><td>1200 ₽</td><td>1080 ₽</td><td>1080 ₽</td></tr></tbody></table>`;
        case 'pipeline': return `<h1>Один HTTP-запрос.<br>Несколько отдельных задач.</h1><div class="pipeline"><div class="client">Клиент</div><span class="arrow">→</span><div class="module blue"><span>Журналирование</span><strong>Записать запрос</strong></div><span class="arrow">→</span><div class="module amber"><span>Доступ</span><strong>Можно продолжить?</strong></div><span class="arrow">→</span><div class="module green"><span>Обработчик</span><strong>Посчитать сумму</strong></div></div><div class="return-path">← ответ; обёртки завершают работу в обратном порядке</div><p class="caption">Middleware в ASP.NET Core. Порядок компонентов важен.</p><a class="source" href="${middlewareUrl}" target="_blank" rel="noopener">Microsoft · как устроен конвейер</a>`;
        case 'statuses': {
            const statuses = [['ok','Нет','Есть','Обычная позиция'],['check','Есть','Есть','Шах'],['mate','Есть','Нет','Мат'],['stalemate','Нет','Нет','Пат']];
            return `<h1>Два признака — четыре состояния</h1><div class="status-layout"><div>${board(chessPositions[selectedStatus].rows)}<p class="board-caption">Позиция ${chessPositions[selectedStatus].file} из заготовки · ход белых</p></div><div><table class="status-table"><thead><tr><th>Шах?</th><th>Безопасный ход?</th><th>Статус</th></tr></thead><tbody>${statuses.map(([id, check, moves, label]) => `<tr class="${id === selectedStatus ? 'selected' : ''}"><td>${check}</td><td>${moves}</td><td><button data-status="${id}" aria-pressed="${id === selectedStatus}">${label}<small>${id === 'ok' ? 'Ok' : id === 'check' ? 'Check' : id === 'mate' ? 'Mate' : 'Stalemate'}</small></button></td></tr>`).join('')}</tbody></table><p class="caption">Результат определяем для белой стороны.</p></div></div>`;
        }
        case 'unsafe': {
            const rows = ['k...r...','........','........','........','........','........',rookMoved ? '.....R..' : '....R...','....K...'];
            const arrow = rookMoved ? '<path class="threat" d="M248 92 V363"/><rect class="king-danger" x="226" y="370" width="44" height="44" rx="6"/>' : '<path class="move-arrow" d="M260 344 H289"/>';
            return `<h1>${rookMoved ? 'Ладья ушла. Король под шахом.' : 'Ладья закрывает короля'}</h1><div class="chess-explanation">${board(rows, arrow)}<div><p class="big-note">${rookMoved ? 'Вертикаль открыта.' : 'Своя ладья закрывает короля.'}</p><p>Двигаться вправо ладья умеет.<br>Оставлять короля под шахом нельзя.</p><button class="primary" data-move>${rookMoved ? 'Вернуть ладью' : 'Увести ладью'}</button><p class="caption">Схема: e2 → f2</p></div></div>`;
        }
        case 'temporaryMove': return `<h1>Проверили ход — вернули доску</h1><div class="tabs" role="group" aria-label="Способ временного хода"><button data-variant="manualMove" aria-pressed="${variant === 'manualMove'}">Вручную</button><button data-variant="temporaryMove" aria-pressed="${variant === 'temporaryMove'}">Готовый метод</button></div>${code(variant, variant === 'manualMove' ? [2, 3, 6, 7] : [1])}<div class="mini-flow"><span>Исходная доска</span><b>→</b><span>Пробный ход</span><b>→</b><span>Проверка</span><b>→</b><span>Откат</span></div>`;
        case 'activity': return `<div class="activity-heading"><div><p class="activity-label">Активность курса</p><h1>Шахматы</h1></div><div class="duration"><strong>25</strong><span>минут · в парах</span></div></div><ol class="task-list"><li>Использовать <code>PerformTemporaryMove</code>.</li><li>Передавать цвет вместо привязки к белым.</li><li>Выделить перечисление ходов и проверки.</li><li>Проверить: исходные тесты проходят.</li></ol><div class="download-row"><a class="primary" href="assets/SRP.Chess.zip" download>Скачать проект</a><span>.NET 8 · 109 готовых позиций</span></div><a class="source" href="${courseUrl}" target="_blank" rel="noopener">Условие в ulearn</a>`;
        case 'hints': return `<h1>Один ход: откуда и куда</h1>${hintOpen ? code('allMoves', [1, 2, 9]) : `<div class="move-pair"><div><span>From</span><strong>e2</strong></div><span class="arrow">→</span><div><span>To</span><strong>f2</strong></div></div><p class="caption">GetAllMovesOf(color) возвращает такие ходы выбранной стороны.</p>`}<button class="${hintOpen ? '' : 'primary'}" data-hint>${hintOpen ? 'Скрыть код' : 'Показать пример перечисления'}</button>`;
        case 'solution': return `<h1>Выбор статуса читается отдельно</h1>${code('status', [3, 4])}<p class="caption">Перебор фигур и временные ходы остались внутри проверок.</p>`;
        case 'finish': return `<h1>Расчёт статуса по шагам</h1><div class="method-tree"><div class="root-method">GetStatusFor(color)</div><div class="branches"><div class="module green"><strong>IsCheckFor</strong><span>Атакован ли король?</span></div><div class="module amber"><strong>HasSafeMovesFor</strong><span>Есть ли безопасный ход?</span></div></div><div class="shared-method"><strong>GetAllMovesOf(color)</strong><span>Перечисление ходов используется в обеих проверках.</span></div></div><p class="caption">Здесь достаточно методов внутри ChessProblem.</p><a class="source" href="${boundariesUrl}" target="_blank" rel="noopener">Разбор рабочего проекта · июнь 2026</a>`;
        default: return '';
    }
}

function teacherNotes(scene) {
    const section = (title, text) => `<section><h2>${title}</h2><p>${esc(text)}</p></section>`;
    return `<p class="time">${esc(scene.time)}</p><h1>${esc(scene.title)}</h1>` +
        section('Скажи', scene.say) + section('Покажи', scene.show) +
        section('Спроси', scene.ask) + section('Ответ', scene.answer) +
        section('Если молчат или застряли', scene.help) +
        (scene.code ? `<details><summary>Код для этого шага</summary>${code(scene.code)}</details>` : '') +
        (scene.extra ? `<div class="extra">${scene.extra}</div>` : '') +
        section('Дальше', scene.next) +
        `<details class="preview"><summary>Посмотреть этот слайд</summary><div class="visual">${visual(scene)}</div></details>`;
}

function render() {
    const scene = scenes[current];
    $('stage').innerHTML = teacher ? teacherNotes(scene) : `<div class="visual">${visual(scene)}</div>`;
    $('sceneSelect').value = current;
    $('prev').disabled = current === 0;
    $('next').disabled = current === scenes.length - 1;
    $('position').textContent = `${current + 1} / ${scenes.length}`;
    $('otherView').href = `${teacher ? 'index.html' : 'teacher.html'}#scene=${current}`;
    document.title = `${scene.title} — Модульность${teacher ? ' · конспект' : ''}`;
    if (teacher) {
        $('contents').innerHTML = `<details ${current === 0 ? 'open' : ''}><summary>Перед парой · 60 минут</summary><p>Показ и конспект листаются отдельно.</p><p>0–17 · чек кафе и пример API<br>17–25 · подготовка к шахматам<br>25–50 · работа в парах<br>50–60 · разбор</p><p><a href="assets/SRP.Chess.zip" download>Заготовка</a><br><a href="assets/ChessProblem-reference.cs" download>Решение для тебя</a><br><a href="assets/CafeDemo.zip" download>Примеры с чеком</a></p><p>Перед занятием: SDK .NET 8, распаковать проект и один раз выполнить dotnet run --project Chess.csproj -- --noresult. Первый запуск может скачивать NuGet-пакеты.</p><p>Если настройка затянулась, сократи показ API, сохрани 25 минут активности.</p></details><nav aria-label="План пары">${scenes.map((s, i) => `<button data-scene="${i}" ${i === current ? 'aria-current="step"' : ''}><span>${i + 1}</span>${esc(s.title)}</button>`).join('')}</nav>`;
    }
}

function go(n) {
    const next = bounded(n);
    if (next === current) return;
    location.hash = `scene=${next}`;
}

document.addEventListener('click', async event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.scene !== undefined) go(Number(button.dataset.scene));
    if (button.dataset.copy) {
        try { await navigator.clipboard.writeText(examples[button.dataset.copy]); button.textContent = 'Скопировано'; }
        catch { button.textContent = 'Выдели код вручную'; }
    }
    if (button.dataset.variant) variant = button.dataset.variant;
    if (button.dataset.status) selectedStatus = button.dataset.status;
    if (button.hasAttribute('data-move')) rookMoved = !rookMoved;
    if (button.hasAttribute('data-hint')) hintOpen = !hintOpen;
    if (button.matches('[data-variant],[data-status],[data-move],[data-hint]')) {
        const focusSelector = button.dataset.variant ? `[data-variant="${button.dataset.variant}"]` : button.dataset.status ? `[data-status="${button.dataset.status}"]` : button.hasAttribute('data-move') ? '[data-move]' : '[data-hint]';
        $('stage').querySelector('.visual').innerHTML = visual(scenes[current]);
        $('stage').querySelector(focusSelector)?.focus();
    }
});

$('sceneSelect').innerHTML = scenes.map((s, i) => `<option value="${i}">${i + 1}. ${esc(s.title)}</option>`).join('');
$('sceneSelect').onchange = event => go(Number(event.target.value));
$('prev').onclick = () => go(current - 1);
$('next').onclick = () => go(current + 1);
$('fullscreen').onclick = async () => {
    try { document.fullscreenElement ? await document.exitFullscreen() : await document.documentElement.requestFullscreen(); }
    catch { $('position').textContent = 'Полный экран недоступен в этом окне'; }
};
document.addEventListener('fullscreenchange', () => {
    $('fullscreen').textContent = document.fullscreenElement ? 'Выйти из полного экрана' : 'На весь экран';
});
addEventListener('hashchange', () => {
    current = bounded(Number(location.hash.match(/^#scene=(\d+)$/)?.[1] || 0));
    variant = scenes[current].kind === 'temporaryMove' ? 'manualMove' : 'receiptAfter';
    render(); window.scrollTo(0, 0);
});
addEventListener('keydown', event => {
    if (event.target.closest('select, input, textarea, [contenteditable="true"]') || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); go(current + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); go(current - 1); }
});
variant = scenes[current].kind === 'temporaryMove' ? 'manualMove' : 'receiptAfter';
render();
