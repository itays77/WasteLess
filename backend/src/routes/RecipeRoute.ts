import express, { RequestHandler } from 'express';
import RecipeController from '../controllers/RecipeController';
import { jwtCheck, jwtParse } from '../middleware/auth';

const router = express.Router();

// Public routes (no auth required)
router.get('/', RecipeController.getRecipes as RequestHandler);
router.get('/:id', RecipeController.getRecipeById as RequestHandler);

// Protected routes
router.get(
  '/recommended/for-me',
  jwtCheck,
  jwtParse,
  RecipeController.getRecommendedRecipes as RequestHandler
);

export default router;
