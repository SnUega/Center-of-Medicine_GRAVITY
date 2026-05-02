# Beauty Clinik «Притяжение» — Инструкция по сборке

## Что изменилось

GSAP, Lenis теперь устанавливаются из npm (не CDN).
Swiper убран — он не использовался.
Vite собирает все JS и CSS в оптимизированные бандлы.

## Первый запуск (локально)

Нужен Node.js 18+ и npm.

```bash
# 1. Установить зависимости (один раз)
npm install

# 2. Запустить dev-сервер с hot reload
npm run dev
# → откроется http://localhost:3000
```

## Сборка для деплоя

```bash
npm run build
```

Vite создаст папку `dist/` — её содержимое заливается на хостинг.

## Структура dist/

```
dist/
├── index.html
├── html/
│   ├── cosmetology.html
│   ├── injections.html
│   ├── massage.html
│   ├── blog.html
│   └── article-template.html
├── assets/
│   ├── main-[hash].js        ← весь JS главной страницы
│   ├── vendor-gsap-[hash].js ← GSAP (кэшируется отдельно)
│   ├── vendor-lenis-[hash].js← Lenis (кэшируется отдельно)
│   └── main-[hash].css       ← весь CSS
├── img/
└── ...
```

## Что НЕ меняется для пользователя

- URL остаются прежними
- Яндекс.Карты и Sonline-виджет работают как раньше (внешние скрипты)
- Шрифты Google Fonts — внешние, не затронуты

## Деплой на Timeweb

Залить содержимое папки `dist/` по FTP/SFTP в корень сайта.
Папку `dist/` саму заливать не нужно — только её содержимое.

## Если нужно отлаживать без сборки

Можно временно вернуть CDN-скрипты в HTML и работать напрямую.
Но для production всегда использовать `npm run build`.
