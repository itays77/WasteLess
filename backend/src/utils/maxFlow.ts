// Define interfaces for the algorithm

// Enable debugging for easier troubleshooting
const DEBUG_MODE = true;

// Weighted ingredient from the inventory
interface WeightedIngredient {
  id: string;
  name: string;
  weight: number;
  daysUntilExpiry: number;
  originalIngredient?:
    | {
        quantity?: number | string;
        unit?: string;
      }
    | Record<string, never>;
}

// Recipe data structure
interface Recipe {
  id: string;
  title: string;
  image?: string;
  ingredients: string[];
  instructions: string[];
  mealType: string;
  score?: number;
}

// Edge in the flow network
interface Edge {
  capacity: number;
  flow: number;
  expiryWeight?: number;
  matchQuality?: number;
  matchedWith?: string | null;
  quantity?: number;
  unit?: string;
  quantityFactor?: number;
  recipeScore?: number;
  matchedIngredientsCount?: number;
  totalRecipeIngredients?: number;
  coverageRatio?: number;
  mealTypeBoost?: number;
  totalImportance?: number;
  matchedIngredients?: string[];
  normalizedQuantity?: number;
  daysUntilExpiry?: number;
  nutritionBoost?: number;
  nutritionCategory?: string;
  balancedMealBoost?: number;
}

// Graph structure for flow network
interface FlowNetwork {
  vertices: string[];
  edges: Record<string, Edge>;
  filteredRecipes?: Recipe[];
  preferredMealType?: string;
}

// Match result for ingredient matching
interface IngredientMatch {
  ingredient: string | null;
  quality: number;
}

// Recipe score result
interface RecipeScoreResult {
  id: string;
  title: string;
  image?: string;
  score: number;
  mealType: string;
  usedIngredients: string[];
  missedIngredients: string[];
  instructions: string[];
  matchCount?: number;
  totalIngredients?: number;
  expiringIngredients?: number;
}

// Used ingredient with expiry
interface UsedIngredientWithExpiry {
  id: string;
  name: string;
  daysUntilExpiry: number;
  matchQuality: number;
  matchedWith: string | null;
  quantity: number;
  unit: string;
  quantityFactor: number;
}

// Edmonds-Karp algorithm result
interface EdmondsKarpResult {
  flow: number;
  flowPaths: Array<string[]>;
}

// Define nutrition category type
type NutritionCategory = 'protein' | 'vegetables' | 'grains' | 'dairy';

