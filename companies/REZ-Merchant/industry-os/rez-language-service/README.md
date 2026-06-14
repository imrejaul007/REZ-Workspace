# REZ Language Service

Multi-language Support for Hotel Ecosystem

**Port:** 4028

## Features

- Multi-language support (12 languages)
- Hindi (Primary Indian language)
- Regional Indian languages (Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, Odia)
- Arabic with RTL support
- Dynamic content translation
- Parameter interpolation in translations
- Hotel-specific custom translations
- Language detection from Accept-Language header
- Font loading hints for non-Latin scripts

## Supported Languages

| Code | Language | Native Name | Direction |
|------|----------|-------------|-----------|
| en | English | English | ltr |
| hi | Hindi | हिंदी | ltr |
| ta | Tamil | தமிழ் | ltr |
| te | Telugu | తెలుగు | ltr |
| kn | Kannada | ಕನ್ನಡ | ltr |
| ml | Malayalam | മലയാളം | ltr |
| bn | Bengali | বাংলা | ltr |
| mr | Marathi | मराठी | ltr |
| gu | Gujarati | ગુજરાતી | ltr |
| pa | Punjabi | ਪੰਜਾਬੀ | ltr |
| or | Odia | ଓଡ଼ିଆ | ltr |
| ar | Arabic | العربية | rtl |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/languages | Get supported languages |
| GET | /api/translate/:lang | Get all translations for language |
| POST | /api/translate | Translate single key or batch |
| GET | /api/translate/:lang/:key | Get single translation |
| POST | /api/hotel/config | Configure hotel language settings |
| GET | /api/hotel/config/:hotelId | Get hotel language config |
| POST | /api/hotel/translations | Add custom translations |
| POST | /api/hotel/translations/bulk | Bulk add translations |
| GET | /api/hotel/translations/:hotelId | Get hotel custom translations |
| DELETE | /api/hotel/translations/:translationId | Delete custom translation |
| GET | /api/detect | Detect language from request |
| GET | /api/i18n/:lang | Get i18n bundle for frontend |

## Quick Start

```bash
# Install dependencies
npm install

# Start the service
npm start

# Development mode with hot reload
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4028 | Service port |
| MONGO_URL | mongodb://localhost:27017/rez_language | MongoDB connection string |
