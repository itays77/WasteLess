import { Request, Response } from 'express';
import Recipe from '../models/recipe';
import RecipeRecommendationService from '../services/RecipeRecommendationService';

// Get all recipes (with pagination and filtering)
const getRecipes = async (req: Request, res: Response) => {
  try {
    const { mealType, page = 1, limit = 20, search } = req.query;

    // Build query
    let query: any = {};
    if (mealType && mealType !== 'any') {
      query.mealType = mealType;
    }
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query
    const recipes = await Recipe.find(query)
      .skip(skip)
      .limit(Number(limit))
      .sort({ title: 1 });

    // Count total matching recipes
    const total = await Recipe.countDocuments(query);

    res.status(200).json({
      recipes,
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      totalRecipes: total,
    });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ message: 'Error fetching recipes' });
  }
};

// Get a specific recipe by ID
const getRecipeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const recipe = await Recipe.findById(id);

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    res.status(200).json(recipe);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ message: 'Error fetching recipe' });
  }
};

// Get recommended recipes based on user's inventory with enhanced options
const getRecommendedRecipes = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    // If userId is undefined, return an unauthorized error
    if (!userId) {
      return res.status(401).json({ message: 'User ID is required' });
    }

    // Get parameters from query
    const {
      mealType = 'any',
      count = 5,
      prioritizeExpiring = 'true',
      includeIngredients = '',
    } = req.query;

    // Parse parameters
    const prioritizeExpiringBool = prioritizeExpiring === 'true';
    const selectedIngredients = includeIngredients
      ? (includeIngredients as string).split(',').filter(Boolean)
      : [];

    // Create options object
    const options = {
      mealType: mealType as string,
      prioritizeExpiring: prioritizeExpiringBool,
      selectedIngredients:
        selectedIngredients.length > 0 ? selectedIngredients : undefined,
    };

    // Get recommendations with enhanced options
    const recommendedRecipes =
      await RecipeRecommendationService.getRecommendedRecipes(
        userId,
        options,
        Number(count)
      );

    res.status(200).json(recommendedRecipes);
  } catch (error) {
    console.error('Error getting recommended recipes:', error);
    res.status(500).json({ message: 'Error getting recommended recipes' });
  }
};

export default {
  getRecipes,
  getRecipeById,
  getRecommendedRecipes,
};