// Build a flow network from weighted ingredients and recipes
function buildFlowNetwork(
  weightedIngredients: WeightedIngredient[],
  recipes: Recipe[],
  preferredMealType: string = 'any'
): FlowNetwork {
  const vertices: string[] = ['s', 't'];

  // Add ingredient vertices
  weightedIngredients.forEach((ing) => vertices.push(`i_${ing.id}`));

  // Filter recipes by meal type if needed
  let filteredRecipes =
    preferredMealType !== 'any'
      ? recipes.filter(
          (recipe) =>
            recipe.mealType === preferredMealType || recipe.mealType === 'any'
        )
      : recipes;

  // Add recipe vertices
  filteredRecipes.forEach((recipe) => vertices.push(`r_${recipe.id}`));

  // Create edges
  const edges: Record<string, Edge> = {};

  // Connect source to ingredients with capacity based on quantity and urgency
  weightedIngredients.forEach((ing) => {
    const edgeId = `s-i_${ing.id}`;
    const originalIngredient = ing.originalIngredient || {};
    const quantity = parseFloat(originalIngredient.quantity?.toString() || '1');
    const unit = originalIngredient.unit || 'unit';

    const normalizedQuantity = normalizeQuantity(quantity, unit);
    const expiryFactor = calculateExpiryFactor(ing.daysUntilExpiry);

    edges[edgeId] = {
      capacity: normalizedQuantity,
      flow: 0,
      expiryWeight: ing.weight * expiryFactor,
      normalizedQuantity,
      daysUntilExpiry: ing.daysUntilExpiry,
    };
  });

  // Connect ingredients to recipes they match with
  filteredRecipes.forEach((recipe) => {
    const recipeId = `r_${recipe.id}`;
    const mealTypeBoost =
      recipe.mealType === preferredMealType
        ? 2.5 // Increased from 2.0 for stronger meal type preference
        : recipe.mealType === 'any'
        ? 1.2
        : 0.8; // Penalty for non-matching meal types
    const matchedIngredients: Array<
      WeightedIngredient & {
        adjustedWeight: number;
        matchQuality: number;
        matchedWith: string;
        quantityFactor: number;
      }
    > = [];

    weightedIngredients.forEach((ingredient) => {
      const ingredientName = ingredient.name.toLowerCase();
      const bestMatch = findBestIngredientMatch(
        ingredientName,
        recipe.ingredients
      );

      // Only consider matches above threshold
      if (bestMatch.quality >= 0.6) {
        const edgeId = `i_${ingredient.id}-${recipeId}`;

        const originalIngredient = ingredient.originalIngredient || {};
        const quantity = parseFloat(
          originalIngredient.quantity?.toString() || '1'
        );
        const unit = originalIngredient.unit || 'unit';

        const normalizedQuantity = normalizeQuantity(quantity, unit);
        const expiryFactor = calculateExpiryFactor(ingredient.daysUntilExpiry);
        const quantityFactor = Math.min(
          3,
          Math.log10(normalizedQuantity + 1) + 1
        );

        const adjustedWeight = calculateIngredientWeight(
          ingredient.weight,
          expiryFactor,
          bestMatch.quality,
          mealTypeBoost,
          quantityFactor
        );

        edges[edgeId] = {
          capacity: normalizedQuantity,
          flow: 0,
          expiryWeight: adjustedWeight,
          matchQuality: bestMatch.quality,
          matchedWith: bestMatch.ingredient,
          quantity,
          unit,
          quantityFactor,
        };

        matchedIngredients.push({
          ...ingredient,
          adjustedWeight,
          matchQuality: bestMatch.quality,
          matchedWith: bestMatch.ingredient || '',
          quantityFactor,
        });
      }
    });

    // Connect recipe to sink with improved recipe evaluation
    const edgeId = `${recipeId}-t`;
    const totalRecipeIngredients = recipe.ingredients.length || 1;
    const coverageRatio = Math.min(
      1.0,
      matchedIngredients.length / totalRecipeIngredients
    );

    // Calculate recipe importance
    const recipeImportance = calculateRecipeImportance(
      matchedIngredients,
      mealTypeBoost,
      totalRecipeIngredients
    );

    edges[edgeId] = {
      capacity: coverageRatio * 100,
      flow: 0,
      recipeScore: recipe.score || 0,
      matchedIngredientsCount: matchedIngredients.length,
      totalRecipeIngredients,
      coverageRatio,
      mealTypeBoost,
      totalImportance: recipeImportance,
      matchedIngredients: matchedIngredients.map((ing: { name: any; }) => ing.name),
    };
  });

  // Create the network
  const network = {
    vertices,
    edges,
    filteredRecipes,
    preferredMealType,
  };

  // Add nutrition nodes
  return addNutritionNodes(network);
}

// Function to add nutrition balance nodes to the network
function addNutritionNodes(network: FlowNetwork): FlowNetwork {
  // Nutrition categories
  const nutritionCategories: NutritionCategory[] = ['protein', 'vegetables', 'grains', 'dairy'];
  
  // Nutrition keywords for classification
  const nutritionKeywords: Record<NutritionCategory, string[]> = {
    protein: [
      'meat',
      'chicken',
      'beef',
      'pork',
      'fish',
      'tofu',
      'lentil',
      'bean',
      'egg',
      'nuts',
      'seed',
      'protein',
    ],
    vegetables: [
      'vegetable',
      'carrot',
      'broccoli',
      'spinach',
      'kale',
      'tomato',
      'pepper',
      'onion',
      'lettuce',
      'cabbage',
      'zucchini',
      'eggplant',
      'cucumber',
      'avocado',
    ],
    grains: [
      'rice',
      'pasta',
      'bread',
      'flour',
      'oat',
      'grain',
      'wheat',
      'quinoa',
      'barley',
      'cereal',
      'corn',
      'couscous',
      'tortilla',
    ],
    dairy: [
      'milk',
      'cheese',
      'yogurt',
      'cream',
      'butter',
      'dairy',
      'cheddar',
      'mozzarella',
      'parmesan',
    ],
  };

  if (DEBUG_MODE) {
    console.log('Adding nutrition nodes to flow network');
  }

  // Add nutrition category vertices
  nutritionCategories.forEach((category) => {
    const nutriVertexId = `n_${category}`;
    network.vertices.push(nutriVertexId);

    // Connect relevant recipes to nutrition categories
    network.filteredRecipes?.forEach((recipe) => {
      const recipeVertexId = `r_${recipe.id}`;

      // Count how many ingredients in this recipe match this nutrition category
      const matchCount = recipe.ingredients.filter((ing) => {
        const ingredientName = ing.toLowerCase();
        return nutritionKeywords[category].some((keyword) =>
          ingredientName.includes(keyword)
        );
      }).length;

      if (matchCount > 0) {
        const edgeId = `${nutriVertexId}-${recipeVertexId}`;

        network.edges[edgeId] = {
          capacity: matchCount,
          flow: 0,
          nutritionBoost: Math.min(1.5, 0.8 + matchCount * 0.2),
          nutritionCategory: category,
        };

        if (DEBUG_MODE) {
          console.log(
            `Connected nutrition ${category} to recipe ${recipe.title} with ${matchCount} matches`
          );
        }
      }
    });
  });

  // Add balanced meal bonus node
  const balancedNodeId = 'balanced_meal';
  network.vertices.push(balancedNodeId);

  // Connect to recipes with multiple nutrition categories
  network.filteredRecipes?.forEach((recipe) => {
    const recipeVertexId = `r_${recipe.id}`;

    // Count how many nutrition categories are present in this recipe
    const nutritionCategoriesPresent = nutritionCategories.filter(
      (category) => {
        const nutriVertexId = `n_${category}`;
        const edgeId = `${nutriVertexId}-${recipeVertexId}`;

        return network.edges[edgeId] !== undefined;
      }
    ).length;

    if (nutritionCategoriesPresent >= 2) {
      // Present in at least 2 categories
      const edgeId = `${balancedNodeId}-${recipeVertexId}`;

      // Scale the boost by the number of nutrition categories present
      const balancedBoost = 1.0 + nutritionCategoriesPresent * 0.2; // 1.4 for 2 categories, up to 1.8 for all 4

      network.edges[edgeId] = {
        capacity: nutritionCategoriesPresent,
        flow: 0,
        balancedMealBoost: balancedBoost,
      };

      if (DEBUG_MODE) {
        console.log(
          `Recipe ${recipe.title} has ${nutritionCategoriesPresent} nutrition categories - balanced meal boost: ${balancedBoost}`
        );
      }
    }
  });

  return network;
}

