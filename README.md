# Rostov Travel

Мобильное приложение для путешествий по Ростову-на-Дону с персонализированными рекомендациями достопримечательностей и построением маршрутов.

## 📱 О проекте

Rostov Travel — это React Native приложение, которое помогает туристам и жителям города исследовать достопримечательности Ростова-на-Дону. Приложение предоставляет информацию о музеях, театрах, ресторанах, парках, памятниках, церквях и других интересных местах города.

### Основные возможности

- 🔐 **Авторизация пользователей** с безопасным хранением токенов
- 🏛️ **Каталог достопримечательностей** с фильтрацией по категориям:
  - Музеи
  - Театры
  - Рестораны
  - Отели
  - Парки
  - Памятники
  - Церкви
  - Рынки
- 🗺️ **Интерактивная карта** с отображением мест на карте
- 👤 **Профиль пользователя** с настройками интересов
- 🎯 **Персонализация** на основе предпочтений пользователя
- 🛤️ **Конструктор маршрутов** для планирования поездок
- 📍 **Детальная информация** о каждом месте:
  - Описание
  - Адрес
  - Время работы
  - Стоимость посещения
  - Рейтинг и отзывы
  - Ссылки на Яндекс.Карты и 2ГИС
  - Возможность бронирования и покупки билетов
- 🌙 **Темная тема** интерфейса

## 🛠️ Технологии

- **React Native** 0.81.5
- **Expo** 54.0.20
- **TypeScript** 5.9.2
- **React Navigation** 7.x (Native Stack Navigator)
- **React Native Maps** для отображения карт
- **Expo Secure Store** для безопасного хранения данных
- **Expo Linear Gradient** для красивых градиентов
- **React Native DateTimePicker** для работы с датами

## 📋 Требования

- Node.js (версия 14 или выше)
- npm или yarn
- Expo CLI
- Для разработки под iOS: macOS и Xcode
- Для разработки под Android: Android Studio и Android SDK

## 🚀 Установка и запуск

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd rostov-travel
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Запуск проекта

Запуск в режиме разработки:

```bash
npm start
```

Запуск на Android:

```bash
npm run android
```

Запуск на iOS:

```bash
npm run ios
```

Запуск в веб-браузере:

```bash
npm run web
```

## 📂 Структура проекта

```
rostov-travel/
├── assets/               # Ресурсы приложения (иконки, изображения)
├── screens/              # Экраны приложения
│   ├── api.ts           # API функции и типы данных
│   ├── AuthScreen.tsx   # Экран авторизации
│   ├── HomeScreen.tsx   # Главный экран
│   ├── ProfileScreen.tsx           # Профиль пользователя
│   ├── PreferencesScreen.tsx       # Настройки
│   ├── InterestsScreen.tsx         # Выбор интересов
│   ├── AttractionsListScreen.tsx   # Список достопримечательностей
│   ├── AttractionDetailScreen.tsx  # Детали достопримечательности
│   ├── MapScreen.tsx               # Карта с местами
│   ├── RoutesScreen.tsx            # Список маршрутов
│   ├── RouteBuilderScreen.tsx      # Конструктор маршрутов
│   ├── RouteDetailScreen.tsx       # Детали маршрута
│   └── preferencesContext.tsx      # Контекст настроек и состояния
├── App.tsx              # Главный компонент приложения
├── index.ts             # Точка входа
├── app.json             # Конфигурация Expo
├── eas.json             # Конфигурация EAS Build
├── tsconfig.json        # Конфигурация TypeScript
└── package.json         # Зависимости проекта
```

## 🔌 API

Приложение использует REST API для получения данных о достопримечательностях:

- **Базовый URL**: `https://api.heimseweb.ru/api/v1`
- **Эндпоинт мест**: `/places`
- **Аутентификация**: Bearer Token (передается в заголовке Authorization)

### Формат данных

```typescript
type PlaceApi = {
  id: string;
  meta: {
    type?: string;
    id?: string;
    createdAt?: string;
    lastUpdated?: string;
  };
  data: {
    name?: string;
    time?: string;
    description?: string;
    address?: string;
    avgRating?: number;
    location?: string; // "lat,lon"
    price?: string;
    yandexMapsLink?: string;
    twoGisLink?: string;
    bookLink?: string;
    buyTicketsLink?: string;
    reviews?: Array<{ 
      name?: string; 
      review?: string; 
      rating?: number 
    }>;
  };
};
```

## 🎨 Дизайн

Приложение использует темную цветовую схему:
- Фон: `#0B1220`
- Основной цвет: `#2E63E6`
- Текст: `#E6EDF7`
- Границы: `#1C2A45`

## 📱 Сборка для production

### Android

```bash
eas build --platform android
```

### iOS

```bash
eas build --platform ios
```

## 📄 Лицензия

Этот проект распространяется под лицензией 0BSD (Zero-Clause BSD).

## 👨‍💻 Разработка

### Package ID

- **Android**: `com.heimseweb.rostovtravel`

### EAS Project ID

- `cf94d841-0cad-480c-8cd8-3792e654a953`

## 🤝 Участие в разработке

Если вы хотите внести свой вклад в проект:

1. Сделайте Fork репозитория
2. Создайте ветку для новой функции (`git checkout -b feature/AmazingFeature`)
3. Зафиксируйте изменения (`git commit -m 'Add some AmazingFeature'`)
4. Отправьте изменения в ветку (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📞 Контакты

Для вопросов и предложений обращайтесь к разработчикам проекта.

---

Сделано с ❤️ для жителей и гостей Ростова-на-Дону

