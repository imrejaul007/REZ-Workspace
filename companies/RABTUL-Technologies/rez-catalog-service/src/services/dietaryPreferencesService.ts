/**
 * Dietary Preferences Service
 * Business logic for managing user dietary preferences
 */

import { DietaryPreferences, IDietaryPreferences } from '../models/DietaryPreferences';

// Re-export for convenience
export type { IDietaryPreferences } from '../models/DietaryPreferences';

export interface UpdateDietaryPreferencesInput {
  vegan?: boolean;
  vegetarian?: boolean;
  glutenFree?: boolean;
  nutFree?: boolean;
  dairyFree?: boolean;
  halal?: boolean;
  kosher?: boolean;
  jain?: boolean;
  allergies?: string[];
  dislikes?: string[];
  preferredCuisines?: string[];
  spiceTolerance?: number;
}

export class DietaryPreferencesService {
  /**
   * Get dietary preferences for a user
   */
  async getByUserId(userId: string): Promise<IDietaryPreferences | null> {
    return DietaryPreferences.findOne({ userId }).lean() as Promise<IDietaryPreferences | null>;
  }

  /**
   * Get or create dietary preferences for a user
   */
  async getOrCreate(userId: string): Promise<IDietaryPreferences> {
    let prefs = await DietaryPreferences.findOne({ userId });
    if (!prefs) {
      prefs = await DietaryPreferences.create({ userId });
    }
    return prefs;
  }

  /**
   * Update dietary preferences for a user
   */
  async update(userId: string, input: UpdateDietaryPreferencesInput): Promise<IDietaryPreferences | null> {
    const updateData: Record<string, unknown> = {};

    // Boolean flags
    if (input.vegan !== undefined) updateData.vegan = input.vegan;
    if (input.vegetarian !== undefined) updateData.vegetarian = input.vegetarian;
    if (input.glutenFree !== undefined) updateData.glutenFree = input.glutenFree;
    if (input.nutFree !== undefined) updateData.nutFree = input.nutFree;
    if (input.dairyFree !== undefined) updateData.dairyFree = input.dairyFree;
    if (input.halal !== undefined) updateData.halal = input.halal;
    if (input.kosher !== undefined) updateData.kosher = input.kosher;
    if (input.jain !== undefined) updateData.jain = input.jain;

    // Arrays - merge with existing
    if (input.allergies !== undefined) updateData.allergies = input.allergies;
    if (input.dislikes !== undefined) updateData.dislikes = input.dislikes;
    if (input.preferredCuisines !== undefined) updateData.preferredCuisines = input.preferredCuisines;

    // Numeric
    if (input.spiceTolerance !== undefined) {
      updateData.spiceTolerance = Math.max(1, Math.min(5, input.spiceTolerance));
    }

    const prefs = await DietaryPreferences.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, upsert: true }
    );

    return prefs;
  }

  /**
   * Add an allergy to user preferences
   */
  async addAllergy(userId: string, allergy: string): Promise<IDietaryPreferences | null> {
    return DietaryPreferences.findOneAndUpdate(
      { userId },
      { $addToSet: { allergies: allergy.toLowerCase() } },
      { new: true, upsert: true }
    );
  }

  /**
   * Remove an allergy from user preferences
   */
  async removeAllergy(userId: string, allergy: string): Promise<IDietaryPreferences | null> {
    return DietaryPreferences.findOneAndUpdate(
      { userId },
      { $pull: { allergies: allergy.toLowerCase() } },
      { new: true }
    );
  }

  /**
   * Add a dislike to user preferences
   */
  async addDislike(userId: string, item: string): Promise<IDietaryPreferences | null> {
    return DietaryPreferences.findOneAndUpdate(
      { userId },
      { $addToSet: { dislikes: item.toLowerCase() } },
      { new: true, upsert: true }
    );
  }

  /**
   * Check if an item matches user dietary filters
   */
  matchesDietaryFilters(
    prefs: IDietaryPreferences | null,
    item: {
      dietary?: {
        isVegan?: boolean;
        isVegetarian?: boolean;
        isGlutenFree?: boolean;
        isHalal?: boolean;
        isKosher?: boolean;
        isJain?: boolean;
      };
      allergens?: string[];
      name?: string;
      ingredients?: string[];
    }
  ): { matches: boolean; reason?: string } {
    if (!prefs) return { matches: true };

    // Check vegan
    if (prefs.vegan && !item.dietary?.isVegan) {
      return { matches: false, reason: 'Item is not vegan' };
    }

    // Check vegetarian
    if (prefs.vegetarian && !item.dietary?.isVegetarian && !item.dietary?.isVegan) {
      return { matches: false, reason: 'Item is not vegetarian' };
    }

    // Check gluten-free
    if (prefs.glutenFree && !item.dietary?.isGlutenFree) {
      return { matches: false, reason: 'Item contains gluten' };
    }

    // Check halal
    if (prefs.halal && !item.dietary?.isHalal) {
      return { matches: false, reason: 'Item is not halal' };
    }

    // Check kosher
    if (prefs.kosher && !item.dietary?.isKosher) {
      return { matches: false, reason: 'Item is not kosher' };
    }

    // Check jain
    if (prefs.jain && !item.dietary?.isJain) {
      return { matches: false, reason: 'Item is not jain' };
    }

    // Check allergies
    if (prefs.allergies.length > 0 && item.allergens) {
      const itemAllergens = item.allergens.map((a) => a.toLowerCase());
      const matchingAllergy = prefs.allergies.find((a) => itemAllergens.includes(a.toLowerCase()));
      if (matchingAllergy) {
        return { matches: false, reason: `Contains allergen: ${matchingAllergy}` };
      }
    }

    // Check dislikes
    if (prefs.dislikes.length > 0) {
      const itemName = (item.name || '').toLowerCase();
      const matchingDislike = prefs.dislikes.find((d) =>
        itemName.includes(d.toLowerCase()) ||
        item.ingredients?.some((ing) => ing.toLowerCase().includes(d.toLowerCase()))
      );
      if (matchingDislike) {
        return { matches: false, reason: `You don't like ${matchingDislike}` };
      }
    }

    return { matches: true };
  }
}

export const dietaryPreferencesService = new DietaryPreferencesService();