// Normalize ingredient quantity based on unit
function normalizeQuantity(quantity: number, unit: string): number {
  switch (unit.toLowerCase()) {
    case 'kilo':
    case 'kg':
      return quantity * 1000; // convert to grams
    case 'liter':
    case 'l':
      return quantity * 1000; // convert to ml
    case 'tbsp':
      return quantity * 15; // approx ml in tablespoon
    case 'tsp':
      return quantity * 5; // approx ml in teaspoon
    case 'cup':
      return quantity * 240; // approx ml in a cup
    default:
      return quantity; // keep as is for 'unit', 'piece', etc.
  }
}

// Calculate expiry factor based on days until expiry
function calculateExpiryFactor(daysUntilExpiry: number): number {
  // Binary approach: significant boost if about to expire (<=7 days), otherwise normal weight
  return daysUntilExpiry <= 7 ? 5.0 : 1.0;
}

// Find the best matching ingredient in a recipe - IMPROVED VERSION
function findBestIngredientMatch(
  ingredientName: string,
  recipeIngredients: string[]
): IngredientMatch {
  // Normalize ingredient names for better matching
  const normalizeIngredient = (ing: string): string => {
    return ing
      .toLowerCase()
      .replace(/\s+/g, ' ') // Normalize spaces
      .replace(/\b(of|the|and|&)\b/g, '') // Remove common filler words
      .replace(/[.,;:!?'"()]/g, '') // Remove punctuation
      .trim();
  };

  const inventoryIngNormalized = normalizeIngredient(ingredientName);
  let bestMatch: string | null = null;
  let bestMatchQuality = 0;

  // Log for debugging
  if (DEBUG_MODE) {
    console.log(
      `Finding matches for inventory item: ${ingredientName} (normalized: ${inventoryIngNormalized})`
    );
  }

  for (const recipeIng of recipeIngredients) {
    const recipeIngNormalized = normalizeIngredient(recipeIng);

    if (DEBUG_MODE) {
      console.log(
        `  Comparing with recipe ingredient: ${recipeIng} (normalized: ${recipeIngNormalized})`
      );
    }

    let matchQuality = 0;

    // Exact match
    if (recipeIngNormalized === inventoryIngNormalized) {
      matchQuality = 1.0;
      if (DEBUG_MODE) console.log(`    EXACT MATCH! Quality: ${matchQuality}`);
    }
    // Contains match - one is substring of the other
    else if (
      recipeIngNormalized.includes(inventoryIngNormalized) ||
      inventoryIngNormalized.includes(recipeIngNormalized)
    ) {
      // If one is a substring of the other, score based on length similarity
      const lengthRatio = Math.min(
        inventoryIngNormalized.length / recipeIngNormalized.length,
        recipeIngNormalized.length / inventoryIngNormalized.length
      );
      matchQuality = 0.7 + lengthRatio * 0.25; // 0.7 to 0.95
      if (DEBUG_MODE)
        console.log(`    CONTAINS MATCH! Quality: ${matchQuality}`);
    }
    // Word match - check if any significant word matches
    else {
      const inventoryWords = inventoryIngNormalized
        .split(' ')
        .filter((w) => w.length > 2);
      const recipeWords = recipeIngNormalized
        .split(' ')
        .filter((w) => w.length > 2);

      for (const inventoryWord of inventoryWords) {
        for (const recipeWord of recipeWords) {
          if (
            inventoryWord === recipeWord ||
            (inventoryWord.length > 4 && recipeWord.includes(inventoryWord)) ||
            (recipeWord.length > 4 && inventoryWord.includes(recipeWord))
          ) {
            const wordImportance = Math.min(
              0.9,
              0.6 + inventoryWord.length * 0.05
            );
            matchQuality = Math.max(matchQuality, wordImportance);
            if (DEBUG_MODE)
              console.log(
                `    WORD MATCH on "${inventoryWord}"! Quality: ${matchQuality}`
              );
          }
        }
      }
    }

    if (matchQuality > bestMatchQuality) {
      bestMatchQuality = matchQuality;
      bestMatch = recipeIng;
    }
  }

  if (DEBUG_MODE && bestMatch) {
    console.log(
      `  Best match for ${ingredientName}: "${bestMatch}" with quality ${bestMatchQuality}`
    );
  }

  return { ingredient: bestMatch, quality: bestMatchQuality };
}

// Calculate ingredient weight
function calculateIngredientWeight(
  baseWeight: number,
  expiryFactor: number,
  matchQuality: number,
  mealTypeBoost: number,
  quantityFactor: number
): number {
  // Refined balance for different factors
  const expiryWeight = expiryFactor * 0.45; // Increased weight for expiry
  const matchWeight = matchQuality * 0.15; // Reasonable weight for match quality
  const mealTypeWeight = mealTypeBoost * 0.2 * quantityFactor; // Factor in meal type and quantity
  const baseFactorWeight = baseWeight * 0.2; // Base ingredient weight

  // Combined score with improved balance
  return baseFactorWeight + expiryWeight + matchWeight + mealTypeWeight;
}

// Calculate recipe importance
function calculateRecipeImportance(
  matchedIngredients: Array<
    WeightedIngredient & {
      adjustedWeight: number;
      matchQuality: number;
      matchedWith: string;
      quantityFactor: number;
    }
  >,
  mealTypeBoost: number,
  totalIngredients: number
): number {
  if (matchedIngredients.length === 0) return 0.1 * mealTypeBoost;

  // Calculate average urgency of matched ingredients with higher weight
  let totalUrgency = 0;
  matchedIngredients.forEach((ingredient) => {
    const expiryUrgency = Math.max(1, 10 - (ingredient.daysUntilExpiry || 0));
    totalUrgency += (ingredient.adjustedWeight || 1) * (expiryUrgency / 10);
  });

  // Calculate match percentage with better weighting
  const matchPercentage = matchedIngredients.length / totalIngredients;

  // Combine factors with expiry urgency having higher importance
  return (totalUrgency * 0.6 + matchPercentage * 0.4) * mealTypeBoost;
}

// Find optimal recipe and alternatives using Edmonds-Karp algorithm
function findOptimalRecipeWithAlternatives(
  graph: FlowNetwork,
  weightedIngredients: WeightedIngredient[],
  recipes: Recipe[],
  count: number = 4
): RecipeScoreResult[] {
  try {
    const filteredRecipes = graph.filteredRecipes || recipes;
    const preferredMealType = graph.preferredMealType || 'any';

    // Run max flow algorithm
    const { flow, flowPaths } = edmondsKarp(graph, 's', 't');

    // Calculate scores for each recipe
    const recipeScores = filteredRecipes.map((recipe) => {
      const recipeId = `r_${recipe.id}`;
      const usedIngredientsWithExpiry: UsedIngredientWithExpiry[] = [];
      const matchedIngredientIds = new Set<string>();

      // Get meal type boost (stronger than before)
      const mealTypeBoost =
        recipe.mealType === preferredMealType
          ? 2.5 // Much stronger boost for exact match
          : recipe.mealType === 'any'
          ? 1.2 // Small boost for flexible recipes
          : 0.8; // Penalty for non-matching meal types

      // Find ingredients connected to this recipe
      weightedIngredients.forEach((ingredient) => {
        const ingredientId = `i_${ingredient.id}`;
        const edgeId = `${ingredientId}-${recipeId}`;

        if (graph.edges[edgeId]) {
          const edge = graph.edges[edgeId];

          // Consider ingredient as used if positive flow or high match quality
          if ((edge.flow || 0) > 0 || (edge.matchQuality || 0) >= 0.7) {
            if (!matchedIngredientIds.has(ingredient.id)) {
              matchedIngredientIds.add(ingredient.id);

              const originalIngredient = ingredient.originalIngredient || {};
              const quantity = parseFloat(
                originalIngredient.quantity?.toString() || '1'
              );
              const unit = originalIngredient.unit || 'unit';

              usedIngredientsWithExpiry.push({
                id: ingredient.id,
                name: ingredient.name,
                daysUntilExpiry: ingredient.daysUntilExpiry,
                matchQuality: edge.matchQuality || 0.7,
                matchedWith: edge.matchedWith || null,
                quantity,
                unit,
                quantityFactor:
                  edge.quantityFactor ||
                  Math.min(3, Math.log10(quantity + 1) + 1),
              });
            }
          }
        }
      });

      // Collect nutrition information for this recipe
      const nutritionCategories: string[] = [];
      const nutritionBoosts: Record<string, number> = {};

      // Check which nutrition categories apply to this recipe
      ['protein', 'vegetables', 'grains', 'dairy'].forEach((category) => {
        const nutriVertexId = `n_${category}`;
        const edgeId = `${nutriVertexId}-${recipeId}`;

        if (graph.edges[edgeId]) {
          nutritionCategories.push(category);
          nutritionBoosts[category] = graph.edges[edgeId].nutritionBoost || 1.0;
        }
      });

      // CHANGE: We're removing the balanced meal boost by setting it to 1.0 always
      const balancedMealBoost = 1.0;

      // Calculate score with all factors
      const normalizedScore = calculateRecipeScore(
        recipe,
        usedIngredientsWithExpiry,
        mealTypeBoost,
        { categories: nutritionCategories, boosts: nutritionBoosts },
        balancedMealBoost
      );

      // Calculate missing ingredients more accurately
      const usedIngredientMatches = new Set<string>();

      // Track matched recipe ingredients by their original form
      usedIngredientsWithExpiry.forEach((ing) => {
        if (ing.matchedWith) {
          usedIngredientMatches.add(ing.matchedWith.toLowerCase());
        }
      });

      // Find truly missing ingredients (not covered by any inventory item)
      const missedIngredients = recipe.ingredients.filter((recipeIng) => {
        const normalized = recipeIng.toLowerCase();
        return !usedIngredientMatches.has(normalized);
      });

      // FIX: De-duplicate the usedIngredients list
      const uniqueUsedIngredients = [...new Set(
        usedIngredientsWithExpiry.map((ing) => ing.matchedWith || ing.name)
      )];

      return {
        id: recipe.id,
        title: recipe.title,
        image: recipe.image,
        score: Math.round(normalizedScore),
        mealType: recipe.mealType || 'any',
        usedIngredients: uniqueUsedIngredients, // Use the de-duplicated list
        missedIngredients,
        instructions: recipe.instructions || [],
        // Add metadata for UI display
        matchCount: uniqueUsedIngredients.length, // Update this to use the deduplicated count
        totalIngredients: recipe.ingredients.length,
        // Count expiring ingredients (using binary definition ≤7 days)
        expiringIngredients: usedIngredientsWithExpiry.filter(
          (ing) => ing.daysUntilExpiry <= 7
        ).length,
      };
    });

    // Get valid recipes and sort by score
    let validRecipes = recipeScores.filter(
      (recipe) => recipe.usedIngredients.length > 0
    );

    // Fallback if no recipes found
    if (validRecipes.length === 0) {
      validRecipes = filteredRecipes
        .map((recipe) => {
          const mealTypeBoost =
            recipe.mealType === preferredMealType ? 2.5 : 1.2;
          return {
            id: recipe.id,
            title: recipe.title,
            image: recipe.image,
            score: Math.round(
              Math.min(100, (Math.random() * 30 + 15) * mealTypeBoost)
            ),
            mealType: recipe.mealType || 'any',
            usedIngredients: [],
            missedIngredients: recipe.ingredients || [],
            instructions: recipe.instructions || [],
            matchCount: 0,
            totalIngredients: recipe.ingredients.length,
            expiringIngredients: 0,
          };
        })
        .slice(0, count);
    }

    // Sort by score and return top results
    validRecipes.sort((a, b) => b.score - a.score);

    // Apply normalization to create better score differentiation
    const normalizeScores = (
      recipes: RecipeScoreResult[]
    ): RecipeScoreResult[] => {
      // Find min and max scores
      const scores = recipes.map((r) => r.score);
      const minScore = Math.min(...scores);
      const maxScore = Math.max(...scores);

      // If all scores are the same, apply random variance
      if (minScore === maxScore) {
        return recipes.map((recipe) => ({
          ...recipe,
          score: Math.min(
            100,
            Math.max(1, Math.round(recipe.score * (0.85 + Math.random() * 0.3)))
          ),
        }));
      }

      // Apply a curve to enhance differences (use exponential function)
      return recipes.map((recipe) => {
        // Normalize to 0-1 range
        const normalizedScore =
          (recipe.score - minScore) / (maxScore - minScore);

        // Apply non-linear transformation to increase spread
        const enhancedNormalizedScore = Math.pow(normalizedScore, 0.7);

        // Convert back to original range, then to 0-100 scale
        const newScore = Math.round(
          minScore + enhancedNormalizedScore * (maxScore - minScore)
        );

        return {
          ...recipe,
          score: Math.min(100, newScore), // Cap at 100
        };
      });
    };

    const finalRecipes = normalizeScores(validRecipes).slice(0, count);

    if (DEBUG_MODE) {
      console.log('Final recipe recommendations:');
      finalRecipes.forEach((recipe) => {
        console.log(
          `- ${recipe.title}: score=${recipe.score}, used=${recipe.usedIngredients.length}, missed=${recipe.missedIngredients.length}`
        );
      });
    }

    return finalRecipes;
  } catch (error) {
    console.error('Error in recipe recommendation algorithm:', error);

    // Return fallback recipes on error
    const mealTypeFilter = graph.preferredMealType || 'any';
    const filteredRecipes =
      mealTypeFilter !== 'any'
        ? recipes.filter(
            (r) => r.mealType === mealTypeFilter || r.mealType === 'any'
          )
        : recipes;

    return filteredRecipes.slice(0, count).map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      score: Math.round(
        Math.min(
          100,
          ((recipe.score || 0) * 10 || 25) *
            (recipe.mealType === mealTypeFilter ? 1.5 : 1.0)
        )
      ),
      mealType: recipe.mealType || 'any',
      usedIngredients: [],
      missedIngredients: recipe.ingredients || [],
      instructions: recipe.instructions || [],
      matchCount: 0,
      totalIngredients: recipe.ingredients.length,
      expiringIngredients: 0,
    }));
  }
}

