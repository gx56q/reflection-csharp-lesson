const slides = [...document.querySelectorAll('main > section')];
const previous = document.querySelector('#prev');
const next = document.querySelector('#next');
const counter = document.querySelector('#counter');
let current = 0;
function render() {
    current = Math.max(0, slides.findIndex(slide => '#' + slide.id === location.hash));
    slides.forEach((slide, index) => { slide.hidden = index !== current; });
    previous.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    counter.textContent = (current + 1) + ' / ' + slides.length;
    window.scrollTo(0, 0);
}
function move(offset) {
    const target = slides[current + offset];
    if (target) location.hash = target.id;
}
previous.onclick = () => move(-1);
next.onclick = () => move(1);
window.addEventListener('hashchange', render);
document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        move(event.key === 'ArrowLeft' ? -1 : 1);
    }
});
render();
