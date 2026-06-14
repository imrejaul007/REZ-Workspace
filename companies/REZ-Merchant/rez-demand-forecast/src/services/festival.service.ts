/**
 * Festival Calendar Service
 * FreshMart 5AM Story: "Diwali → Milk +45%, Sweets +80%"
 *
 * Purpose: Manage festival calendar with demand multipliers for grocery forecasting
 */

export interface Festival {
  name: string;
  slug: string;  // diwali, eid, holi, pongal, christmas
  date: Date;
  end_date?: Date;
  type: 'national' | 'religious' | 'regional' | 'seasonal';
  demand_multiplier: number;  // Overall demand multiplier
  category_impacts: {
    [category: string]: number;  // Category-specific multiplier
  };
 提前天数: number;  // How many days before festival demand starts increasing
  duration_days: number;  // How long the demand spike lasts
}

export interface FestivalImpact {
  festival: Festival;
  days_until: number;
  current_demand: number;
  expected_demand: number;
  categories_affected: string[];
}

class FestivalService {
  private festivals: Festival[] = [];

  constructor() {
    // Seed default Indian festivals
    this.seedFestivals();
  }

  /**
   * Seed default Indian festivals for grocery forecasting
   * FreshMart 5AM Story: Diwali, Eid, Holi → demand spikes
   */
  private seedFestivals(): void {
    const currentYear = new Date().getFullYear();

    this.festivals = [
      // ========== DIWALI ==========
      {
        name: 'Diwali',
        slug: 'diwali',
        date: new Date(currentYear, 10, 20),  // November 20 (approximate)
        type: 'religious',
        demand_multiplier: 1.8,  // +80% overall
        category_impacts: {
          sweets: 3.0,      // +200%
          dairy: 1.45,      // +45%
          ghee: 2.5,        // +150%
          dryfruits: 2.0,    // +100%
          snacks: 1.6,       // +60%
          decorations: 2.5,   // +150%
          gifts: 2.0,        // +100%
          clothing: 1.5       // +50%
        },
        提前天数: 7,
        duration_days: 5
      },

      // ========== EID ==========
      {
        name: 'Eid al-Fitr',
        slug: 'eid',
        date: new Date(currentYear, 2, 30),  // March 30 (approximate)
        type: 'religious',
        demand_multiplier: 1.6,  // +60%
        category_impacts: {
          meat: 2.5,         // +150%
          bakery: 1.8,       // +80%
          sweets: 2.0,        // +100%
          dairy: 1.4,        // +40%
          fruits: 1.5,       // +50%
          beverages: 1.3     // +30%
        },
        提前天数: 5,
        duration_days: 3
      },

      // ========== HOLI ==========
      {
        name: 'Holi',
        slug: 'holi',
        date: new Date(currentYear, 2, 14),  // March 14 (approximate)
        type: 'religious',
        demand_multiplier: 1.5,  // +50%
        category_impacts: {
          colors: 3.0,       // +200%
          sweets: 2.2,        // +120%
          drinks: 1.8,        // +80%
          dairy: 1.3,         // +30%
          snacks: 1.4          // +40%
        },
        提前天数: 5,
        duration_days: 3
      },

      // ========== PONGAL ==========
      {
        name: 'Pongal',
        slug: 'pongal',
        date: new Date(currentYear, 0, 15),  // January 15
        type: 'regional',
        demand_multiplier: 1.4,  // +40%
        category_impacts: {
          rice: 2.0,          // +100%
          jaggery: 2.0,       // +100%
          ghee: 1.8,          // +80%
          sugarcane: 2.5,     // +150%
          turmeric: 1.5        // +50%
        },
        提前天数: 3,
        duration_days: 4
      },

      // ========== ONAM ==========
      {
        name: 'Onam',
        slug: 'onam',
        date: new Date(currentYear, 8, 5),  // September 5 (approximate)
        type: 'regional',
        demand_multiplier: 1.35,  // +35%
        category_impacts: {
          flowers: 2.5,       // +150%
          banana: 2.0,        // +100%
          rice: 1.5,          // +50%
          sweets: 1.8,         // +80%
          decorations: 2.0      // +100%
        },
        提前天数: 7,
        duration_days: 10
      },

      // ========== CHRISTMAS ==========
      {
        name: 'Christmas',
        slug: 'christmas',
        date: new Date(currentYear, 11, 25),  // December 25
        type: 'national',
        demand_multiplier: 1.3,  // +30%
        category_impacts: {
          bakery: 2.0,        // +100%
          sweets: 1.8,        // +80%
          dairy: 1.3,         // +30%
          fruits: 1.5,        // +50%
          gifts: 2.0          // +100%
        },
        提前天数: 10,
        duration_days: 7
      },

      // ========== DURGA PUJA ==========
      {
        name: 'Durga Puja',
        slug: 'durga-puja',
        date: new Date(currentYear, 9, 10),  // October 10 (approximate)
        type: 'regional',
        demand_multiplier: 1.5,  // +50%
        category_impacts: {
          flowers: 3.0,       // +200%
          sweets: 2.0,        // +100%
          gifts: 1.8,         // +80%
          decorations: 2.5,     // +150%
          fish: 2.0,          // +100%
          meat: 1.5           // +50%
        },
        提前天数: 7,
        duration_days: 5
      },

      // ========== INDEPENDENCE DAY ==========
      {
        name: 'Independence Day',
        slug: 'independence-day',
        date: new Date(currentYear, 7, 15),  // August 15
        type: 'national',
        demand_multiplier: 1.15,  // +15%
        category_impacts: {
          snacks: 1.4,        // +40%
          beverages: 1.3,     // +30%
          sweets: 1.2          // +20%
        },
        提前天数: 2,
        duration_days: 2
      },

      // ========== GANESH CHATURTHI ==========
      {
        name: 'Ganesh Chaturthi',
        slug: 'ganesh-chaturthi',
        date: new Date(currentYear, 7, 7),  // September 7 (approximate)
        type: 'regional',
        demand_multiplier: 1.4,  // +40%
        category_impacts: {
          modak: 3.0,        // +200%
          coconut: 2.5,        // +150%
          flowers: 2.0,       // +100%
          fruits: 1.5,        // +50%
          sweets: 1.6          // +60%
        },
        提前天数: 5,
        duration_days: 10
      },

      // ========== NAVRATRI ==========
      {
        name: 'Navratri',
        slug: 'navratri',
        date: new Date(currentYear, 9, 3),  // October 3 (approximate)
        type: 'religious',
        demand_multiplier: 1.35,  // +35%
        category_impacts: {
          fruits: 2.0,        // +100%
          fasting_foods: 2.5,   // +150%
          milk: 1.5,          // +50%
          dairy: 1.4,         // +40%
          coconut: 1.8         // +80%
        },
        提前天数: 3,
        duration_days: 9
      },

      // ========== RAKSHA BANDHAN ==========
      {
        name: 'Raksha Bandhan',
        slug: 'raksha-bandhan',
        date: new Date(currentYear, 7, 9),  // August 9 (approximate)
        type: 'religious',
        demand_multiplier: 1.25,  // +25%
        category_impacts: {
          sweets: 1.8,        // +80%
          gifts: 2.0,         // +100%
          dryfruits: 1.5,     // +50%
          clothing: 1.4        // +40%
        },
        提前天数: 5,
        duration_days: 3
      },

      // ========== SEASONAL: SUMMER ==========
      {
        name: 'Summer Season',
        slug: 'summer',
        date: new Date(currentYear, 3, 1),  // April 1
        end_date: new Date(currentYear, 5, 30),  // June 30
        type: 'seasonal',
        demand_multiplier: 1.2,  // +20%
        category_impacts: {
          cold_drinks: 2.5,   // +150%
          ice_cream: 2.0,     // +100%
          fruits: 1.5,        // +50%
          water: 1.8,         // +80%
          buttermilk: 1.6,      // +60%
          juices: 1.4           // +40%
        },
        提前天数: 30,
        duration_days: 90
      },

      // ========== SEASONAL: MONSOON ==========
      {
        name: 'Monsoon Season',
        slug: 'monsoon',
        date: new Date(currentYear, 6, 1),  // July 1
        end_date: new Date(currentYear, 8, 30),  // September 30
        type: 'seasonal',
        demand_multiplier: 1.1,  // +10%
        category_impacts: {
          snacks: 1.4,        // +40%
          tea: 1.3,           // +30%
          hot_food: 1.2,      // +20%
          mushrooms: 0.8      // -20% (less fresh produce)
        },
        提前天数: 7,
        duration_days: 90
      },

      // ========== SEASONAL: WINTER ==========
      {
        name: 'Winter Season',
        slug: 'winter',
        date: new Date(currentYear, 10, 1),  // November 1
        end_date: new Date(currentYear, 1, 28),  // February 28
        type: 'seasonal',
        demand_multiplier: 1.15,  // +15%
        category_impacts: {
          dairy: 1.3,          // +30%
          tea: 1.4,            // +40%
          ghee: 1.3,           // +30%
          honey: 1.3,          // +30%
          dryfruits: 1.4       // +40%
        },
        提前天数: 14,
        duration_days: 120
      }
    ];
  }

