/**
 * Weather-Based Suggestions Service
 *
 * Provides contextual menu suggestions based on weather conditions:
 * - Hot weather: cold drinks, salads, ice cream
 * - Cold weather: hot soup, tea, warm foods
 * - Rainy day: hot beverages, comfort food
 * - Pleasant weather: outdoor-friendly items
 */

import { MenuItem } from '@/lib/types';

export type WeatherCondition =
  | 'hot'
  | 'cold'
  | 'rainy'
  | 'cloudy'
  | 'pleasant'
  | 'unknown';

export interface WeatherData {
  condition: WeatherCondition;
  temperature: number; // in Celsius
  humidity: number; // percentage
  description: string;
  icon: string;
  location: string;
  fetchedAt: string;
}

// Weather-to-item mapping
const WEATHER_PREFERENCES: Record<WeatherCondition, {
  boostKeywords: string[];
  dampenKeywords: string[];
  message: string;
}> = {
  hot: {
    boostKeywords: ['cold', 'ice', 'frozen', 'juice', 'lassi', 'shake', 'salad', 'cool', 'fizzy', 'water'],
    dampenKeywords: ['hot', 'soup', 'tea', 'coffee', 'warm', 'spicy', 'hot chocolate'],
    message: "Beat the heat!",
  },
  cold: {
    boostKeywords: ['hot', 'soup', 'tea', 'coffee', 'warm', 'chai', 'biryani', 'curry', 'hot chocolate'],
    dampenKeywords: ['cold', 'ice', 'frozen', 'salad', 'lassi', 'cold drink'],
    message: "Warm up with our hot favorites!",
  },
  rainy: {
    boostKeywords: ['soup', 'tea', 'coffee', 'chai', 'pakora', 'fritters', 'hot', 'biryani', 'comfort'],
    dampenKeywords: ['salad', 'cold', 'ice'],
    message: "Perfect rainy day comfort food",
  },
  cloudy: {
    boostKeywords: ['tea', 'coffee', 'snacks', 'chai', 'pakora', 'biscuits'],
    dampenKeywords: ['ice cream', 'frozen'],
    message: "A cozy treat for cloudy skies",
  },
  pleasant: {
    boostKeywords: ['outdoor', 'pizza', 'burger', 'shake', 'refresh', 'light'],
    dampenKeywords: [],
    message: "Great day to enjoy!",
  },
  unknown: {
    boostKeywords: ['popular', 'bestseller', 'chef special'],
    dampenKeywords: [],
    message: "Our top picks for you",
  },
};

