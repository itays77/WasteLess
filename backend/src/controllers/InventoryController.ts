import { Request, Response } from 'express';
import Ingredient, { IngredientCategory } from '../models/ingredient';

// Get all ingredients in the user's inventory
const getUserInventory = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    // Update aboutToExpire field for all ingredients
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    // Update all ingredients with expiry dates within 3 days
    await Ingredient.updateMany(
      {
        userId,
        expiryDate: { $ne: null, $lte: threeDaysFromNow, $gt: today },
      },
      { $set: { aboutToExpire: true } }
    );

    // Reset flag for ingredients that are not about to expire
    await Ingredient.updateMany(
      {
        userId,
        $or: [
          { expiryDate: null },
          { expiryDate: { $gt: threeDaysFromNow } },
          { expiryDate: { $lte: today } },
        ],
      },
      { $set: { aboutToExpire: false } }
    );

    // Optional filtering by category
    const { category } = req.query;
    const filter: any = { userId };

    if (
      category &&
      Object.values(IngredientCategory).includes(category as IngredientCategory)
    ) {
      filter.category = category;
    }

    const ingredients = await Ingredient.find(filter).sort({
      // Sort by expiry date (asc) and then by purchase date (desc)
      expiryDate: 1,
      purchaseDate: -1,
    });

    res.status(200).json(ingredients);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ message: 'Error fetching inventory' });
  }
};

// Add a single ingredient to inventory manually
const addIngredient = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const ingredientData = req.body;

    // Assign the current user ID
    ingredientData.userId = userId;

    // If it's a dry ingredient, we don't need an expiry date
    if (ingredientData.category === IngredientCategory.DRY) {
      ingredientData.expiryDate = null;
    } else if (!ingredientData.expiryDate) {
      // For non-dry ingredients, calculate a default expiry date based on category
      const purchaseDate = ingredientData.purchaseDate || new Date();
      let daysToExpiry = 0;

      switch (ingredientData.category) {
        case IngredientCategory.VEGETABLE:
          daysToExpiry = 7; // 1 week
          break;
        case IngredientCategory.FRUIT:
          daysToExpiry = 7; // 1 week
          break;
        case IngredientCategory.DAIRY:
          daysToExpiry = 14; // 2 weeks
          break;
        case IngredientCategory.MEAT:
          daysToExpiry = 5; // 5 days
          break;
        case IngredientCategory.FROZEN:
          daysToExpiry = 90; // 3 months
          break;
        case IngredientCategory.BAKERY:
          daysToExpiry = 5; // 5 days
          break;
        default:
          daysToExpiry = 14; // 2 weeks for other
      }

      const expiryDate = new Date(purchaseDate);
      expiryDate.setDate(expiryDate.getDate() + daysToExpiry);
      ingredientData.expiryDate = expiryDate;
    }

    const newIngredient = new Ingredient(ingredientData);
    await newIngredient.save();

    res.status(201).json(newIngredient);
  } catch (error) {
    console.error('Error adding ingredient:', error);
    res.status(500).json({ message: 'Error adding ingredient' });
  }
};

// Update an existing ingredient
const updateIngredient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const updates = req.body;

    // Find the ingredient and verify ownership
    const ingredient = await Ingredient.findOne({ _id: id, userId });

    if (!ingredient) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }

    // Apply updates
    Object.keys(updates).forEach((key) => {
      if (key !== '_id' && key !== 'userId') {
        // @ts-ignore: Dynamic property assignment
        ingredient[key] = updates[key];
      }
    });

    await ingredient.save();
    res.status(200).json(ingredient);
  } catch (error) {
    console.error('Error updating ingredient:', error);
    res.status(500).json({ message: 'Error updating ingredient' });
  }
};

// Delete an ingredient
const deleteIngredient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const result = await Ingredient.deleteOne({ _id: id, userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }

    res.status(200).json({ message: 'Ingredient deleted successfully' });
  } catch (error) {
    console.error('Error deleting ingredient:', error);
    res.status(500).json({ message: 'Error deleting ingredient' });
  }
};

// Get inventory statistics
// Get inventory statistics
const getInventoryStats = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    
    // Count items by category
    const categoryCounts = await Ingredient.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    
    // Set dates for expiring items
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    // Count expiring items (within next 3 days, not expired yet)
    const expiringCount = await Ingredient.countDocuments({
      userId,
      expiryDate: { $ne: null, $lte: threeDaysFromNow, $gt: today }
    });
    
    // Count expired items
    const expiredCount = await Ingredient.countDocuments({
      userId,
      expiryDate: { $ne: null, $lt: today }
    });
    
    // Total items
    const totalCount = await Ingredient.countDocuments({ userId });
    
    res.status(200).json({
      totalItems: totalCount,
      categoryCounts,
      expiringItems: expiringCount,
      expiredItems: expiredCount,
    });
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    res.status(500).json({ message: 'Error fetching inventory statistics' });
  }
};

export default {
  getUserInventory,
  addIngredient,
  updateIngredient,
  deleteIngredient,
  getInventoryStats,
};
