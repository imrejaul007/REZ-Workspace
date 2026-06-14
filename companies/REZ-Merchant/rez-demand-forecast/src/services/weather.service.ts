/**
 * Weather Service
 * FreshMart 5AM Story: "Rain Expected Evening → Delivery Orders +31%"
 *
 * Purpose: Integrate weather data with demand forecasting
 */

export interface WeatherData {
  location: string;
  temperature: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'cold' | 'hot';
  humidity: number;
  forecast: WeatherForecast[];
}

export interface WeatherForecast {
  date: Date;
  condition: string;
  temperature_high: number;
  temperature_low: number;
  precipitation_chance: number;
  delivery_impact: number;  // multiplier for delivery demand
  grocery_impact: {
    dairy: number;
    produce: number;
    beverages: number;
    snacks: number;
  };
}

export interface FestivalData {
  name: string;
  date: Date;
  type: 'national' | 'religious' | 'regional' | 'seasonal';
  demand_multiplier: number;
  categories_affected: {
    [category: string]: number;
  };
}

class WeatherService {
  private weatherCache: Map<string, { data: WeatherData; timestamp: number }> = new Map();
  private cacheTTL = 30 * 60 * 1000; // 30 minutes

  /**
   * Get current weather for a location
   * FreshMart 5AM: Rain Expected Evening → +31% delivery
   */
  async getWeather(location: string): Promise<WeatherData> {
    const cacheKey = `${location}_current`;
    const cached = this.weatherCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    // In production, call actual weather API (OpenWeather, WeatherAPI, etc.)
    // For now, simulate weather data
    const weather = this.simulateWeather(location);

    this.weatherCache.set(cacheKey, { data: weather, timestamp: Date.now() });
    return weather;
  }

  /**
   * Get weather forecast for multiple days
   */
  async getForecast(location: string, days: number = 7): Promise<WeatherForecast[]> {
    const weather = await this.getWeather(location);
    return this.generateForecast(weather, days);
  }

  /**
   * Get delivery impact based on weather
   * FreshMart Story: Rain Expected Evening → +31% delivery demand
   */
  async getDeliveryImpact(location: string): Promise<{ impact: number; reason: string }> {
    const weather = await this.getWeather(location);
    const forecast = await this.getForecast(location, 1);
    const todayForecast = forecast[0];

    let impact = 1.0;
    let reason = 'Normal weather';

    // Rain increases delivery demand
    if (weather.condition === 'rainy' || weather.precipitation_chance > 70) {
      impact = 1.31; // +31%
      reason = 'Rain expected - delivery demand increased';
    } else if (weather.condition === 'stormy') {
      impact = 1.5; // +50%
      reason = 'Storm warning - delivery demand significantly increased';
    } else if (weather.condition === 'cold') {
      impact = 1.15; // +15%
      reason = 'Cold weather - comfort food delivery up';
    } else if (weather.condition === 'hot') {
      impact = 1.2; // +20%
      reason = 'Hot weather - cold drinks and ice cream up';
    }

    return { impact, reason };
  }

  /**
   * Get grocery category impacts based on weather
   * FreshMart Story: Rain → more delivery, Cold → more milk/tea
   */
  async getGroceryImpacts(location: string): Promise<{ [category: string]: number }> {
    const weather = await this.getWeather(location);

    const impacts: { [category: string]: number } = {
      dairy: 1.0,
      produce: 1.0,
      beverages: 1.0,
      snacks: 1.0,
      bakery: 1.0,
      frozen: 1.0,
      household: 1.0
    };

    switch (weather.condition) {
      case 'rainy':
        impacts.beverages = 1.2; // Hot beverages
        impacts.snacks = 1.15; // Comfort snacking
        impacts.produce = 0.9; // Less fresh produce demand
        break;

      case 'cold':
        impacts.dairy = 1.25; // Milk, curd
        impacts.beverages = 1.3; // Hot drinks
        impacts.bakery = 1.15; // Fresh bread
        break;

      case 'hot':
        impacts.beverages = 1.4; // Cold drinks, water
        impacts.frozen = 1.3; // Ice cream, popsicles
        impacts.dairy = 1.2; // Lassi, buttermilk
        impacts.produce = 1.15; // Fresh salads
        break;

      case 'sunny':
        impacts.produce = 1.2; // Fresh fruits
        impacts.snacks = 1.1; // Summer snacks
        impacts.beverages = 1.1; // Cold drinks
        break;

      case 'cloudy':
        // Neutral impact
        break;
    }

    // Temperature-based adjustments
    if (weather.temperature < 15) {
      impacts.dairy *= 1.1;
      impacts.beverages *= 1.15;
    } else if (weather.temperature > 35) {
      impacts.beverages *= 1.2;
      impacts.frozen *= 1.15;
    }

    return impacts;
  }

  /**
   * Get combined weather + festival impact for forecasting
   */
  async getForecastImpact(
    location: string,
    festival?: FestivalData
  ): Promise<{
    delivery_impact: number;
    category_impacts: { [category: string]: number };
    weather_reason: string;
    festival_reason?: string;
  }> {
    const [deliveryWeather, groceryImpacts] = await Promise.all([
      this.getDeliveryImpact(location),
      this.getGroceryImpacts(location)
    ]);

    const category_impacts = { ...groceryImpacts };
    let festival_reason: string | undefined;

    // Apply festival multipliers
    if (festival) {
      festival_reason = `${festival.name} - ${Math.round((festival.demand_multiplier - 1) * 100)}% demand increase`;

      for (const [category, multiplier] of Object.entries(festival.categories_affected)) {
        category_impacts[category] = (category_impacts[category] || 1) * multiplier;
      }
    }

    return {
      delivery_impact: deliveryWeather.impact,
      category_impacts,
      weather_reason: deliveryWeather.reason,
      festival_reason
    };
  }

  // Simulate weather data (replace with actual API in production)
  private simulateWeather(location: string): WeatherData {
    const conditions: WeatherData['condition'][] = ['sunny', 'cloudy', 'rainy', 'cold', 'hot'];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    const baseTemp = 25 + Math.random() * 10;

    return {
      location,
      temperature: Math.round(baseTemp),
      condition: randomCondition,
      humidity: Math.round(50 + Math.random() * 40),
      precipitation_chance: randomCondition === 'rainy' ? 80 : randomCondition === 'cloudy' ? 40 : 10,
      forecast: []
    };
  }

  private generateForecast(weather: WeatherData, days: number): WeatherForecast[] {
    const forecasts: WeatherForecast[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      const condition = i === 0 ? weather.condition : 'cloudy';
      const precipChance = condition === 'rainy' ? 80 : condition === 'cloudy' ? 30 : 10;

      forecasts.push({
        date,
        condition,
        temperature_high: 28 + Math.random() * 5,
        temperature_low: 20 + Math.random() * 5,
        precipitation_chance: precipChance,
        delivery_impact: precipChance > 50 ? 1.2 : 1.0,
        grocery_impact: {
          dairy: precipChance > 50 ? 1.1 : 1.0,
          produce: precipChance > 50 ? 0.95 : 1.0,
          beverages: precipChance > 50 ? 1.15 : 1.0,
          snacks: precipChance > 50 ? 1.1 : 1.0
        }
      });
    }

    return forecasts;
  }
}

export const weatherService = new WeatherService();
export default weatherService;