// Calculate recipe score with improved balance between factors
function calculateRecipeScore(
  recipe: Recipe,
  usedIngredientsWithExpiry: UsedIngredientWithExpiry[],
  mealTypeBoost: number,
  nutritionInfo: {
    categories: string[];
    boosts: Record<string, number>;
  } = { categories: [], boosts: {} },
  balancedMealBoost: number = 1.0 // This parameter is now ignored since we're removing balanced meal boost
): number {
  const totalRecipeIngredients = recipe.ingredients.length;

  // If no ingredients are used, return a minimal score
  if (usedIngredientsWithExpiry.length === 0) {
    return Math.min(
      25,
      (recipe.score || 0 ? (recipe.score || 0) * 1.5 : 15) *
        mealTypeBoost
    );
  }

  // Group ingredients with binary expiry approach (<=7 days is "about to expire")
  const expiringIngredients = usedIngredientsWithExpiry.filter(
    (ing) => ing.daysUntilExpiry <= 7
  );
  const nonExpiringIngredients = usedIngredientsWithExpiry.filter(
    (ing) => ing.daysUntilExpiry > 7
  );

  // Calculate match quality (precision score)
  const matchQualitySum = usedIngredientsWithExpiry.reduce(
    (sum, ing) => sum + (ing.matchQuality || 0),
    0
  );
  const avgMatchQuality =
    matchQualitySum / usedIngredientsWithExpiry.length || 0;

  // Calculate missing ingredients
  const usedIngredientMatches = new Set(
    usedIngredientsWithExpiry.map((ing) => ing.matchedWith?.toLowerCase() || '')
  );
  const missedIngredients = recipe.ingredients.filter(
    (recipeIng) => !usedIngredientMatches.has(recipeIng.toLowerCase())
  );

  // CRITICAL CHECK: Determine if this is a perfect match (no missing ingredients)
  const isPerfectMatch =
    missedIngredients.length === 0 &&
    usedIngredientsWithExpiry.length >= totalRecipeIngredients;

  // FIX: Calculate recipe coverage ratio (what percentage of recipe ingredients we have)
  const coverageRatio =
    usedIngredientsWithExpiry.length / Math.max(1, totalRecipeIngredients);

  // Calculate the percentage of expiring ingredients in the recipe
  const expiryRatio = expiringIngredients.length / Math.max(1, usedIngredientsWithExpiry.length);

  // NEW: Calculate absolute score cap based on expiring ingredients
  // This ensures recipes with more expiring ingredients ALWAYS score higher
  // Start with 70 as base and add up to 30 points based on expiring ingredients
  const expiryBasedMaxScore = 70 + Math.min(30, expiringIngredients.length * 10);
  
  // FIX: Cap the maximum possible score based on coverage ratio AND expiring ingredients
  // A recipe using very few ingredients should never get a perfect score
  const maxPossibleScore = isPerfectMatch
    ? Math.min(100, expiryBasedMaxScore) // Perfect matches can reach up to the expiry-based max
    : Math.min(
        expiryBasedMaxScore - 8, // Non-perfect matches get a slight penalty
        // Scale based on coverage ratio
        60 + Math.round(coverageRatio * 32) - missedIngredients.length * 3
      );

  // Base match quality score (0-10 points, with decimal precision)
  const qualityScore = 10 * avgMatchQuality;

  // FIX: Adjust expiry bonus to be proportional to the recipe size
  // Small recipe with 1 expiring ingredient shouldn't get too much boost
  const expiryBoostPerItem = Math.min(7.5, 15 / Math.max(1, totalRecipeIngredients));
  
  // ENHANCED: Expiry bonus now includes both count and ratio for better scaling
  const expiryBonus = 
    (expiringIngredients.length * expiryBoostPerItem) + // Base per-item bonus
    (expiryRatio * 20); // Additional bonus for high percentage of expiring items

  // Calculate precise coverage bonus (range from 0-20, with decimals)
  const coverageFactor = Math.pow(coverageRatio, 1.25); // Slightly exponential to reward high coverage
  const coverageBonus = 20 * coverageFactor;

  // Calculate meal type bonus with more precision
  const mealTypeFactor = mealTypeBoost - 1.0;
  const mealTypeBonus = 15 * mealTypeFactor;

  // Nutrition bonus
  let nutritionBonus = 0;
  nutritionInfo.categories.forEach((category) => {
    nutritionBonus += (nutritionInfo.boosts[category] || 1.0) * 4;
  });

  // REMOVED: Balanced meal bonus is removed

  // Calculate missing ingredients penalty (exponential to penalize more missing items)
  const missingRatio =
    missedIngredients.length / Math.max(1, totalRecipeIngredients);
  const missingExponent = Math.min(2, 1 + missingRatio);
  const missingPenalty = Math.pow(
    missedIngredients.length * 3.5,
    missingExponent
  );

  // Base score considering all factors with fractional precision
  const baseScore =
    15 * Math.min(1, usedIngredientsWithExpiry.length / 3) + // Score for number of ingredients used (capped)
    qualityScore +
    8 * Math.min(1, coverageRatio * 1.5) + // Score for recipe coverage
    expiryBonus + // Combined expiry bonus
    coverageBonus + // Coverage bonus
    mealTypeBonus + // Meal type preference bonus
    nutritionBonus; // Nutrition categories bonus
    // Balanced meal bonus removed

  // Subtract the missing ingredients penalty
  let finalScore = baseScore - missingPenalty;

  // Perfect match bonus (only for recipes with no missing ingredients)
  if (isPerfectMatch) finalScore += 12;

  // FIX: Add a penalty for recipes that use very few ingredients
  // This ensures recipes using only 1-2 ingredients from a large inventory get penalized
  if (usedIngredientsWithExpiry.length < 3) {
    finalScore -= (3 - usedIngredientsWithExpiry.length) * 15;
  }

  // BOOST: Add a special bonus for recipes with 3+ expiring ingredients
  if (expiringIngredients.length >= 3) {
    finalScore += 15;
  }

  // Apply a small random factor to break ties and ensure differentiation
  const randomFactor = Math.random() * 2 - 1; // ±1 random factor

  // Calculate minimum score floor for critical items, but cap it lower for recipes with few ingredients
  const criticalItemsFloor = Math.min(
    isPerfectMatch ? 75 : 70 - missedIngredients.length * 2,
    expiringIngredients.length * Math.min(8.5, 25 / totalRecipeIngredients) +
      Math.sqrt(
        expiringIngredients.reduce((sum, ing) => sum + (ing.quantity || 1), 0)
      ) * 2.5
  );

  // Take the maximum of the calculated score or critical items floor
  finalScore = Math.max(criticalItemsFloor, finalScore) + randomFactor;

  // Apply meal type boost as a final multiplier for exact matches
  if (mealTypeBoost > 2.0) {
    // Only for exact meal type matches
    finalScore *= 1.1; // Additional 10% boost
  }
  
  // NEW: Apply a boost based on number of expiring ingredients
  // This makes sure recipes with more expiring ingredients always score higher
  finalScore += expiringIngredients.length * 3;

  // Ensure score is between 0 and the maximum possible score for this recipe
  return Math.min(maxPossibleScore, Math.max(0, Math.round(finalScore)));
}
// Edmonds-Karp algorithm for finding maximum flow in a network
function edmondsKarp(
  graph: FlowNetwork,
  source: string,
  sink: string
): EdmondsKarpResult {
  try {
    const { vertices, edges } = graph;
    let flow = 0;
    const flowPaths: Array<string[]> = [];

    // Create residual network
    const residualEdges: Record<string, Edge> = JSON.parse(
      JSON.stringify(edges)
    );

    // Add reverse edges
    Object.keys(edges).forEach((edgeId) => {
      const [from, to] = edgeId.split('-');
      const reverseEdgeId = `${to}-${from}`;
      if (!residualEdges[reverseEdgeId]) {
        residualEdges[reverseEdgeId] = {
          capacity: 0,
          flow: 0,
          expiryWeight: edges[edgeId].expiryWeight || 0,
        };
      }
    });

    // Find augmenting paths
    let path: string[] | null;
    let pathCount = 0;
    const maxPaths = 100; // Limit path count to prevent infinite loops

    while (
      pathCount < maxPaths &&
      (path = bfs(vertices, residualEdges, source, sink))
    ) {
      pathCount++;
      flowPaths.push(path);

      // Find minimum capacity in path
      let minCapacity = Infinity;
      for (let i = 0; i < path.length - 1; i++) {
        const edgeId = `${path[i]}-${path[i + 1]}`;
        minCapacity = Math.min(
          minCapacity,
          residualEdges[edgeId].capacity - residualEdges[edgeId].flow
        );
      }

      // Update flow values
      for (let i = 0; i < path.length - 1; i++) {
        const edgeId = `${path[i]}-${path[i + 1]}`;
        const reverseEdgeId = `${path[i + 1]}-${path[i]}`;

        residualEdges[edgeId].flow += minCapacity;
        residualEdges[reverseEdgeId].flow -= minCapacity;
      }

      flow += minCapacity;
    }

    // Update original graph with flow values
    Object.keys(residualEdges).forEach((edgeId) => {
      if (edges[edgeId]) edges[edgeId].flow = residualEdges[edgeId].flow;
    });

    return { flow, flowPaths };
  } catch (error) {
    console.error('Error in Edmonds-Karp algorithm:', error);
    return { flow: 0, flowPaths: [] };
  }
}

