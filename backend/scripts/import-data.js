const path = require('path');
const { parseJsonFile, validateJsonPath } = require('../src/utils/dataParser');
const Recipe = require('../src/models/Recipe');
const { testConnection } = require('../src/config/database');

async function importRecipeData() {
  console.log('tarting Recipe Data Import...\n');
  
  try {

    console.log('Checking database connection...');
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed. Please run "npm run setup" first.');
    }

    const jsonPath = process.env.JSON_DATA_PATH || 
                     process.argv[2] || 
                     '../data/US_recipes_null.json';
    
    console.log(`JSON file path: ${jsonPath}`);
    
    let resolvedPath;
    try {
      resolvedPath = validateJsonPath(jsonPath);
    } catch (error) {

      const alternativePath = path.resolve(__dirname, jsonPath);
      try {
        resolvedPath = validateJsonPath(alternativePath);
        console.log(`Using alternative path: ${alternativePath}`);
      } catch (altError) {
        throw new Error(`Invalid JSON file path: ${jsonPath}. ${error.message}`);
      }
    }
    
    console.log('Parsing JSON file...');
    const recipes = await parseJsonFile(resolvedPath);
    
    if (recipes.length === 0) {
      console.log('No valid recipes found in JSON file');
      process.exit(0);
    }
    
    const existingCount = await Recipe.getCount();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing recipes in database`);
      console.log('Clearing existing data...');
      await Recipe.deleteAll();
    }
    
    console.log(`Importing ${recipes.length} recipes...`);
    const startTime = Date.now();
    
    const result = await Recipe.createBulk(recipes);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    

    
    if (result.errors.length > 0) {
      console.log('\nImport Errors:');
      result.errors.slice(0, 5).forEach(error => {
        console.log(`   - Recipe "${error.recipe}" (index ${error.index}): ${error.error}`);
      });
      
      if (result.errors.length > 5) {
        console.log(`   - ... and ${result.errors.length - 5} more errors`);
      }
    }
    
    const finalCount = await Recipe.getCount();
    console.log(`\nFinal database count: ${finalCount} recipes`);
    
    if (finalCount > 0) {
      console.log('\nData import completed successfully!');
    } else {
      console.log('\nNo recipes were imported to the database');
    }
    
    process.exit(0);
    
  } catch (error) {
      process.exit(1);
  }
}

if (require.main === module) {
  importRecipeData();
}

module.exports = { importRecipeData };