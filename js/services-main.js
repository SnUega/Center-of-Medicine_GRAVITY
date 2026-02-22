/**
 * Services Page Main
 * Точка входа для страниц услуг (cosmetology, injections, massage)
 * Модульная архитектура аналогичная main.js
 */

// Импортируем библиотеки ПЕРВЫМ делом (gsap, ScrollTrigger, Lenis)
import './lib.js';
import { waitForLibrary } from './core/utils.js';

// Состояние Lenis для доступа из других модулей
let lenisInstance = null;

/**
 * Получить экземпляр Lenis
 */
export function getLenis() {
  return lenisInstance;
}

/**
 * Инициализация страницы
 */
async function init() {
  try {
    // Ждем загрузки DOM
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      });
    }

    // Этап 0: Быстрый прелоадер
    const { initPagePreloader } = await import('./modules/services-page/page-preloader.js');
    initPagePreloader();

    // Этап 1: Ждем загрузки GSAP (нужен для header анимаций)
    try {
      // gsap available via import
if (window.gsap && window.ScrollTrigger) {
        window.gsap.registerPlugin(window.ScrollTrigger);
      }
      // console.log('✅ GSAP loaded'); // DEBUG: отключено
    } catch (error) {
      // console.warn('GSAP not available, some animations may not work'); // DEBUG: отключено
    }

    // Этап 2: Инициализируем компоненты страницы услуг
    try {
      const { initServicesPage } = await import('./modules/services-page/index.js');
      await initServicesPage();
      // console.log('✅ Services page modules loaded'); // DEBUG: отключено
    } catch (error) {
      console.error('Services page modules error:', error); // Оставляем для реальных ошибок
    }

    // Этап 3: Инициализируем Lenis для плавного скролла через контроллер (как на главной)
    // ВАЖНО: Используем initScrollController вместо прямого создания Lenis
    // Это обеспечивает правильную интеграцию с ScrollTrigger и предотвращает артефакты
    try {
      const { initScrollController } = await import('./modules/scroll/index.js');
      lenisInstance = await initScrollController();
      // console.log('✅ Lenis smooth scroll initialized'); // DEBUG: отключено
    } catch (error) {
      // console.warn('Lenis not available, using native scroll:', error); // DEBUG: отключено
    }

    // Этап 4: Инициализируем меню header
    try {
      const { initHeaderMenu } = await import('./modules/header/index.js');
      initHeaderMenu();
      
      // Интеграция с Lenis - останавливаем скролл при открытии меню
      setupMenuLenisIntegration();
      
      // console.log('✅ Header menu initialized'); // DEBUG: отключено
    } catch (error) {
      // Fallback - простая инициализация меню
      initSimpleMenu();
      // console.warn('Header module not available, using simple menu:', error); // DEBUG: отключено
    }

    // Этап 5: Инициализация модального окна
    initContactModal();

    // Этап 6: Инициализация мобильной подсказки
    initMobileHint();

    // Этап 7: Инициализация ScrollFlow для эффекта раскрытия футера (как на главной)
    try {
      const { initScrollFlow } = await import('./modules/scroll/flow.js');
      initScrollFlow();
      // console.log('✅ ScrollFlow initialized'); // DEBUG: отключено
    } catch (error) {
      // console.warn('ScrollFlow not available:', error); // DEBUG: отключено
    }

    // Этап 8: Управление скроллом hero при появлении контактов
    initHeroScrollBehavior();

    // Этап 9: Инициализация формы контактов
    try {
      const { initContactForm } = await import('./modules/contacts/index.js');
      initContactForm();
      // console.log('✅ Contact form initialized'); // DEBUG: отключено
    } catch (error) {
      // console.warn('Contact form not available:', error); // DEBUG: отключено
    }

    // Этап 10: Инициализация заглушек ориентации
    try {
      const { initOrientationOverlay } = await import('./modules/orientation-overlay.js');
      initOrientationOverlay();
      // console.log('✅ Orientation overlay initialized'); // DEBUG: отключено
    } catch (error) {
      // console.warn('Orientation overlay not available:', error); // DEBUG: отключено
    }

    // console.log('✅ All services page modules loaded'); // DEBUG: отключено

  } catch (error) {
    console.error('Services page initialization error:', error);
  }
}


/**
 * Интеграция меню с Lenis
 */
