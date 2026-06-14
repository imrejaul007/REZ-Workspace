import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  Modal,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { showAlert } from '@/utils/alert';
import { logger } from '@/utils/logger';

interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
}

interface Recipe {
  id?: string;
  productId: string;
  productName: string;
  servingSize: number;
  ingredients: Ingredient[];
  totalCost: number;
  sellingPrice: number;
  foodCostPercentage: number;
  grossMargin: number;
}

export default function RecipeBuilderScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();

  const [recipe, setRecipe] = useState<Recipe>({
    productId: productId || '',
    productName: '',
    servingSize: 1,
    ingredients: [],
    totalCost: 0,
    sellingPrice: 0,
    foodCostPercentage: 0,
    grossMargin: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [ingredientsList, setIngredientsList] = useState<unknown[]>([]);
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    quantity: '',
    unit: 'g',
    costPerUnit: '',
  });

  const fetchRecipeData = useCallback(async () => {
    try {
      setIsLoading(true);
      // Fetch product details and existing recipe
      const response = await apiClient.get<Recipe>(`/merchant/recipes/${productId}`);
      if (response.success && response.data) {
        setRecipe(response.data);
      }

      // Fetch available ingredients
      const ingredientsResponse = await apiClient.get<unknown[]>('/merchant/ingredients');
      if (ingredientsResponse.success && ingredientsResponse.data) {
        setIngredientsList(ingredientsResponse.data);
      }
    } catch (error) {
      logger.error('Error fetching recipe:', error);
      showAlert('Error', error?.message || 'Failed to load recipe');
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (productId) {
      fetchRecipeData();
    }
  }, [productId, fetchRecipeData]);

  const calculateTotals = (ingredients: Ingredient[], sellingPrice: number) => {
    const totalCost = ingredients.reduce((sum, ing) => sum + ing.totalCost, 0);
    const foodCostPercentage = sellingPrice > 0 ? (totalCost / sellingPrice) * 100 : 0;
    const grossMargin = 100 - foodCostPercentage;

    return {
      totalCost,
      foodCostPercentage,
      grossMargin,
    };
  };

  const handleAddIngredient = () => {
    if (!newIngredient.name || !newIngredient.quantity || !newIngredient.costPerUnit) {
      showAlert('Validation', 'Please fill all ingredient fields');
      return;
    }

    const quantity = parseFloat(newIngredient.quantity);
    const costPerUnit = parseFloat(newIngredient.costPerUnit);
    const totalCost = quantity * costPerUnit;

    const ingredient: Ingredient = {
      id: `${Date.now()}`,
      name: newIngredient.name,
      quantity,
      unit: newIngredient.unit,
      costPerUnit,
      totalCost,
    };

    const updatedIngredients = [...recipe.ingredients, ingredient];
    const totals = calculateTotals(updatedIngredients, recipe.sellingPrice);

    setRecipe({
      ...recipe,
      ingredients: updatedIngredients,
      ...totals,
    });

    setNewIngredient({ name: '', quantity: '', unit: 'g', costPerUnit: '' });
    setShowAddIngredient(false);
  };

  const handleRemoveIngredient = (ingredientId: string) => {
    const updatedIngredients = recipe.ingredients.filter((ing) => ing.id !== ingredientId);
    const totals = calculateTotals(updatedIngredients, recipe.sellingPrice);

    setRecipe({
      ...recipe,
      ingredients: updatedIngredients,
      ...totals,
    });
  };

  const handleUpdateSellingPrice = (value: string) => {
    const sellingPrice = parseFloat(value) || 0;
    const totals = calculateTotals(recipe.ingredients, sellingPrice);

    setRecipe({
      ...recipe,
      sellingPrice,
      ...totals,
    });
  };

  const handleSaveRecipe = async () => {
    if (recipe.ingredients.length === 0) {
      showAlert('Validation', 'Please add at least one ingredient');
      return;
    }

    if (recipe.sellingPrice === 0) {
      showAlert('Validation', 'Please enter a selling price');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        productId: recipe.productId,
        servingSize: recipe.servingSize,
        ingredients: recipe.ingredients,
        sellingPrice: recipe.sellingPrice,
      };

      const response = await apiClient.post('/merchant/recipes', payload);
      if (response.success) {
        showAlert('Success', 'Recipe saved successfully');
        router.back();
      } else {
        showAlert('Error', response.message || 'Failed to save recipe');
      }
    } catch (error) {
      logger.error('Error saving recipe:', error);
      showAlert('Error', error?.message || 'Failed to save recipe');
    } finally {
      setIsSaving(false);
    }
  };

  const getFoodCostColor = (percentage: number): string => {
    if (percentage <= 30) return Colors.light.success;
    if (percentage <= 40) return Colors.light.warning;
    return Colors.light.error;
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <ThemedText style={styles.loadingText}>Loading recipe...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={Colors.light.card} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Recipe: {recipe.productName}</ThemedText>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleSaveRecipe}
          disabled={isSaving}
        >
          <ThemedText style={styles.headerButtonText}>{isSaving ? 'Saving...' : 'Save'}</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Serving Size */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Serving Size</ThemedText>
          <View style={styles.servingContainer}>
            <TextInput
              style={styles.servingInput}
              value={recipe.servingSize.toString()}
              onChangeText={(text) => setRecipe({ ...recipe, servingSize: parseInt(text) || 1 })}
              keyboardType="number-pad"
            />
            <ThemedText style={styles.servingLabel}>person</ThemedText>
          </View>
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Ingredients</ThemedText>
            <TouchableOpacity onPress={() => setShowAddIngredient(true)}>
              <ThemedText style={styles.addLink}>+ Add</ThemedText>
            </TouchableOpacity>
          </View>

          {recipe.ingredients.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="leaf" size={40} color={Colors.light.icon} />
              <ThemedText style={styles.emptyStateText}>No ingredients added yet</ThemedText>
            </View>
          ) : (
            <FlatList
              data={recipe.ingredients}
              renderItem={({ item }) => (
                <View style={styles.ingredientRow}>
                  <View style={styles.ingredientInfo}>
                    <ThemedText style={styles.ingredientName}>{item.name}</ThemedText>
                    <ThemedText style={styles.ingredientDetails}>
                      {item.quantity}
                      {item.unit} × ₹{item.costPerUnit}/{item.unit === 'ml' ? 'litre' : 'kg'} = ₹
                      {item.totalCost.toFixed(2)}
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveIngredient(item.id)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close-circle" size={24} color={Colors.light.error} />
                  </TouchableOpacity>
                </View>
              )}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Calculation Card */}
        <View style={styles.calculationCard}>
          <View style={styles.calculationRow}>
            <ThemedText style={styles.calcLabel}>Total cost:</ThemedText>
            <ThemedText style={styles.calcValue}>₹{recipe.totalCost.toFixed(2)}</ThemedText>
          </View>

          <View style={styles.calculationRow}>
            <ThemedText style={styles.calcLabel}>Selling price:</ThemedText>
            <TextInput
              style={[styles.calcInput, styles.priceInput]}
              placeholder="₹"
              placeholderTextColor={Colors.light.icon}
              keyboardType="decimal-pad"
              value={recipe.sellingPrice > 0 ? recipe.sellingPrice.toString() : ''}
              onChangeText={handleUpdateSellingPrice}
            />
          </View>

          <View
            style={[
              styles.calculationRow,
              {
                backgroundColor: `${getFoodCostColor(recipe.foodCostPercentage)}20`,
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 8,
                marginTop: 12,
              },
            ]}
          >
            <ThemedText style={styles.calcLabel}>Food cost:</ThemedText>
            <ThemedText
              style={[styles.calcValue, { color: getFoodCostColor(recipe.foodCostPercentage) }]}
            >
              {recipe.foodCostPercentage.toFixed(1)}%
            </ThemedText>
          </View>

          <View style={styles.calculationRow}>
            <ThemedText style={styles.calcLabel}>Gross margin:</ThemedText>
            <ThemedText style={styles.calcValue}>{recipe.grossMargin.toFixed(1)}%</ThemedText>
          </View>
        </View>
      </ScrollView>

      {/* Modal: Add Ingredient */}
      <Modal
        visible={showAddIngredient}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddIngredient(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Add Ingredient</ThemedText>
              <TouchableOpacity onPress={() => setShowAddIngredient(false)}>
                <Ionicons name="close" size={28} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Ingredient Name</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="e.g., Chicken"
                placeholderTextColor={Colors.light.icon}
                value={newIngredient.name}
                onChangeText={(text) => setNewIngredient({ ...newIngredient, name: text })}
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <ThemedText style={styles.label}>Quantity</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="200"
                  placeholderTextColor={Colors.light.icon}
                  keyboardType="decimal-pad"
                  value={newIngredient.quantity}
                  onChangeText={(text) => setNewIngredient({ ...newIngredient, quantity: text })}
                />
              </View>

              <View style={[styles.formGroup, { flex: 0.5 }]}>
                <ThemedText style={styles.label}>Unit</ThemedText>
                <View style={styles.unitPicker}>
                  {['g', 'ml', 'piece'].map((unit) => (
                    <TouchableOpacity
                      key={unit}
                      style={[
                        styles.unitOption,
                        newIngredient.unit === unit && styles.unitOptionActive,
                      ]}
                      onPress={() => setNewIngredient({ ...newIngredient, unit })}
                    >
                      <ThemedText
                        style={[
                          styles.unitOptionText,
                          newIngredient.unit === unit && styles.unitOptionTextActive,
                        ]}
                      >
                        {unit}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Cost per Unit (₹/{newIngredient.unit})</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="180"
                placeholderTextColor={Colors.light.icon}
                keyboardType="decimal-pad"
                value={newIngredient.costPerUnit}
                onChangeText={(text) => setNewIngredient({ ...newIngredient, costPerUnit: text })}
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleAddIngredient}>
              <ThemedText style={styles.submitButtonText}>Add Ingredient</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.tint,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.card,
    marginHorizontal: 12,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.light.card,
    borderRadius: 6,
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.tint,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  addLink: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.tint,
  },
  servingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  servingInput: {
    width: 50,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 6,
    fontSize: 16,
    color: Colors.light.text,
  },
  servingLabel: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.light.icon,
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: Colors.light.card,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  ingredientDetails: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  removeButton: {
    marginLeft: 8,
  },
  calculationCard: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 32,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calcLabel: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
  },
  calcValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  calcInput: {
    width: 120,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 4,
    fontSize: 14,
    color: Colors.light.text,
  },
  priceInput: {
    backgroundColor: Colors.light.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: Colors.light.card,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  unitPicker: {
    flexDirection: 'row',
    gap: 6,
  },
  unitOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: Colors.light.card,
  },
  unitOptionActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  unitOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.text,
  },
  unitOptionTextActive: {
    color: Colors.light.card,
  },
  submitButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.card,
  },
});
