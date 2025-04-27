import mongoose from 'mongoose';

export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  DESSERT = 'dessert',
  ANY = 'any',
}

const recipeSchema = new mongoose.Schema(
  {
    recipeId: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    image: { type: String },
    ingredients: [{ type: String }],
    instructions: [{ type: String }],
    mealType: {
      type: String,
      enum: Object.values(MealType),
      default: MealType.ANY,
    },
  },
  {
    collection: 'recipes',
    timestamps: true,
  }
);

// Add indices for better query performance
recipeSchema.index({ recipeId: 1 }, { unique: true });
recipeSchema.index({ mealType: 1 });

const Recipe = mongoose.model('Recipe', recipeSchema);
export default Recipe;
