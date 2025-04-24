import mongoose from 'mongoose';

export enum IngredientCategory {
  DRY = 'dry',
  VEGETABLE = 'vegetable',
  FRUIT = 'fruit',
  DAIRY = 'dairy',
  MEAT = 'meat',
  FROZEN = 'frozen',
  BAKERY = 'bakery',
  OTHER = 'other',
}

const ingredientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: Object.values(IngredientCategory),
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
    unit: {
      type: String,
      default: 'unit',
    },
    expiryDate: {
      type: Date,
      // Only required for non-dry ingredients
    },
    aboutToExpire: {
      type: Boolean,
      default: false,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    // For any additional details like brand, notes, etc.
    additionalInfo: {
      type: String,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Add an index to improve query performance
ingredientSchema.index({ userId: 1, category: 1 });

const Ingredient = mongoose.model('Ingredient', ingredientSchema);
export default Ingredient;
