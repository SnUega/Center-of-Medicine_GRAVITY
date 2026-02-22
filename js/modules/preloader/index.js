/**
 * Preloader
 * Чистая GSAP-анимация без setTimeout-цепочек.
 * Порядок событий:
 *  1. fill поднимается снизу (rAF-loop)
 *  2. После readyState=complete → _hide()
 *  3. GSAP timeline: фон гаснет + логотип улетает в hero
 *  4. На t=0.1s → dispatchEvent('preloaderComplete')
 *     (header и ScrollFlow подхватывают его и стартуют свои анимации)
 */

import { $, isMobileDevice} from '../../core/utils.js';
import { lockScroll, unlockScroll } from '../../core/scroll-lock.js';
import { EVENTS } from '../../core/constants.js';
import { gsap, ScrollTrigger } from '../../lib.js';

/* ─── helpers ──────────────────────────────────────────────── */

// isMobileDevice imported from core/utils.js

function blockScroll()   { lockScroll(); }
function unblockScroll() { unlockScroll(); }

/* ─── Preloader ─────────────────────────────────────────────── */

class Preloader {
  constructor() {
    this.el       = null;
    this.fill     = null;
    this.rafId    = null;
    this.progress = 0;
  }

  init() {
    if (!isMobileDevice({ excludeTablet: false })) {
      try { window.history.scrollRestoration = 'manual'; } catch (_) {}
      requestAnimationFrame(() => window.scrollTo(0, 0));
    }

    blockScroll();

    this.el   = $('#preloader');
    this.fill = this.el && this.el.querySelector('.preloader-fill');

    if (!this.el || !this.fill) {
      unblockScroll();
      window.dispatchEvent(new CustomEvent(EVENTS.PRELOADER_COMPLETE));
      return;
    }

    this._preloadImages().then(() => {
      this.rafId = requestAnimationFrame(this._tick);
    });
  }

  _preloadImages() {
    const imgs   = Array.from(this.el.querySelectorAll('.preloader-base, .preloader-progress'));
    const logoBox = this.el.querySelector('.preloader-logo');
    const done   = () => { if (logoBox) logoBox.classList.add('images-loaded'); };

    if (!imgs.length || imgs.every(i => i.complete && i.naturalHeight)) { done(); return Promise.resolve(); }

    return Promise.all(imgs.map(img => new Promise(res => {
      if (img.complete && img.naturalHeight) return res();
      img.onload = img.onerror = res;
    }))).then(done);
  }

  _tick = () => {
    this.progress = Math.min(100, this.progress + 0.5);
    this.fill.style.height = this.progress + '%';

    if (this.progress < 100) {
      this.rafId = requestAnimationFrame(this._tick);
    } else {
      this._waitForReady();
    }
  };

  _waitForReady() {
    const check = () => {
      if (document.readyState === 'complete' &&
          true /* gsap imported */ &&
          true /* ScrollTrigger imported */) {
        this._hide();
      } else {
        setTimeout(check, 80);
      }
    };
    check();
  }

  _hide() {
    if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }

    const logoEl  = this.el.querySelector('.preloader-logo');
    const wordBox = this.el.querySelector('.word-container');
    const content = this.el.querySelector('.preloader-content');
    const heroEl  = document.querySelector('#hero, .hero, section:first-of-type');

    /* fallback без GSAP */
    if (!logoEl || typeof gsap === 'undefined') {
      if (wordBox) this.el.classList.add('word-animate');
      unblockScroll();
      this.el.classList.add('hidden', 'preloader-final');
      this.el.style.setProperty('--bg-opacity', '0');
      window.dispatchEvent(new CustomEvent(EVENTS.PRELOADER_COMPLETE));
      return;
    }

    /* перемещаем в hero */
    if (heroEl) {
      heroEl.appendChild(this.el);
      // Пустая строка для transform — браузер унаследует CSS-значение,
      // а не получит явный 'none' (который мог бы дёрнуть CSS-переходы)
      Object.assign(this.el.style, {
        position: 'absolute', top: '50%', left: '50%',
        zIndex: '1', pointerEvents: 'none', transform: '', margin: '0'
      });
    }

    /* целевые значения */
    const vw          = window.innerWidth;
    const vh          = window.innerHeight;
    const isTabletPro = vw >= 1025 && vw <= 1366;
    const finalScale  = isTabletPro ? 1.27 : 1;
    const logoY       = vh * 0.05;
    const wordY       = isMobileDevice({ excludeTablet: false }) ? -vh * 0.02 : vh * 0.1;
    const contentY    = logoY - vh * 0.08;

    /* начальное состояние — всё одним батчем */
    gsap.set(this.el,   { xPercent: -50, yPercent: -50 });
    gsap.set(logoEl,    { scale: 0.233, y: 0, transformOrigin: 'center center', force3D: true });
    if (content) gsap.set(content, { y: 0, force3D: true });
    if (wordBox)  gsap.set(wordBox,  { y: 0, force3D: true });

    // Один принудительный reflow после всех set — браузер разрешает layout разом
    void this.el.offsetHeight;

    // Промоутим элемент на GPU-слой перед анимацией
    this.el.style.willChange = 'transform, opacity';

    /* главный timeline */
    const tl = gsap.timeline({
      defaults: { ease: 'power2.out', force3D: true },
      onComplete: () => {
        // Снимаем will-change — GPU-слой больше не нужен
        this.el.style.willChange = '';
        this.el.classList.add('hidden', 'preloader-final');
        this.el.style.setProperty('--bg-opacity', '0');
      }
    });

    /* ── t=0.1s: разблокируем скролл, но header intro ещё не запускаем ── */
    tl.call(() => {
      unblockScroll();
    }, null, 0.1);

    if (wordBox) tl.call(() => this.el.classList.add('word-animate'), null, 0.2);

    tl.to(logoEl, { scale: finalScale, y: logoY, duration: 2.0 }, 0)
      .to(this.el, { '--bg-opacity': 0,           duration: 1.6, ease: 'power2.out' }, 0.2);

    if (content) tl.to(content, { y: contentY, duration: 2.0 }, 0);
    if (wordBox)  tl.to(wordBox,  { y: wordY,   duration: 2.0 }, 0);

    /* ── t=1.5s: «почти в конце пути логотипа» — header начинает раскрываться.
       Логотип (power2.out, 2.0s): к t=1.5s прошло 75% времени → ~93% пути → уже почти на месте.
       Фон (power2.out, от t=0.2, 1.6s): к t=1.5s прошло 81% → opacity ≈ 0.11 → практически прозрачен.
       Header разворачивается 0.9s → финиш ≈ t=2.4s (логотип уже замер в t=2.0s). */
    tl.call(() => {
      window.dispatchEvent(new CustomEvent(EVENTS.PRELOADER_COMPLETE));
    }, null, 1.5);
  }
}

/* ─── singleton ─────────────────────────────────────────────── */
let _instance = null;

export function initPreloader() {
  if (_instance) return _instance;
  _instance = new Preloader();
  _instance.init();
  return _instance;
}

if (typeof window !== 'undefined') initPreloader();
