/**
 * Weather Service
 * Integrates with Open-Meteo API (free, no key required) for weather-based recommendations
 */

import { WeatherCache, IWeatherCache } from '../models/WeatherCache';

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    weather_code: number;
  };
}

interface WMOWeatherCode {
  code: number;
  condition: IWeatherCache['condition'];
  description: string;
}

// WMO Weather interpretation codes mapping
const WMO_CODES: WMOWeatherCode[] = [
  { code: 0, condition: 'sunny', description: 'Clear sky' },
  { code: 1, condition: 'sunny', description: 'Mainly clear' },
  { code: 2, condition: 'cloudy', description: 'Partly cloudy' },
  { code: 3, condition: 'cloudy', description: 'Overcast' },
  { code: 45, condition: 'cloudy', description: 'Foggy' },
  { code: 48, condition: 'cloudy', description: 'Depositing rime fog' },
  { code: 51, condition: 'rainy', description: 'Light drizzle' },
  { code: 53, condition: 'rainy', description: 'Moderate drizzle' },
  { code: 55, condition: 'rainy', description: 'Dense drizzle' },
  { code: 61, condition: 'rainy', description: 'Slight rain' },
  { code: 63, condition: 'rainy', description: 'Moderate rain' },
  { code: 65, condition: 'rainy', description: 'Heavy rain' },
  { code: 71, condition: 'snowy', description: 'Slight snow' },
  { code: 73, condition: 'snowy', description: 'Moderate snow' },
  { code: 75, condition: 'snowy', description: 'Heavy snow' },
  { code: 80, condition: 'rainy', description: 'Rain showers' },
  { code: 81, condition: 'rainy', description: 'Moderate rain showers' },
  { code: 82, condition: 'rainy', description: 'Violent rain showers' },
  { code: 95, condition: 'stormy', description: 'Thunderstorm' },
  { code: 96, condition: 'stormy', description: 'Thunderstorm with hail' },
  { code: 99, condition: 'stormy', description: 'Thunderstorm with heavy hail' },
];

const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

export class WeatherService {
  private readonly CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

  /**
   * Get location key from coordinates (rounded to 2 decimals)
   */
  private getLocationKey(lat: number, lng: number): string {
    return `${lat.toFixed(2)}_${lng.toFixed(2)}`;
  }

  /**
   * Map WMO weather code to condition
   */
  private getConditionFromCode(code: number): { condition: IWeatherCache['condition']; description: string } {
    const mapping = WMO_CODES.find((w) => w.code === code);
    if (mapping) {
      return { condition: mapping.condition, description: mapping.description };
    }
    // Default based on temperature
    return { condition: 'mild', description: 'Unknown' };
  }

  /**
   * Determine if temperature is comfortable
   */
  private isComfortable(temp: number): boolean {
    return temp >= 18 && temp <= 25;
  }

