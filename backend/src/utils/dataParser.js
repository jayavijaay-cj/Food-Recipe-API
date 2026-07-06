const fs = require('fs');
const path = require('path');

function validateJsonPath(jsonPath) {
  const resolvedPath = path.resolve(jsonPath);
  
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found: ${resolvedPath}`);
  }
  
  const stats = fs.statSync(resolvedPath);
  if (!stats.isFile()) {
    throw new Error(`Path is not a file: ${resolvedPath}`);
  }
  
  try {
    fs.accessSync(resolvedPath, fs.constants.R_OK);
  } catch (error) {
    throw new Error(`File is not readable: ${resolvedPath}`);
  }
  
  return resolvedPath;
}

async function parseJsonFile(filePath) {
  try {
    console.log(`Reading JSON file: ${filePath}`);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    console.log(`File size: ${(fileContent.length / 1024 / 1024).toFixed(2)} MB`);
    
    const jsonData = JSON.parse(fileContent);
    console.log(`JSON parsed successfully`);
    
    let recipes = [];
    
    if (Array.isArray(jsonData)) {
      console.log(`JSON is array format with ${jsonData.length} items`);
      recipes = jsonData;
    } else if (typeof jsonData === 'object' && jsonData !== null) {
      const keys = Object.keys(jsonData);
      console.log(`JSON is object format with ${keys.length} keys`);
      
      const numericKeys = keys.filter(key => !isNaN(key)).length;
      const numericPercentage = numericKeys / keys.length;
      
      if (numericPercentage > 0.8) {
        recipes = keys
          .filter(key => !isNaN(key)) 
          .sort((a, b) => parseInt(a) - parseInt(b)) 
          .map(key => jsonData[key]);
        
        console.log(`Converted to array with ${recipes.length} recipes`);
      } else if (jsonData.data && Array.isArray(jsonData.data)) {
        console.log(`Found data array with ${jsonData.data.length} items`);
        recipes = jsonData.data;
      } else {
        recipes = Object.values(jsonData).filter(item => 
          typeof item === 'object' && item !== null
        );
        console.log(`Extracted ${recipes.length} recipe objects`);
      }
    } else {
      throw new Error('JSON data is not in a recognized format');
    }
    
    if (recipes.length === 0) {
      console.log('No recipes found in JSON data');
      return [];
    }
    
    const validRecipes = recipes.filter((recipe, index) => {
      if (typeof recipe !== 'object' || recipe === null) {
        console.log(`Skipping non-object at index ${index}`);
        return false;
      }
      return true;
    });

    if (validRecipes.length > 0) {
      console.log(`Recipe keys:`, Object.keys(validRecipes[0]).slice(0, 10));
    }
    
    return validRecipes;
    
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON format in file: ${error.message}`);
    }
    throw new Error(`Failed to parse JSON file: ${error.message}`);
  }
}

function validateRecipe(recipe) {
  const errors = [];
  
  if (!recipe || typeof recipe !== 'object') {
    errors.push('Recipe must be an object');
    return { isValid: false, errors };
  }
  
  const requiredFields = ['title', 'ingredients', 'nutrients'];
  
  requiredFields.forEach(field => {
    if (!recipe[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateJsonPath,
  parseJsonFile,
  validateRecipe
};