// Get current weather using browser geolocation and a free weather API
export async function getCurrentWeather(
  latitude?: number,
  longitude?: number,
): Promise<WeatherData> {
  // Default to unknown if geolocation fails
  const defaultWeather: WeatherData = {
    condition: 'unknown',
    temperature: 25,
    humidity: 50,
    description: 'Weather unavailable',
    icon: '🌤️',
    location: 'Unknown',
    fetchedAt: new Date().toISOString(),
  };

  try {
    // Get coordinates if not provided
    if (!latitude || !longitude) {
      const coords = await getCurrentPosition();
      if (!coords) return defaultWeather;
      latitude = coords.latitude;
      longitude = coords.longitude;
    }

    // Use Open-Meteo API (free, no API key required)
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`,
    );

    if (!response.ok) {
      logger.error('Weather API failed:', response.status);
      return defaultWeather;
    }

    const data = await response.json();
    const current = data.current;

    const temperature = current.temperature_2m;
    const humidity = current.relative_humidity_2m;
    const weatherCode = current.weather_code;

    const { condition, description, icon } = interpretWeatherCode(weatherCode, temperature);

    return {
      condition,
      temperature,
      humidity,
      description,
      icon,
      location: 'Your location',
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Failed to fetch weather:', error);
    return defaultWeather;
  }
}

// Get current position using browser Geolocation API
function getCurrentPosition(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        resolve(null);
      },
      { timeout: 5000, maximumAge: 600000 } // 5s timeout, 10min cache
    );
  });
}

// Interpret WMO weather codes to our conditions
function interpretWeatherCode(code: number, temperature: number): {
  condition: WeatherCondition;
  description: string;
  icon: string;
} {
  // WMO Weather interpretation codes
  // https://open-meteo.com/en/docs

  // Rainy conditions
  if (code >= 51 && code <= 67) {
    return {
      condition: 'rainy',
      description: 'Rainy weather',
      icon: '🌧️',
    };
  }

  // Snow conditions
  if (code >= 71 && code <= 77) {
    return {
      condition: 'cold',
      description: 'Snowy weather',
      icon: '❄️',
    };
  }

  // Rain showers
  if (code >= 80 && code <= 82) {
    return {
      condition: 'rainy',
      description: 'Rain showers',
      icon: '🌦️',
    };
  }

  // Thunderstorm
  if (code >= 95 && code <= 99) {
    return {
      condition: 'rainy',
      description: 'Thunderstorm',
      icon: '⛈️',
    };
  }

  // Cloud cover - determine based on code
  if (code >= 1 && code <= 3) {
    if (temperature > 30) {
      return {
        condition: 'hot',
        description: 'Partly cloudy and hot',
        icon: '⛅',
      };
    } else if (temperature < 20) {
      return {
        condition: 'cloudy',
        description: 'Partly cloudy and cool',
        icon: '☁️',
      };
    }
    return {
      condition: 'pleasant',
      description: 'Pleasant weather',
      icon: '🌤️',
    };
  }

  // Clear sky
  if (code === 0) {
    if (temperature > 32) {
      return {
        condition: 'hot',
        description: 'Hot and sunny',
        icon: '☀️',
      };
    } else if (temperature < 18) {
      return {
        condition: 'cold',
        description: 'Cool and clear',
        icon: '🌤️',
      };
    }
    return {
      condition: 'pleasant',
      description: 'Clear skies',
      icon: '☀️',
    };
  }

  // Fog/mist
  if (code >= 45 && code <= 48) {
    return {
      condition: 'cold',
      description: 'Foggy weather',
      icon: '🌫️',
    };
  }

  // Default
  return {
    condition: 'unknown',
    description: 'Current weather',
    icon: '🌤️',
  };
}

// Get weather-based suggestions from menu items
export function getWeatherBasedSuggestions(
  items: MenuItem[],
  weather: WeatherData,
): MenuItem[] {
  const preferences = WEATHER_PREFERENCES[weather.condition];

  // Score each item based on weather preferences
  const scored = items
    .map((item) => {
      let score = 0;
      const name = item.name.toLowerCase();
      const desc = (item.description || '').toLowerCase();

      // Boost items matching weather preferences
      preferences.boostKeywords.forEach((keyword) => {
        if (name.includes(keyword) || desc.includes(keyword)) {
          score += 3;
        }
      });

      // Dampen items not matching weather
      preferences.dampenKeywords.forEach((keyword) => {
        if (name.includes(keyword) || desc.includes(keyword)) {
          score -= 2;
        }
      });

      // Boost popular/seasonal items
      if (item.isPopular || item.isChefSpecial || item.isSeasonal) {
        score += 2;
      }

      // Temperature-based adjustments
      if (weather.condition === 'hot' && item.spicyLevel >= 3) {
        score -= 2; // Reduce very spicy items in hot weather
      }
      if (weather.condition === 'cold' && item.spicyLevel >= 2) {
        score += 2; // Boost spicy food in cold weather
      }

      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 8).map(({ item }) => item);
}

// Get weather message for display
export function getWeatherMessage(weather: WeatherData): string {
  const baseMessage = WEATHER_PREFERENCES[weather.condition].message;

  // Add temperature context
  if (weather.condition === 'hot' && weather.temperature > 35) {
    return "It's scorching! Stay cool with our chilled favorites";
  }
  if (weather.condition === 'hot' && weather.temperature > 30) {
    return "Beat the heat! Try our refreshing options";
  }
  if (weather.condition === 'cold' && weather.temperature < 15) {
    return "Brrr! Warm up with our hot selections";
  }
  if (weather.condition === 'cold' && weather.temperature < 20) {
    return "Cool weather calls for comfort food";
  }
  if (weather.condition === 'rainy') {
    return "Perfect weather for cozy comfort food";
  }

  return baseMessage;
}

// Weather badge component data
export function getWeatherBadge(weather: WeatherData): {
  bgColor: string;
  textColor: string;
  icon: string;
  label: string;
} {
  switch (weather.condition) {
    case 'hot':
      return {
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-700',
        icon: '🔥',
        label: `${Math.round(weather.temperature)}°C`,
      };
    case 'cold':
      return {
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        icon: '❄️',
        label: `${Math.round(weather.temperature)}°C`,
      };
    case 'rainy':
      return {
        bgColor: 'bg-gray-200',
        textColor: 'text-gray-700',
        icon: '🌧️',
        label: 'Rainy',
      };
    case 'cloudy':
      return {
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-600',
        icon: '☁️',
        label: 'Cloudy',
      };
    case 'pleasant':
      return {
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
        icon: '🌤️',
        label: 'Nice weather',
      };
    default:
      return {
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-600',
        icon: '🌤️',
        label: 'Weather',
      };
  }
}

// Cache weather data in localStorage
const WEATHER_CACHE_KEY = 'rez_weather_cache';
const WEATHER_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export function getCachedWeather(): WeatherData | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(WEATHER_CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < WEATHER_CACHE_DURATION) {
        return data as WeatherData;
      }
    }
  } catch {
    // Ignore cache errors
  }

  return null;
}

export function setCachedWeather(weather: WeatherData): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(
      WEATHER_CACHE_KEY,
      JSON.stringify({
        data: weather,
        timestamp: Date.now(),
      }),
    );
  } catch {
    // Ignore cache errors
  }
}

// Combined function to get weather with caching
export async function getWeatherWithCache(
  latitude?: number,
  longitude?: number,
): Promise<WeatherData> {
  // Check cache first
  const cached = getCachedWeather();
  if (cached) {
    return cached;
  }

  // Fetch fresh weather
  const weather = await getCurrentWeather(latitude, longitude);
  setCachedWeather(weather);

  return weather;
}