  /**
   * Get weather for a location (with caching)
   */
  async getWeather(lat: number, lng: number): Promise<IWeatherCache> {
    const locationKey = this.getLocationKey(lat, lng);

    // Check cache first
    const cached = await WeatherCache.findOne({ locationKey });
    if (cached && cached.expiresAt > new Date()) {
      return cached;
    }

    // Fetch from Open-Meteo
    try {
      const url = new URL(OPEN_METEO_BASE_URL);
      url.searchParams.set('latitude', lat.toString());
      url.searchParams.set('longitude', lng.toString());
      url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,weather_code');
      url.searchParams.set('timezone', 'auto');

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Open-Meteo API error: ${response.status}`);
      }

      const data = (await response.json()) as OpenMeteoResponse;
      const current = data.current;
      const { condition, description } = this.getConditionFromCode(current.weather_code);
      const temperature = current.temperature_2m;

      // Determine temperature-based condition if needed
      let finalCondition = condition;
      if (temperature > 30) {
        finalCondition = 'hot';
      } else if (temperature < 10) {
        finalCondition = 'cold';
      } else if (condition === 'sunny' && temperature >= 18 && temperature <= 25) {
        finalCondition = 'mild';
      }

      const expiresAt = new Date(Date.now() + this.CACHE_TTL_MS);

      // Upsert weather cache
      const weather = await WeatherCache.findOneAndUpdate(
        { locationKey },
        {
          $set: {
            temperature,
            condition: finalCondition,
            humidity: current.relative_humidity_2m,
            description,
            isComfortable: this.isComfortable(temperature),
            fetchedAt: new Date(),
            expiresAt,
          },
        },
        { new: true, upsert: true }
      );

      return weather!;
    } catch (error) {
      // If fetch fails, return cached data even if expired, or create a default
      if (cached) {
        return cached;
      }
      throw error;
    }
  }

  /**
   * Get weather-based food recommendations
   */
  getWeatherRecommendations(weather: IWeatherCache) {
    const temp = weather.temperature;
    const condition = weather.condition;

    // Weather-based category recommendations
    const recommendations: Record<string, {
      categories: string[];
      items: string[];
      recommendedCategories?: string[];
      recommendedItems?: string[];
      beverages: string[];
      reason: string;
    }> = {
      hot: {
        categories: ['beverages', 'salads', 'ice cream', 'cold dishes', 'smoothies', 'juices'],
        items: ['Lassi', 'Buttermilk', 'Cold Coffee', 'Ice Cream', 'Fruit Bowl', 'Gazpacho'],
        beverages: ['Iced Tea', 'Cold Coffee', 'Lassi', 'Fresh Juice', 'Smoothie'],
        reason: `It's ${temp}C outside! Stay cool with refreshing drinks and light meals.`,
      },
      cold: {
        categories: ['soups', 'hot beverages', 'biryani', 'curry', 'comfort food', 'desserts'],
        items: ['Hot Soup', 'Masala Chai', 'Biryani', 'Butter Chicken', 'Dal Makhani', 'Gulab Jamun'],
        beverages: ['Hot Chocolate', 'Masala Chai', 'Hot Coffee', 'Warm Milk', 'Mulled Wine'],
        reason: `It's ${temp}C outside! Warm up with hot soups and comfort food.`,
      },
      rainy: {
        categories: ['pakora', 'soups', 'chai', 'fried snacks', 'comfort food'],
        items: ['Onion Pakora', 'Samosa', 'Hot Soup', 'Masala Chai', 'Pakistani Chai'],
        beverages: ['Masala Chai', 'Hot Coffee', 'Soups', 'Hot Chocolate'],
        reason: 'Rainy day vibes! Perfect weather for hot chai and crispy pakoras.',
      },
      sunny: {
        categories: ['beverages', 'light meals', 'salads', 'fruits'],
        items: ['Fresh Salad', 'Fruit Bowl', 'Smoothie Bowl', 'Cold Sandwich', 'Yogurt Parfait'],
        beverages: ['Fresh Juice', 'Iced Tea', 'Lemon Soda', 'Smoothie'],
        reason: `Beautiful sunny day! ${temp}C - enjoy refreshing drinks and healthy options.`,
      },
      cloudy: {
        categories: ['comfort food', 'beverages', 'snacks'],
        items: ['Sandwich', 'Pasta', 'Maggi', 'Pav Bhaji', 'Chole Bhature'],
        beverages: ['Hot Coffee', 'Masala Chai', 'Cold Coffee'],
        reason: 'Cloudy skies call for cozy comfort food!',
      },
      stormy: {
        categories: ['comfort food', 'snacks', 'beverages'],
        items: ['Hot Snacks', 'Comfort Meals', 'Instant Noodles', 'Popcorn'],
        beverages: ['Hot Coffee', 'Masala Chai', 'Hot Chocolate'],
        reason: 'Stormy outside! Stay in with warm comfort food.',
      },
      snowy: {
        categories: ['hot food', 'soups', 'beverages', 'desserts'],
        items: ['Hot Soup', 'Biryani', 'Curry', 'Tandoori Roti', 'Gulab Jamun'],
        beverages: ['Hot Chocolate', 'Masala Chai', 'Hot Mulled Cider'],
        reason: `Snowy weather! Bundle up with hot ${temp}C soup and warm drinks.`,
      },
      mild: {
        categories: ['variety', 'all options'],
        items: ['Biryani', 'Pizza', 'Pasta', 'Salad', 'Desserts'],
        recommendedCategories: ['biryani', 'pizza', 'pasta', 'salad', 'desserts'],
        recommendedItems: ['Biryani', 'Pizza', 'Pasta', 'Salad', 'Desserts'],
        beverages: ['Fresh Juice', 'Smoothie', 'Iced Tea', 'Lassi'],
        reason: `Perfect ${temp}C weather! Enjoy unknown cuisine you like.`,
      },
    };

    return recommendations[condition] || recommendations.mild;
  }
}

export const weatherService = new WeatherService();
