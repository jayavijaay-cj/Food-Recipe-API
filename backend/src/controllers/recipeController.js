const Recipe = require('../models/Recipe');

class RecipeController {
  static async getAllRecipes(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'rating',
        sortOrder = 'DESC'
      } = req.query;
      
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(Math.max(1, parseInt(limit)), 100);
      
      const result = await Recipe.getAll(pageNum, limitNum, sortBy, sortOrder);
      
      res.json({
        success: true,
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
        hasNext: result.pagination.hasNext,
        hasPrev: result.pagination.hasPrev,
        data: result.data
      });
      
    } catch (error) {
      console.error('Error in getAllRecipes:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch recipes',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  static async searchRecipes(req, res) {
    try {
      const filters = {
        title: req.query.title,
        cuisine: req.query.cuisine,
        rating: req.query.rating,
        total_time: req.query.total_time,
        calories: req.query.calories
      };
      
      Object.keys(filters).forEach(key => {
        if (!filters[key]) {
          delete filters[key];
        }
      });
      
      const result = await Recipe.search(filters);
      
      res.json({
        success: true,
        filters: filters,
        count: result.data.length,
        data: result.data
      });
      
    } catch (error) {
      console.error('Error in search recipes:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to search recipes',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
      });
    }
  }
  
  static async getRecipeById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Valid recipe ID is required'
        });
      }
      
      const recipe = await Recipe.getById(parseInt(id));
      
      if (!recipe) {
        return res.status(404).json({
          success: false,
          message: 'Recipe not found'
        });
      }
      
      res.json({
        success: true,
        data: recipe
      });
      
    } catch (error) {
      console.error('Error in getRecipeById:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch recipe',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  static async getStats(req, res) {
    try {
      const totalRecipes = await Recipe.getCount();
      
      res.json({
        success: true,
        data: {
          totalRecipes,
          apiVersion: '1.0.0',
          endpoints: [
            'GET /api/recipes - Get all recipes (paginated)',
            'GET /api/recipes/search - Search recipes',
            'GET /api/recipes/:id - Get recipe by ID',
            'GET /api/stats - Get API statistics'
          ]
        }
      });
      
    } catch (error) {
      console.error('Error in getStats:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  static async healthCheck(req, res) {
    try {
      const recipeCount = await Recipe.getCount();
      
      res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        data: {
          recipesInDatabase: recipeCount,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version
        }
      });
      
    } catch (error) {
      console.error('Error in healthCheck:', error.message);
      res.status(500).json({
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = RecipeController;