// BFS to find augmenting paths in the residual graph
function bfs(
  vertices: string[],
  edges: Record<string, Edge>,
  source: string,
  sink: string
): string[] | null {
  try {
    const queue: string[] = [source];
    const visited: Record<string, boolean> = { [source]: true };
    const parent: Record<string, string> = {};

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current === sink) {
        // Reconstruct path
        const path: string[] = [sink];
        let node = sink;
        while (node !== source) {
          node = parent[node];
          path.unshift(node);
        }
        return path;
      }

      // Check outgoing edges
      for (const vertex of vertices) {
        if (visited[vertex]) continue;

        const edgeId = `${current}-${vertex}`;
        const edge = edges[edgeId];

        if (edge && edge.capacity > edge.flow) {
          visited[vertex] = true;
          parent[vertex] = current;
          queue.push(vertex);
        }
      }
    }

    return null; // No path found
  } catch (error) {
    console.error('Error in BFS algorithm:', error);
    return null;
  }
}

// Calculate Levenshtein distance between two strings
function levenshteinDistance(a: string, b: string): number {
  if (!a) return b ? b.length : 0;
  if (!b) return a.length;

  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b.charAt(i - 1) === a.charAt(j - 1)
          ? matrix[i - 1][j - 1]
          : Math.min(
              matrix[i - 1][j - 1] + 1, // substitution
              matrix[i][j - 1] + 1, // insertion
              matrix[i - 1][j] + 1 // deletion
            );
    }
  }

  return matrix[b.length][a.length];
}

export {
  buildFlowNetwork,
  findOptimalRecipeWithAlternatives,
  edmondsKarp,
  levenshteinDistance,
  // Exporting interface types for use in other files
  type WeightedIngredient,
  type Recipe,
  type RecipeScoreResult,
  type FlowNetwork,
};