function setupMenuLenisIntegration() {
  const menu = document.querySelector('.navc-menu');
  
  if (!menu || !lenisInstance) return;
  
  // Наблюдаем за изменением класса active
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        if (menu.classList.contains('active')) {
          lenisInstance.stop();
        } else {
          lenisInstance.start();
        }
      }
    });
  });
  
  observer.observe(menu, { attributes: true });
}

/**
 * Простая инициализация меню (fallback)
 */
function initSimpleMenu() {
  const burger = document.querySelector('.navc-burger');
  const menu = document.querySelector('.navc-menu');
  
  if (!burger || !menu) return;
  
  burger.addEventListener('click', () => {
    const isActive = burger.classList.toggle('active');
    menu.classList.toggle('active');
    document.body.classList.toggle('lock-scroll');
    
    if (lenisInstance) {
      isActive ? lenisInstance.stop() : lenisInstance.start();
    }
  });
  
  // Закрытие по клику на ссылки
  document.querySelectorAll('.navc-links a').forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('active');
      menu.classList.remove('active');
      document.body.classList.remove('lock-scroll');
      
      if (lenisInstance) {
        lenisInstance.start();
      }
    });
  });
}

/**
 * Инициализация модального окна записи
 */
function initContactModal() {
  const modal = document.getElementById('contactModal');
  if (!modal) return;

  const closeBtn = modal.querySelector('.contact-modal-close');
  const form = modal.querySelector('#contactModalForm');
  
  // Открытие модального окна
  document.querySelectorAll('[data-open-modal="contactModal"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(modal);
    });
  });

  // Закрытие по кнопке
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeModal(modal));
  }

  // Закрытие по клику на overlay
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal(modal);
    }
  });

  // Закрытие по Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal(modal);
    }
  });

  // Отправка формы
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
    
    // Валидация в реальном времени
    const nameInput = form.querySelector('#modal-name');
    const phoneInput = form.querySelector('#modal-phone');
    
    if (nameInput) {
      nameInput.addEventListener('blur', () => {
        if (!nameInput.value.trim()) {
          showFieldError(nameInput, 'Пожалуйста, введите ваше имя');
        } else {
          clearFieldError(nameInput);
        }
      });
      nameInput.addEventListener('input', () => {
        if (nameInput.value.trim()) {
          clearFieldError(nameInput);
        }
      });
    }
    
    if (phoneInput) {
      phoneInput.addEventListener('blur', () => {
        if (!phoneInput.value.trim()) {
          showFieldError(phoneInput, 'Пожалуйста, введите номер телефона');
        } else if (!validatePhone(phoneInput.value)) {
          showFieldError(phoneInput, 'Введите корректный номер телефона (российский или белорусский)');
        } else {
          clearFieldError(phoneInput);
        }
      });
      phoneInput.addEventListener('input', () => {
        if (phoneInput.value.trim() && validatePhone(phoneInput.value)) {
          clearFieldError(phoneInput);
        }
      });
    }
  }
}

/**
 * Открыть модальное окно
 */
function openModal(modal) {
  modal.classList.add('active');
  document.body.classList.add('lock-scroll');
  
  if (lenisInstance) {
    lenisInstance.stop();
  }
}

/**
 * Закрыть модальное окно
 */
function closeModal(modal) {
  modal.classList.remove('active');
  document.body.classList.remove('lock-scroll');
  
  if (lenisInstance) {
    lenisInstance.start();
  }
}

/**
 * Валидация российского/белорусского номера телефона
 */
function validatePhone(phone) {
  // Удаляем все символы кроме цифр
  const cleaned = phone.replace(/\D/g, '');
  
  // Российские номера: +7, 8, начинаются с 7 или 8, затем 10 цифр
  // Белорусские номера: +375, начинаются с 375, затем 9 цифр
  const ruPattern = /^[78]\d{10}$/; // 11 цифр: 7 или 8 + 10 цифр
  const byPattern = /^375\d{9}$/; // 12 цифр: 375 + 9 цифр
  
  return ruPattern.test(cleaned) || byPattern.test(cleaned);
}

/**
 * Показать ошибку валидации
 */
