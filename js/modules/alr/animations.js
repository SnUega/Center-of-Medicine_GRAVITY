/**
 * GSAP анимации для desktop версии ALR
 */

import { getErrorHandler, ERROR_SEVERITY } from '../../core/errors.js';
import { gsap } from '../../lib.js';

/**
 * Inject background decoration into an ALR open panel.
 * - Text/back zone (shutter): hero-style pattern bg
 * - Slider/content zone (contentPanel): large centred logo watermark
 * @param {HTMLElement} el - the panel element
 * @param {'shutter'|'content'} zone - which zone this is
 */
function injectPanelDecor(el, zone = 'content') {
  if (zone === 'shutter') {
    // Single full-bleed pattern — not tiled, like service page hero
    el.style.backgroundImage = `url('img/bg-logo-pattern.JPG')`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    el.style.backgroundRepeat = 'no-repeat';
    el.style.backgroundBlendMode = 'normal';
    // Dark overlay so text stays legible over the pattern
    const overlay = document.createElement('div');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.cssText = `
      position: absolute;
      inset: 0;
      background: rgba(18,18,22,0.52);
      pointer-events: none;
      z-index: 0;
    `;
    el.appendChild(overlay);
  } else {
    // Large logo watermark centred in slider zone
    el.style.background = '#232328';
    const logo = document.createElement('img');
    logo.src = 'img/logo.PNG';
    logo.alt = '';
    logo.setAttribute('aria-hidden', 'true');
    logo.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: min(75%, 480px);
      height: auto;
      opacity: 0.1;
      pointer-events: none;
      z-index: 0;
      filter: grayscale(1);
      user-select: none;
      object-fit: contain;
    `;
    el.appendChild(logo);
  }
}

/**
 * Класс для управления анимациями
 */
export class AnimationsManager {
  constructor(context) {
    this.context = context;
  }

  /**
   * Открытие карточки на desktop
   */
  openCardDesktop(card, cardType) {
    if (cardType === 'reviews') {
      this.openCenterCardSimple(card);
    } else {
      this.context.currentTimeline = gsap.timeline({
        onComplete: () => {
          this.context.isAnimating = false;
        }
      });
      this.openSideCard(card, cardType);
    }
  }

  /**
   * Открытие центральной карточки (Отзывы)
   */
  openCenterCardSimple(card) {
    this.context.cardsManager.resetALRState();
    if (this.context.currentTimeline) {
      this.context.currentTimeline.kill();
    }
    
    this.context.isAnimating = false;
    
    const leftCard = this.context.cards[0];
    const rightCard = this.context.cards[2];
    
    if (this.context.cards && this.context.cards.length > 0) {
      gsap.set(this.context.cards, {
        xPercent: 0,
        x: 0,
        clearProps: 'transform'
      });
    }
    
    if (leftCard) gsap.set(leftCard, { xPercent: 0, zIndex: 10, force3D: true });
    if (rightCard) gsap.set(rightCard, { xPercent: 0, zIndex: 10, force3D: true });
    
    const centerCard = this.context.cards[1];
    
    // Цвета фона центральной карточки (должны совпадать с CSS)
    const centerBg = 'linear-gradient(to bottom, #2E2E33 0%, #35353b 100%)';
    
    // Левая половина
    const leftHalf = document.createElement('div');
    leftHalf.className = 'alr-center-half-left';
    leftHalf.style.cssText = `
      position: absolute;
      top: 0;
      left: 33.333%;
      width: 16.6665%;
      height: 100%;
      background: ${centerBg};
      z-index: 3;
      transform-origin: left center;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      will-change: transform;
    `;
    
    // Правая половина
    const rightHalf = document.createElement('div');
    rightHalf.className = 'alr-center-half-right';
    rightHalf.style.cssText = `
      position: absolute;
      top: 0;
      left: 50%;
      width: 16.6665%;
      height: 100%;
      background: ${centerBg};
      z-index: 3;
      transform-origin: right center;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      will-change: transform;
    `;

    // Клонируем ракету в каждую половину для визуальной непрерывности
    const rocketSrc = centerCard.querySelector('.alr-card-rocket');
    const makeRocketClone = (isLeft) => {
      if (!rocketSrc) return null;
      const r = document.createElement('img');
      r.src = rocketSrc.src;
      r.setAttribute('aria-hidden', 'true');
      // Половина — это 1/6 общей ширины секции, ракета занимает 100% центральной карточки (1/3)
      // Чтобы отрезок ракеты выглядел как часть целой: шириной 300% и смещённый
      r.style.cssText = `
        position: absolute;
        top: 0;
        left: ${isLeft ? '-200%' : '0'};
        width: 300%;
        height: 100%;
        object-fit: cover;
        object-position: center top;
        opacity: 0.55;
        pointer-events: none;
        user-select: none;
        mix-blend-mode: luminosity;
      `;
      return r;
    };
    const rLeft  = makeRocketClone(true);
    const rRight = makeRocketClone(false);
    if (rLeft)  leftHalf.appendChild(rLeft);
    if (rRight) rightHalf.appendChild(rRight);

    // Тёмный overlay поверх ракеты (как в CSS ::after центральной карточки)
    const makeOverlay = () => {
      const ov = document.createElement('div');
      ov.setAttribute('aria-hidden', 'true');
      ov.style.cssText = `
        position: absolute;
        inset: 0;
        background: linear-gradient(to top, rgba(30,30,35,0.7) 0%, rgba(30,30,35,0.2) 60%, transparent 100%);
        pointer-events: none;
        z-index: 1;
      `;
      return ov;
    };
    leftHalf.appendChild(makeOverlay());
    rightHalf.appendChild(makeOverlay());
    
    // Копируем контент
    const centerContent = centerCard.querySelector('.alr-main-content');
    if (centerContent) {
      const leftContent = centerContent.cloneNode(true);
      const rightContent = centerContent.cloneNode(true);
      
      leftContent.style.cssText = `
        position: absolute;
        top: 50%;
        left: 0;
        transform: translateY(-50%);
        width: 200%;
        text-align: center;
        padding: 0 20px;
        box-sizing: border-box;
        z-index: 2;
      `;
      
      rightContent.style.cssText = `
        position: absolute;
        top: 50%;
        left: -100%;
        transform: translateY(-50%);
        width: 200%;
        text-align: center;
        padding: 0 20px;
        box-sizing: border-box;
        z-index: 2;
      `;
      
      const leftH3 = leftContent.querySelector('h3');
      const rightH3 = rightContent.querySelector('h3');
      
      if (leftH3) {
        leftH3.style.cssText = `
          font-size: 32px;
          font-weight: 400;
          margin-bottom: 24px;
          color: #F5F0EB;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-top: 0;
          padding: 0;
          line-height: 1.2;
        `;
      }
      
      if (rightH3) {
        rightH3.style.cssText = `
          font-size: 32px;
          font-weight: 400;
          margin-bottom: 24px;
          color: #F5F0EB;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-top: 0;
          padding: 0;
          line-height: 1.2;
        `;
      }
      
      leftHalf.appendChild(leftContent);
      rightHalf.appendChild(rightContent);
    }
    
    this.context.wrap.appendChild(leftHalf);
    this.context.wrap.appendChild(rightHalf);
    this.context.tempLayers.push(leftHalf, rightHalf);
    
    if (centerContent) {
      gsap.set(centerContent, { opacity: 0 });
    }
    
    this.context.currentTimeline = gsap.timeline({
      onComplete: () => {
        this.context.isAnimating = false;
      }
    });
    
    const panel = document.createElement('div');
    panel.className = 'alr-content-panel alr-reviews-panel';
    panel.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 2;
      background: #232328;
      pointer-events: auto;
      overflow: hidden;
      opacity: 1;
      will-change: opacity;
    `;
    injectPanelDecor(panel, 'content');
    
    const carousel = this.context.reviewsManager.createReviewsCarousel();
    panel.appendChild(carousel);
    gsap.set(carousel, { clipPath: 'inset(0 0 0 0)' });
    this.context.wrap.appendChild(panel);
    this.context.tempLayers.push(panel);
    
    this.context.currentTimeline
      .to(leftCard, {
        xPercent: -100,
        duration: .7,
        ease: 'power2.out',
        force3D: true
      })
      .to(rightCard, {
        xPercent: 100,
        duration: .7,
        ease: 'power2.out',
        force3D: true
      }, 0)
      .to(leftHalf, {
        x: '-305%',
        duration: 1.3,
        ease: 'power2.out',
        force3D: true
      }, 0)
      .to(rightHalf, {
        x: '305%',
        duration: 1.3,
        ease: 'power2.out',
        force3D: true
      }, 0)
      .set(this.context.wrap, { gridTemplateColumns: '0fr 1fr 0fr' }, 2.2);
    
    const backBtn = panel.querySelector('.alr-reviews-back');
    if (backBtn) backBtn.addEventListener('click', () => this.context.cardsManager.closeCard());
  }

  /**
   * Открытие боковой карточки
   */
  openSideCard(card, cardType) {
    const isLeft = cardType === 'awards';
    const otherCards = this.context.cards ? Array.from(this.context.cards).filter(c => c !== card && c != null) : [];
    
    this.context.wrap.classList.add('alr-animating');
    if (otherCards && otherCards.length > 0) {
      gsap.set(otherCards, { zIndex: 6 });
    }
    
    const shutter = document.createElement('div');
    shutter.className = 'alr-shutter';
    shutter.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #232328;
      z-index: 10;
      clip-path: ${isLeft ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)'};
      pointer-events: auto;
      padding: 40px;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
      text-align: center;
    `;
    injectPanelDecor(shutter, 'shutter');
    
    const detailContent = card.querySelector('.alr-detail-content');
    if (detailContent) {
      shutter.innerHTML = detailContent.innerHTML;
      // Wrap content in a z-indexed layer above the watermark
      const contentWrap = document.createElement('div');
      contentWrap.style.cssText = 'position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;width:100%;height:100%;';
      Array.from(shutter.children).forEach(c => contentWrap.appendChild(c));
      shutter.appendChild(contentWrap);
      
      const backBtn = shutter.querySelector('[data-action="close"]');
      if (backBtn) {
        backBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.context.cardsManager.closeCard();
        });
      }
    }
    
    card.appendChild(shutter);
    this.context.tempLayers.push(shutter);
    
    const contentPanel = document.createElement('div');
    contentPanel.className = 'alr-content-panel';
    
    if (isLeft) {
      contentPanel.style.cssText = `
        position: absolute;
        top: 0;
        left: 33.333%;
        height: 100%;
        z-index: 4;
        background: #232328;
        pointer-events: auto;
        width: 66.667%;
        overflow: hidden;
      `;
      contentPanel.classList.add('align-left');
    } else {
      contentPanel.style.cssText = `
        position: absolute;
        top: 0;
        right: 33.333%;
        height: 100%;
        z-index: 4;
        background: #232328;
        pointer-events: auto;
        width: 66.667%;
        overflow: hidden;
      `;
      contentPanel.classList.add('align-right');
    }
    injectPanelDecor(contentPanel, 'content');
    
    const sliderData = this.context.getSliderData(cardType);
    contentPanel.innerHTML = this.context.slidersManager.createSliderHTML(cardType, sliderData);
    this.context.wrap.appendChild(contentPanel);
    this.context.tempLayers.push(contentPanel);

    const panelStart = 0.4;

    if (!shutter || !contentPanel) {
      const errorHandler = getErrorHandler();
      errorHandler.handle(new Error('Failed to create shutter or contentPanel'), {
        module: 'alr-animations',
        severity: ERROR_SEVERITY.MEDIUM,
        context: { action: 'openCardDesktop', cardType },
        userMessage: null
      });
      this.context.isAnimating = false;
      return;
    }
    
    this.context.currentTimeline = gsap.timeline();
    
    this.context.currentTimeline.to(shutter, {
      clipPath: isLeft ? 'inset(0 0% 0 0)' : 'inset(0 0 0 0%)',
      duration: 0.4,
      ease: this.context.EASE,
      force3D: true
    }, 0);
    
    if (otherCards && Array.isArray(otherCards) && otherCards.length > 0) {
      const validCards = otherCards.filter(card => card && card.nodeType === 1);
      if (validCards.length > 0) {
        this.context.currentTimeline.to(validCards, {
          xPercent: isLeft ? 200 : -200,
          duration: 0.8,
          ease: this.context.EASE,
          force3D: true
        }, panelStart);
      }
    }
    
    this.context.slidersManager.setupSliderNavigation(contentPanel, cardType);
    
    this.context.currentTimeline.call(() => {
      if (this.context.wrap) {
        this.context.wrap.classList.remove('alr-animating');
      }
      if (otherCards && otherCards.length > 0) {
        gsap.set(otherCards, { clearProps: 'zIndex' });
      }
      if (contentPanel) {
        const sliderRoot = contentPanel.querySelector('.alr-slider-content');
        if (sliderRoot) {
          const event = new Event('resize');
          window.dispatchEvent(event);
        }
      }
    }, 1.2);
    
    this.context.currentTimeline.call(() => {
      this.context.isAnimating = false;
    }, 1.1);
  }

  /**
   * Закрытие карточки на desktop
   */
  closeCardDesktop() {
    if (this.context.activeCard && this.context.activeCard.dataset.card === 'reviews') {
      const leftCard = this.context.cards[0];
      const rightCard = this.context.cards[2];
      const leftHalf = document.querySelector('.alr-center-half-left');
      const rightHalf = document.querySelector('.alr-center-half-right');
      
      this.context.currentTimeline = gsap.timeline({
        onComplete: () => {
          if (this.context.cards && this.context.cards.length > 0) {
            gsap.set(this.context.cards, {
              xPercent: 0,
              x: 0,
              clearProps: 'transform,zIndex'
            });
          }
          
          if (leftHalf) gsap.set(leftHalf, { x: 0, clearProps: 'transform' });
          if (rightHalf) gsap.set(rightHalf, { x: 0, clearProps: 'transform' });
          
          const centerCard = this.context.cards[1];
          const centerContent = centerCard.querySelector('.alr-main-content');
          if (centerContent) {
            gsap.set(centerContent, { opacity: 1 });
          }
          
          this.context.cardsManager.cleanupAfterClose();
          this.context.isAnimating = false;
        }
      });
      
      this.context.currentTimeline
        .set(this.context.wrap, { gridTemplateColumns: '1fr 1fr 1fr' }, 0)
        .to(leftHalf, {
          x: 0,
          duration: 1.55,
          ease: 'power2.out',
          force3D: true
        }, 0)
        .to(rightHalf, {
          x: 0,
          duration: 1.55,
          ease: 'power2.out',
          force3D: true
        }, 0)
        .to(leftCard, {
          xPercent: 0,
          duration: 1.0,
          ease: 'power2.out',
          force3D: true
        }, 0)
        .to(rightCard, {
          xPercent: 0,
          duration: 1.0,
          ease: 'power2.out',
          force3D: true
        }, 0);
      
      return;
    }

    if (this.context.currentTimeline) {
      this.context.currentTimeline.reverse();
      this.context.currentTimeline.eventCallback('onReverseComplete', () => {
        this.context.cardsManager.cleanupAfterClose();
      });
      this.context.currentTimeline.eventCallback('onReverseStart', () => {
        const card = this.context.activeCard;
        const otherCards = this.context.cards ? Array.from(this.context.cards).filter(c => c !== card && c != null) : [];
        if (this.context.wrap) {
          this.context.wrap.classList.add('alr-animating');
        }
        if (otherCards && otherCards.length > 0) {
          gsap.set(otherCards, { zIndex: 6 });
        }
      });
    } else {
      this.context.cardsManager.cleanupAfterClose();
    }
  }
}

