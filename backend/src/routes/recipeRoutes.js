const express = require('express');
const RecipeController = require('../controllers/recipeController');

const router = express.Router();

router.get('/recipes', RecipeController.getAllRecipes);
router.get('/recipes/search', RecipeController.searchRecipes);
router.get('/recipes/:id', RecipeController.getRecipeById);
router.get('/stats', RecipeController.getStats);
router.get('/health', RecipeController.healthCheck);

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Recipe API',
    version: '1.0.0',
    endpoints: {
      'GET /api/recipes': 'Get all recipes (paginated)',
      'GET /api/recipes/search': 'Search recipes with filters',
      'GET /api/recipes/:id': 'Get recipe by ID',
      'GET /api/stats': 'Get API statistics',
      'GET /api/health': 'Health check'
    },
  });
});

module.exports = router;