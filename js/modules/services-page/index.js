/**
 * Services Page Module
 * Главный модуль для страниц услуг
 */

export { initAccordions, openAccordion, closeAllAccordions } from './accordion.js';
export { initPagePreloader, showPagePreloader } from './page-preloader.js';

/**
 * Инициализация всех компонентов страницы услуг
 * (Прелоадер инициализируется в services-main.js отдельно.)
 */
export function initServicesPage() {
  initAccordions();
}
