import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetRecipeById } from '../api/RecipeApi';
import { useGetInventory } from '../api/InventoryApi';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import {
  ArrowLeft,
  Check,
  ChefHat,
  Clock,
  CookingPot,
  ShoppingBag,
  XCircle,
} from 'lucide-react';

// Debug mode for troubleshooting
const DEBUG_MODE = true;

const RecipeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { recipe, isLoading } = useGetRecipeById(id);
  const { ingredients, isLoading: isLoadingIngredients } = useGetInventory();

  const [activeTab, setActiveTab] = useState('ingredients');

  if (isLoading || isLoadingIngredients) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button
          onClick={() => navigate(-1)}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/2">
            <Skeleton className="w-full h-80 rounded-lg mb-4" />
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-6" />

            <div className="flex gap-2 mb-6">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-28" />
            </div>

            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          <div className="md:w-1/2">
            <Skeleton className="h-8 w-1/2 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-6" />

            <Skeleton className="h-8 w-1/2 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button
          onClick={() => navigate(-1)}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <Card className="text-center p-6">
          <p className="text-muted-foreground mb-4">
            Recipe not found. The recipe may have been removed or you may have
            followed an invalid link.
          </p>
          <Button
            onClick={() => navigate('/recipes/recommended')}
            className="flex items-center gap-2"
          >
            <ChefHat className="h-4 w-4" />
            View Recommended Recipes
          </Button>
        </Card>
      </div>
    );
  }

  // Helper function to check if an ingredient is in the user's inventory
  const isIngredientInInventory = (recipeIngredient: string) => {
    if (!ingredients) return false;

    // Get the normalized version of the recipe ingredient
    const normalizeIngredient = (ing: string): string => {
      return ing
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/\b(of|the|and|&)\b/g, '')
        .replace(/[.,;:!?'"()]/g, '')
        .trim();
    };

    const normalizedRecipeIng = normalizeIngredient(recipeIngredient);

    if (DEBUG_MODE) {
      console.log(
        `Checking if "${recipeIngredient}" (normalized: "${normalizedRecipeIng}") is in inventory`
      );
    }

    // Try to find a match in inventory
    const match = ingredients.some((invIng) => {
      const normalizedInvIng = normalizeIngredient(invIng.name);

      // Check for exact match, contains match, or word match
      if (normalizedInvIng === normalizedRecipeIng) {
        if (DEBUG_MODE) console.log(`  EXACT MATCH with "${invIng.name}"`);
        return true;
      }

      if (normalizedInvIng.includes(normalizedRecipeIng)) {
        if (DEBUG_MODE)
          console.log(
            `  CONTAINS MATCH: "${invIng.name}" contains "${recipeIngredient}"`
          );
        return true;
      }

      if (normalizedRecipeIng.includes(normalizedInvIng)) {
        if (DEBUG_MODE)
          console.log(
            `  CONTAINS MATCH: "${recipeIngredient}" contains "${invIng.name}"`
          );
        return true;
      }

      // Check for word match
      const invWords = normalizedInvIng.split(' ').filter((w) => w.length > 2);
      const recipeWords = normalizedRecipeIng
        .split(' ')
        .filter((w) => w.length > 2);

      const wordMatch = invWords.some((invWord) =>
        recipeWords.some((recipeWord) => {
          const matches =
            invWord === recipeWord ||
            (invWord.length > 4 && recipeWord.includes(invWord)) ||
            (recipeWord.length > 4 && invWord.includes(recipeWord));

          if (matches && DEBUG_MODE) {
            console.log(`  WORD MATCH on "${invWord}" and "${recipeWord}"`);
          }

          return matches;
        })
      );

      return wordMatch;
    });

    return match;
  };

  // Find ingredient in inventory to get expiry information
  const getIngredientDetails = (recipeIngredient: string) => {
    if (!ingredients) return null;

    // Normalize strings for comparison
    const normalizeIngredient = (ing: string): string => {
      return ing
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/\b(of|the|and|&)\b/g, '')
        .replace(/[.,;:!?'"()]/g, '')
        .trim();
    };

    const normalizedRecipeIng = normalizeIngredient(recipeIngredient);

    // Find best match in inventory
    let bestMatch = null;
    let bestMatchScore = 0;

    for (const invIng of ingredients) {
      const normalizedInvIng = normalizeIngredient(invIng.name);
      let matchScore = 0;

      // Exact match
      if (normalizedInvIng === normalizedRecipeIng) {
        matchScore = 1.0;
      }
      // Contains match
      else if (
        normalizedInvIng.includes(normalizedRecipeIng) ||
        normalizedRecipeIng.includes(normalizedInvIng)
      ) {
        const lengthRatio = Math.min(
          normalizedInvIng.length / normalizedRecipeIng.length,
          normalizedRecipeIng.length / normalizedInvIng.length
        );
        matchScore = 0.7 + lengthRatio * 0.25;
      }
      // Word match
      else {
        const invWords = normalizedInvIng
          .split(' ')
          .filter((w) => w.length > 2);
        const recipeWords = normalizedRecipeIng
          .split(' ')
          .filter((w) => w.length > 2);

        for (const invWord of invWords) {
          for (const recipeWord of recipeWords) {
            if (
              invWord === recipeWord ||
              (invWord.length > 4 && recipeWord.includes(invWord)) ||
              (recipeWord.length > 4 && invWord.includes(recipeWord))
            ) {
              const wordImportance = Math.min(0.9, 0.6 + invWord.length * 0.05);
              matchScore = Math.max(matchScore, wordImportance);
            }
          }
        }
      }

      if (matchScore > bestMatchScore) {
        bestMatchScore = matchScore;
        bestMatch = invIng;
      }
    }

    // Only return matches that are good enough
    return bestMatchScore >= 0.6 ? bestMatch : null;
  };

  // Helper function to get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'dry':
        return 'bg-amber-100 text-amber-800';
      case 'vegetable':
        return 'bg-green-100 text-green-800';
      case 'fruit':
        return 'bg-orange-100 text-orange-800';
      case 'dairy':
        return 'bg-blue-100 text-blue-800';
      case 'meat':
        return 'bg-red-100 text-red-800';
      case 'frozen':
        return 'bg-cyan-100 text-cyan-800';
      case 'bakery':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate actual match counts
  const matchedIngredients = recipe.ingredients.filter(isIngredientInInventory);
  const matchCount = matchedIngredients.length;
  const missingCount = recipe.ingredients.length - matchCount;

  if (DEBUG_MODE) {
    console.log(
      `Recipe "${recipe.title}" has ${matchCount} matching ingredients and ${missingCount} missing ingredients`
    );
    console.log('Matched ingredients:', matchedIngredients);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        onClick={() => navigate(-1)}
        variant="outline"
        size="sm"
        className="flex items-center gap-2 mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left column - Image and Info */}
        <div className="md:w-1/2">
          {recipe.image && (
            <img
              src={recipe.image}
              alt={recipe.title}
              className="w-full rounded-lg mb-4 max-h-80 object-cover"
            />
          )}

          <h1 className="text-3xl font-bold mb-2">{recipe.title}</h1>

          <div className="flex gap-2 mb-4">
            <Badge className="bg-gray-600 hover:bg-gray-700">
              {recipe.mealType.charAt(0).toUpperCase() +
                recipe.mealType.slice(1)}
            </Badge>
            <Badge className="bg-green-600 hover:bg-green-700">
              {matchCount} / {recipe.ingredients.length} ingredients in your
              inventory
            </Badge>
          </div>

          <div className="flex gap-2 mb-6">
            <Button
              variant={activeTab === 'ingredients' ? 'default' : 'outline'}
              onClick={() => setActiveTab('ingredients')}
              className="flex items-center gap-2"
            >
              <ShoppingBag className="h-4 w-4" />
              Ingredients
            </Button>
            <Button
              variant={activeTab === 'instructions' ? 'default' : 'outline'}
              onClick={() => setActiveTab('instructions')}
              className="flex items-center gap-2"
            >
              <CookingPot className="h-4 w-4" />
              Instructions
            </Button>
          </div>

          {/* Tabs content */}
          {activeTab === 'ingredients' ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Ingredients</h2>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => {
                  const inInventory = isIngredientInInventory(ingredient);
                  const details = getIngredientDetails(ingredient);

                  return (
                    <li key={index} className="flex items-center gap-2">
                      {inInventory ? (
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      )}
                      <span
                        className={
                          inInventory ? 'font-medium' : 'text-gray-600'
                        }
                      >
                        {ingredient}
                      </span>

                      {details && (
                        <div className="flex items-center ml-auto">
                          <Badge
                            variant="outline"
                            className={getCategoryColor(details.category)}
                          >
                            {details.category}
                          </Badge>

                          {details.aboutToExpire && (
                            <Badge className="ml-2 bg-yellow-100 text-yellow-800 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Expiring soon
                            </Badge>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>

              {missingCount > 0 && (
                <Card className="bg-yellow-50 border-yellow-100 mt-4">
                  <CardContent className="pt-6">
                    <p className="text-yellow-800">
                      <strong>Missing ingredients:</strong> You're missing{' '}
                      {missingCount} out of {recipe.ingredients.length}{' '}
                      ingredients for this recipe.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Instructions</h2>
              <ol className="space-y-4 list-decimal list-inside">
                {recipe.instructions.map((step, index) => (
                  <li key={index} className="pl-2">
                    <span className="ml-2">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Right column - Inventory Matches */}
        <div className="md:w-1/2">
          <Card>
            <CardHeader>
              <CardTitle>Your Inventory Matches</CardTitle>
              <CardDescription>
                See which ingredients you already have and what you might need
                to buy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Ingredients in inventory */}
                <div>
                  <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    Ingredients You Have
                  </h3>

                  {matchCount > 0 ? (
                    <div className="space-y-3">
                      {matchedIngredients.map((ingredient, index) => {
                        const details = getIngredientDetails(ingredient);

                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              {details && (
                                <Badge
                                  variant="outline"
                                  className={getCategoryColor(details.category)}
                                >
                                  {details.category}
                                </Badge>
                              )}
                              <span>{ingredient}</span>
                            </div>

                            {details?.aboutToExpire && (
                              <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Expiring soon
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">
                      You don't have any ingredients for this recipe in your
                      inventory.
                    </p>
                  )}
                </div>

                {/* Missing ingredients */}
                {missingCount > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-500" />
                      Ingredients To Buy
                    </h3>

                    <div className="space-y-2">
                      {recipe.ingredients
                        .filter((ing) => !isIngredientInInventory(ing))
                        .map((ingredient, index) => (
                          <div key={index} className="flex items-center">
                            <span>{ingredient}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Tips */}
                <Card className="bg-green-50 border-green-100">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <ChefHat className="h-6 w-6 text-green-700 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-medium text-green-800 mb-1">
                          Recipe Tips
                        </h4>
                        <p className="text-sm text-green-700">
                          {matchCount === recipe.ingredients.length
                            ? 'Great choice! You have all the ingredients for this recipe.'
                            : matchCount > recipe.ingredients.length / 2
                            ? `You have most of the ingredients for this recipe. Just need to get ${missingCount} more!`
                            : `This recipe requires several ingredients you don't have in your inventory.`}
                        </p>

                        {recipe.ingredients.some((ing) => {
                          const details = getIngredientDetails(ing);
                          return details?.aboutToExpire;
                        }) && (
                          <p className="text-sm text-green-700 mt-2">
                            This recipe uses ingredients that will expire soon -
                            perfect for reducing food waste!
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetailPage;