  /**
   * Get all upcoming festivals
   */
  getUpcomingFestivals(days: number = 30): FestivalImpact[] {
    const today = new Date();
    const future = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

    return this.festivals
      .filter(f => {
        const festivalDate = f.date;
        return festivalDate >= today && festivalDate <= future;
      })
      .map(f => ({
        festival: f,
        days_until: Math.ceil((f.date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)),
        current_demand: 1.0,
        expected_demand: f.demand_multiplier,
        categories_affected: Object.keys(f.category_impacts)
      }))
      .sort((a, b) => a.days_until - b.days_until);
  }

  /**
   * Get active festivals (currently in festival period)
   */
  getActiveFestivals(): FestivalImpact[] {
    const today = new Date();

    return this.festivals
      .filter(f => {
        const endDate = f.end_date || f.date;
        return f.date <= today && endDate >= today;
      })
      .map(f => ({
        festival: f,
        days_until: 0,
        current_demand: f.demand_multiplier,
        expected_demand: f.demand_multiplier,
        categories_affected: Object.keys(f.category_impacts)
      }));
  }

  /**
   * Get festival impact for a specific date
   */
  getFestivalImpact(date: Date): FestivalImpact | null {
    const impact = this.festivals.find(f => {
      const endDate = f.end_date || f.date;
      return f.date <= date && endDate >= date;
    });

    if (!impact) return null;

    return {
      festival: impact,
      days_until: 0,
      current_demand: impact.demand_multiplier,
      expected_demand: impact.demand_multiplier,
      categories_affected: Object.keys(impact.category_impacts)
    };
  }

  /**
   * Get category impact for a date
   */
  getCategoryImpact(date: Date, category: string): number {
    const impact = this.getFestivalImpact(date);
    return impact?.festival.category_impacts[category] || 1.0;
  }

  /**
   * Add custom festival
   */
  addFestival(festival: Festival): void {
    this.festivals.push(festival);
  }

  /**
   * Get all festivals
   */
  getAllFestivals(): Festival[] {
    return [...this.festivals];
  }

  /**
   * Get festival by slug
   */
  getFestivalBySlug(slug: string): Festival | undefined {
    return this.festivals.find(f => f.slug === slug);
  }
}

export const festivalService = new FestivalService();
export default festivalService;