function showFieldError(input, message) {
  // Убираем предыдущие ошибки
  const existingError = input.parentElement.querySelector('.field-error');
  if (existingError) {
    existingError.remove();
  }
  
  input.classList.add('error');
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'field-error';
  errorDiv.textContent = message;
  errorDiv.style.color = '#F44336';
  errorDiv.style.fontSize = '0.875rem';
  errorDiv.style.marginTop = '0.25rem';
  input.parentElement.appendChild(errorDiv);
}

/**
 * Убрать ошибку валидации
 */
function clearFieldError(input) {
  input.classList.remove('error');
  const error = input.parentElement.querySelector('.field-error');
  if (error) {
    error.remove();
  }
}

/**
 * Обработка отправки формы
 */
async function handleFormSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const submitBtn = form.querySelector('.form-submit-btn');
  const originalText = submitBtn.textContent;
  
  // Получаем поля
  const nameInput = form.querySelector('#modal-name');
  const phoneInput = form.querySelector('#modal-phone');
  
  // Очищаем предыдущие ошибки
  if (nameInput) clearFieldError(nameInput);
  if (phoneInput) clearFieldError(phoneInput);
  
  let hasErrors = false;
  
  // Валидация имени
  if (!nameInput || !nameInput.value.trim()) {
    if (nameInput) {
      showFieldError(nameInput, 'Пожалуйста, введите ваше имя');
    }
    hasErrors = true;
  }
  
  // Валидация телефона
  if (!phoneInput || !phoneInput.value.trim()) {
    if (phoneInput) {
      showFieldError(phoneInput, 'Пожалуйста, введите номер телефона');
    }
    hasErrors = true;
  } else if (phoneInput && !validatePhone(phoneInput.value)) {
    showFieldError(phoneInput, 'Введите корректный номер телефона (российский или белорусский)');
    hasErrors = true;
  }
  
  // Если есть ошибки, не отправляем форму
  if (hasErrors) {
    // Прокручиваем к первой ошибке
    const firstError = form.querySelector('.error');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstError.focus();
    }
    return;
  }
  
  // Показываем загрузку
  submitBtn.disabled = true;
  submitBtn.textContent = 'Отправка...';
  
  // Собираем данные формы
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  
  try {
    // TODO: Интеграция с backend/CRM
    // await fetch('/api/appointment', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data)
    // });
    
    // Имитация отправки
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Успех
    submitBtn.textContent = 'Отправлено!';
    submitBtn.style.background = 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)';
    
    setTimeout(() => {
      form.reset();
      closeModal(document.getElementById('contactModal'));
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      submitBtn.style.background = '';
    }, 1500);
    
  } catch (error) {
    console.error('Form submission error:', error);
    submitBtn.textContent = 'Ошибка, попробуйте снова';
    submitBtn.style.background = 'linear-gradient(135deg, #F44336 0%, #E91E63 100%)';
    
    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      submitBtn.style.background = '';
    }, 2000);
  }
}

/**
 * Управление поведением hero при скролле
 * Когда секция контактов появляется, hero "шторкой" уезжает влево
 * Оптимизировано для устранения глитчей
 */
