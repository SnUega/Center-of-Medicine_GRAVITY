/**
 * Модуль галереи
 * Экспорт галереи изображений
 */

import { Gallery } from './gallery.js';
import { waitForLibrary } from '../../core/utils.js';

/**
 * Данные категорий по умолчанию
 * Реальные фото пока в процессе подготовки — используем имеющиеся снимки
 */
const defaultCategories = {
  "Фасад": [
    "img/IMG_4583.jpg",
    "img/ASH.jpg"
  ],
  "Интерьер": [
    "img/img-placeholder_1.jpg",
    "img/img-placeholder.jpg"
  ],
  "Инъекционная": [
    "img/img-placeholder.jpg",
    "img/img-placeholder_1.jpg"
  ],
  "Косметология": [
    "img/img-placeholder_1.jpg",
    "img/img-placeholder.jpg"
  ],
  "Массаж": [
    "img/img-placeholder.jpg",
    "img/img-placeholder_1.jpg"
  ],
  "Команда": [
    "img/img-placeholder_1.jpg",
    "img/img-placeholder.jpg"
  ],
};

/**
 * Инициализация галереи
 */
let galleryInstance = null;

export function initGallery(options = {}) {
  if (galleryInstance) {
    return galleryInstance;
  }

  // Используем категории по умолчанию, если не указаны
  const finalOptions = {
    categories: defaultCategories,
    defaultCategory: 'Здание',
    ...options
  };

  galleryInstance = new Gallery(finalOptions);

  // Ждем загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      galleryInstance.init();
    });
  } else {
    galleryInstance.init();
  }

  // Экспортируем в window для глобального доступа
  if (typeof window !== 'undefined') {
    window.Gallery = galleryInstance;
  }

  return galleryInstance;
}

