const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

class Recipe {
  static mapRecipeData(jsonRecipe) {
    if (!jsonRecipe.title || jsonRecipe.title === null || jsonRecipe.title.trim() === '') {
      return null;
    }

    function parseTimeToMinutes(timeStr) {
      if (!timeStr || timeStr === null) return null;
      
      if (typeof timeStr === 'number') return timeStr;
      if (typeof timeStr !== 'string') return null;
      
      const timeString = timeStr.toLowerCase().trim();
      if (!timeString || timeString === 'null') return null;
      
      let totalMinutes = 0;
      
      const hourMatch = timeString.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)/);
      if (hourMatch) {
        totalMinutes += parseFloat(hourMatch[1]) * 60;
      }
      
      const minuteMatch = timeString.match(/(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|m)(?!\w)/);
      if (minuteMatch) {
        totalMinutes += parseFloat(minuteMatch[1]);
      }
      
      if (totalMinutes === 0) {
        const numberMatch = timeString.match(/^\d+$/);
        if (numberMatch) {
          totalMinutes = parseInt(numberMatch[0]);
        }
      }
      
      return totalMinutes > 0 ? Math.round(totalMinutes) : null;
    }

    function parseRating(ratingValue) {
      if (!ratingValue) return null;
      if (typeof ratingValue === 'number') return ratingValue;
      if (typeof ratingValue === 'string') {
        const parsed = parseFloat(ratingValue);
        return isNaN(parsed) ? null : parsed;
      }
      return null;
    }

    try {
      const mappedRecipe = {
        title: jsonRecipe.title.trim(),
        description: jsonRecipe.description && jsonRecipe.description !== 'None' 
          ? jsonRecipe.description.trim() 
          : null,
        
        cuisine: jsonRecipe.cuisine && jsonRecipe.cuisine !== 'None' 
          ? jsonRecipe.cuisine.trim() 
          : null,
        
        rating: parseRating(jsonRecipe.rating),
        
        prep_time: parseTimeToMinutes(jsonRecipe.prep_time),
        cook_time: parseTimeToMinutes(jsonRecipe.cook_time),
        total_time: parseTimeToMinutes(jsonRecipe.total_time),
        
        serves: jsonRecipe.serves ? String(jsonRecipe.serves) : null,
        
        nutrients: jsonRecipe.nutrients ? JSON.stringify(jsonRecipe.nutrients) : null
      };

      return mappedRecipe;
    } catch (error) {
      console.error('Error mapping recipe data:', error);
      return null;
    }
  }

  static async createBulk(jsonRecipes) {
    const results = {
      inserted: 0,
      errors: [],
      skipped: 0
    };

    for (let i = 0; i < jsonRecipes.length; i++) {
      const jsonRecipe = jsonRecipes[i];
      
      try {
        const mappedRecipe = this.mapRecipeData(jsonRecipe);
        
        if (!mappedRecipe) {
          results.skipped++;
          if (results.skipped % 100 === 0) {
            console.log(`Skipped ${results.skipped} recipes with missing titles...`);
          }
          continue;
        }

        await this.create(mappedRecipe);
        results.inserted++;
        
        if (results.inserted % 100 === 0) {
          console.log(`Imported ${results.inserted} recipes...`);
        }

      } catch (error) {
        results.errors.push({
          index: i,
          recipe: jsonRecipe.title || 'Unknown',
          error: error.message
        });
        
        if (results.errors.length <= 5) {
          console.error(`Error: ${error.message}`);
        }
      }
    }

    return results;
  }

  static async create(recipeData) {
    const query = `
      INSERT INTO recipes (
        title, description, cuisine, rating, 
        prep_time, cook_time, total_time, serves, nutrients
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) RETURNING id
    `;

    const values = [
      recipeData.title,
      recipeData.description,
      recipeData.cuisine,
      recipeData.rating,
      recipeData.prep_time,
      recipeData.cook_time,
      recipeData.total_time,
      recipeData.serves,
      recipeData.nutrients
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getCount() {
    const query = 'SELECT COUNT(*) as count FROM recipes';
    const result = await pool.query(query);
    return parseInt(result.rows[0].count);
  }

  static async deleteAll() {
    const query = 'DELETE FROM recipes';
    await pool.query(query);
    console.log('All existing recipes deleted');
  }

  static async getById(id) {
    const query = 'SELECT * FROM recipes WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getAll(page = 1, limit = 10, sortBy = 'rating', sortOrder = 'DESC') {
    try {
      const offset = (page - 1) * limit;
      
      const allowedSortColumns = ['id', 'title', 'rating', 'prep_time', 'cook_time', 'total_time', 'created_at', 'updated_at'];
      const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'rating';
      
      const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      
      let orderClause;
      if (sortColumn === 'rating') {
        orderClause = `${sortColumn} ${order} NULLS LAST`;
      } else {
        orderClause = `${sortColumn} ${order}`;
      }
      
      const countQuery = 'SELECT COUNT(*) as count FROM recipes';
      const countResult = await pool.query(countQuery);
      const total = parseInt(countResult.rows[0].count);
      
      const query = `
        SELECT * FROM recipes 
        ORDER BY ${orderClause}
        LIMIT $1 OFFSET $2
      `;
      
      const result = await pool.query(query, [limit, offset]);
      
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;
      
      return {
        data: result.rows,
        pagination: {
          page: page,
          limit: limit,
          total: total,
          totalPages: totalPages,
          hasNext: hasNext,
          hasPrev: hasPrev
        }
      };
      
    } catch (error) {
      console.error('Error in Recipe.getAll:', error);
      throw error;
    }
  }

  static async search(filters = {}) {
    try {
      let query = 'SELECT * FROM recipes WHERE 1=1';
      const values = [];
      let paramIndex = 1;
      
      if (filters.title) {
        query += ` AND title ILIKE $${paramIndex}`;
        values.push(`%${filters.title}%`);
        paramIndex++;
      }
      
      if (filters.cuisine) {
        query += ` AND cuisine ILIKE $${paramIndex}`;
        values.push(`%${filters.cuisine}%`);
        paramIndex++;
      }
      
      if (filters.rating) {
        const ratingFilter = this.parseFilter(filters.rating);
        if (ratingFilter) {
          query += ` AND rating ${ratingFilter.operator} $${paramIndex}`;
          values.push(ratingFilter.value);
          paramIndex++;
        }
      }
      
      if (filters.total_time) {
        const timeFilter = this.parseFilter(filters.total_time);
        if (timeFilter) {
          query += ` AND total_time ${timeFilter.operator} $${paramIndex}`;
          values.push(timeFilter.value);
          paramIndex++;
        }
      }
      
      if (filters.calories) {
        const caloriesFilter = this.parseFilter(filters.calories);
        if (caloriesFilter) {
          query += ` AND CAST(REGEXP_REPLACE(nutrients->>'calories', '[^0-9]', '', 'g') AS INTEGER) ${caloriesFilter.operator} $${paramIndex}`;
          values.push(caloriesFilter.value);
          paramIndex++;
        }
      }
      
      query += ' ORDER BY rating DESC NULLS LAST, title ASC';
      
      const result = await pool.query(query, values);
      
      return {
        data: result.rows,
        filters: filters,
        count: result.rows.length
      };
      
    } catch (error) {
      console.error('Error in Recipe.search:', error);
      throw error;
    }
  }

  static parseFilter(filterStr) {
    if (!filterStr || typeof filterStr !== 'string') return null;
    
    const trimmed = filterStr.trim();
    
    const match = trimmed.match(/^(>=|<=|>|<|=)?(\d+(?:\.\d+)?)$/);
    
    if (!match) return null;
    
    const operator = match[1] || '=';
    const value = parseFloat(match[2]);
    
    if (isNaN(value)) return null;
    
    return { operator, value };
  }
}

module.exports = Recipe;