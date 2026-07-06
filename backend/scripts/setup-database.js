
const { initializeDatabase } = require('../src/config/database');

async function setupDatabase() {
  console.log('Setting up Recipe Management Database...\n');
  
  try {
    await initializeDatabase();
    console.log('\nDatabase setup completed successfully!');
    console.log('You can now import data with: npm run import');
    process.exit(0);
  } catch (error) {
    console.error('\nDatabase setup failed:', error.message);
    process.exit(1);
  }
}
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };