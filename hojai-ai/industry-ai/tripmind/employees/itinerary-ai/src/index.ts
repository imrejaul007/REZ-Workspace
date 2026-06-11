/**
 * Itinerary AI - Trip Planning Assistant
 * Part of TRIPMIND - Travel Agency AI
 */

export interface DayPlan {
  day: number;
  date: string;
  activities: {
    time: string;
    title: string;
    description: string;
    location: string;
    duration: number; // hours
    type: 'sightseeing' | 'dining' | 'shopping' | 'relaxation' | 'adventure' | 'transport';
  }[];
  meals: { breakfast?: string; lunch?: string; dinner?: string };
  tips: string[];
}

export interface Itinerary {
  id: string;
  destination: string;
  duration: number;
  travelerType: 'solo' | 'couple' | 'family' | 'group';
  budget: 'budget' | 'mid-range' | 'luxury';
  days: DayPlan[];
  totalCost: number;
  bestTimeToVisit: string;
}

export class ItineraryAI {
  async generateItinerary(
    destination: string,
    duration: number,
    travelerType: string,
    budget: string
  ): Promise<Itinerary> {
    const days: DayPlan[] = [];

    for (let i = 1; i <= duration; i++) {
      days.push({
        day: i,
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        activities: this.generateDayActivities(i, budget),
        meals: {
          breakfast: 'Hotel breakfast',
          lunch: this.getRandomMeal('lunch'),
          dinner: this.getRandomMeal('dinner')
        },
        tips: this.generateTips(budget)
      });
    }

    return {
      id: `IT-${Date.now().toString(36).toUpperCase()}`,
      destination,
      duration,
      travelerType: travelerType as Itinerary['travelerType'],
      budget: budget as Itinerary['budget'],
      days,
      totalCost: duration * (budget === 'luxury' ? 15000 : budget === 'mid-range' ? 8000 : 4000),
      bestTimeToVisit: this.getBestTime(destination)
    };
  }

  private generateDayActivities(day: number, budget: string): DayPlan['activities'] {
    const activities: DayPlan['activities'] = [
      {
        time: '09:00 AM',
        title: 'City Tour',
        description: 'Guided tour of major attractions',
        location: 'City Center',
        duration: 4,
        type: 'sightseeing'
      },
      {
        time: '02:00 PM',
        title: 'Local Market Visit',
        description: 'Explore local shops and crafts',
        location: 'Local Market',
        duration: 2,
        type: 'shopping'
      },
      {
        time: '05:00 PM',
        title: 'Sunset Viewpoint',
        description: 'Relax at beautiful sunset location',
        location: 'Hilltop Point',
        duration: 2,
        type: 'relaxation'
      }
    ];

    return activities;
  }

  private getRandomMeal(type: string): string {
    const meals = {
      breakfast: ['Continental Breakfast', 'Local Delights', 'South Indian Special'],
      lunch: ['Local Restaurant', 'Street Food Tour', 'Beachside Cafe'],
      dinner: ['Fine Dining', 'Local Cuisine', 'Rooftop Restaurant']
    };
    const options = meals[type as keyof typeof meals] || meals.breakfast;
    return options[Math.floor(Math.random() * options.length)];
  }

  private generateTips(budget: string): string[] {
    const baseTips = ['Carry comfortable walking shoes', 'Stay hydrated'];
    if (budget === 'budget') {
      baseTips.push('Use public transport', 'Eat at local restaurants');
    } else {
      baseTips.push('Book tours in advance', 'Consider private guides');
    }
    return baseTips;
  }

  private getBestTime(destination: string): string {
    const timings: Record<string, string> = {
      'goa': 'November to February',
      'kerala': 'September to March',
      'dubai': 'November to March',
      'singapore': 'February to April',
      'thailand': 'November to February'
    };
    return timings[destination.toLowerCase()] || 'October to March';
  }

  async modifyItinerary(itinerary: Itinerary, modifications: {
    addDay?: number;
    removeActivity?: number;
    changeBudget?: string;
  }): Promise<Itinerary> {
    return { ...itinerary, ...modifications };
  }
}

export default ItineraryAI;