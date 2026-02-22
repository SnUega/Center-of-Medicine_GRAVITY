/**
 * Blog Page Module
 * Главный модуль для страницы блога
 */

import { initNewsletterForm } from './newsletter.js';
export { initNewsletterForm };

/**
 * Инициализация страницы блога
 */
export function initBlogPage() {
  initNewsletterForm();
}
