const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

const pool = new Pool(dbConfig);

const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Database connected successfully');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
};

const createDatabase = async () => {
  const adminConfig = {
    ...dbConfig,
    database: 'postgres'
  };
  
  const adminPool = new Pool(adminConfig);
  
  try {
    const client = await adminPool.connect();
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbConfig.database]
    );
    
    if (result.rows.length === 0) {
      await client.query(`CREATE DATABASE ${dbConfig.database}`);
      console.log(`Database '${dbConfig.database}' created successfully`);
    } else {
      console.log(`Database '${dbConfig.database}' already exists`);
    }
    
    client.release();
    await adminPool.end();
    return true;
  } catch (error) {
    console.error('Error creating database:', error.message);
    await adminPool.end();
    return false;
  }
};

const createTables = async () => {
  const createRecipesTableQuery = `
    CREATE TABLE IF NOT EXISTS recipes (
      id PRIMARY KEY,
      cuisine VARCHAR(255),
      title VARCHAR(500) NOT NULL,
      rating FLOAT,
      prep_time INTEGER,
      cook_time INTEGER,
      total_time INTEGER,
      description TEXT,
      nutrients JSONB,
      serves VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_recipes_rating ON recipes(rating);
    CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes(cuisine);
    CREATE INDEX IF NOT EXISTS idx_recipes_title ON recipes USING gin(to_tsvector('english', title));
    CREATE INDEX IF NOT EXISTS idx_recipes_total_time ON recipes(total_time);
    CREATE INDEX IF NOT EXISTS idx_recipes_nutrients ON recipes USING gin(nutrients);
  `;
  
  try {
    await pool.query(createRecipesTableQuery);
    console.log('Tables created successfully');
    return true;
  } catch (error) {
    console.error('Error creating tables:', error.message);
    return false;
  }
};

const initializeDatabase = async () => {
  console.log('Initializing database...');
  
  const dbCreated = await createDatabase();
  if (!dbCreated) {
    throw new Error('Failed to create database');
  }
  
  const connected = await testConnection();
  if (!connected) {
    throw new Error('Failed to connect to database');
  }
  
  const tablesCreated = await createTables();
  if (!tablesCreated) {
    throw new Error('Failed to create tables');
  }
  
  console.log('Database initialization complete');
  return true;
};

module.exports = {
  pool,
  testConnection,
  createDatabase,
  createTables,
  initializeDatabase
};