function initHeroScrollBehavior() {
  // Определяем, является ли устройство мобильным
  // ВАЖНО: На мобильных hero находится в начале страницы, поэтому триггер должен быть отключен
  const isMobile = window.innerWidth < 768;
  
  // Отключаем анимацию на мобильных
  // На мобильных устройствах flex перестроен, hero находится в начале страницы,
  // и анимация вызывает дергания
  // Для планшетов в вертикальной ориентации показывается заглушка
  if (isMobile) {
    return; // Не инициализируем анимацию на мобильных
  }
  
  const hero = document.querySelector('.services-hero');
  const contactsSection = document.querySelector('#contacts');
  const servicesListWrapper = document.querySelector('.services-list-wrapper');
  const body = document.body;
  
  if (!hero || !contactsSection || !servicesListWrapper) return;

  let isHeroHidden = false;
  let isTransitioning = false;

  // Отслеживаем когда нижняя граница hero и секции услуг совпадает с нижней границей экрана
  const checkHeroVisibility = () => {
    // Не обновляем во время перехода
    if (isTransitioning) return;
    
    const viewportHeight = window.innerHeight;
    const servicesListRect = servicesListWrapper.getBoundingClientRect();
    
    // Общий триггер для скрытия и возвращения - просто сдвигаем его позже
    const triggerOffset = 70; // Отступ для более позднего срабатывания
    const triggerThreshold = viewportHeight - triggerOffset;
    
    // Триггер срабатывания: когда нижняя граница services-list-wrapper (секция с аккордеонами)
    // совпадает со сдвинутым порогом (т.е. верхняя граница контактов начинает появляться)
    const shouldHide = servicesListRect.bottom <= triggerThreshold;
    
    // Триггер обратной анимации: когда нижняя граница services-list-wrapper
    // снова выше сдвинутого порога (т.е. контакты еще не видны)
    const shouldShow = servicesListRect.bottom > triggerThreshold;
    
    if (shouldHide && !isHeroHidden) {
      // Запускаем анимацию скрытия hero
      isTransitioning = true;
      isHeroHidden = true;
      
      requestAnimationFrame(() => {
        hero.classList.add('hero-hiding');
        body.classList.add('contacts-visible');
        
        setTimeout(() => {
          isTransitioning = false;
        }, 500);
      });
    } else if (shouldShow && isHeroHidden) {
      // Запускаем обратную анимацию (показ hero)
      isTransitioning = true;
      isHeroHidden = false;
      
      requestAnimationFrame(() => {
        hero.classList.remove('hero-hiding');
        body.classList.remove('contacts-visible');
        
        setTimeout(() => {
          isTransitioning = false;
        }, 500);
      });
    }
  };

  // Throttled scroll handler для отслеживания позиции services-list-wrapper
  let scrollTicking = false;
  const handleScroll = () => {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(() => {
        checkHeroVisibility();
        scrollTicking = false;
      });
    }
  };
  
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Проверяем при загрузке после небольшой задержки
  setTimeout(checkHeroVisibility, 300);
}

/**
 * Инициализация мобильной подсказки
 */
function initMobileHint() {
  const hint = document.getElementById('mobileHint');
  if (!hint) return;

  let hasScrolled = false;
  
  const hideHint = () => {
    if (!hasScrolled) {
      hasScrolled = true;
      hint.classList.add('hidden');
      
      // Удаляем после анимации
      setTimeout(() => {
        hint.remove();
      }, 300);
    }
  };

  // Скрываем при скролле
  window.addEventListener('scroll', hideHint, { passive: true, once: true });
  
  // Скрываем при касании (для тач-устройств)
  window.addEventListener('touchstart', hideHint, { passive: true, once: true });
  
  // Автоматически скрываем через 5 секунд
  setTimeout(() => {
    hideHint();
  }, 5000);
}

/**
 * Инициализация кликов по мини-статьям блога в меню
 * Переход на страницу статьи или показ toast для заглушек
 */
function initBlogArticleClicks() {
  const articles = document.querySelectorAll('.blog-article, .blog-stub');
  
  articles.forEach(article => {
    article.addEventListener('click', (e) => {
      e.preventDefault();
      
      const slug = article.dataset.slug;
      const isStub = article.classList.contains('blog-stub') || 
                     article.querySelector('.stub-placeholder-icon') ||
                     !slug || slug.startsWith('coming-soon');
      
      if (isStub) {
        showComingSoonToast();
      } else {
        // Переход на страницу статьи (когда будут созданы реальные статьи)
        showComingSoonToast();
        // window.location.href = `article-${slug}.html`;
      }
    });
  });
}

/**
 * Показать toast уведомление "Скоро"
 */
function showComingSoonToast() {
  // Удаляем существующий toast
  const existingToast = document.querySelector('.coming-soon-toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  // Создаем toast
  const toast = document.createElement('div');
  toast.className = 'coming-soon-toast';
  toast.textContent = '📝 Статья скоро будет доступна';
  toast.style.cssText = `
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background: linear-gradient(135deg, #7a00c7 0%, #45c4f9 100%);
    color: #fff;
    padding: 1rem 2rem;
    border-radius: 12px;
    font-weight: 500;
    box-shadow: 0 10px 30px rgba(122, 0, 199, 0.3);
    z-index: 1000;
    opacity: 0;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease;
  `;
  document.body.appendChild(toast);
  
  // Анимация появления
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(-50%) translateY(0)';
    toast.style.opacity = '1';
  });
  
  // Автоматическое скрытие
  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(100px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}

// Запускаем инициализацию
init();

// Инициализация кликов по статьям после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initBlogArticleClicks();
  }, 500);
});
