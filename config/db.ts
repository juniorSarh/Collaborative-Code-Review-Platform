import { Pool } from "pg";
import dotenv from "dotenv";
import test from "node:test";

dotenv.config();

//new pool instance
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT || 5432),
});


//export query method for querying the database
export const query = (text: string, params?: any[]) => pool.query(text, params);


// Function to test database connection
export const testConnection = async () => {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("Database connected:", res.rows[0]);
  } catch (err) {
    console.error("Database connection error:", err);
  }
};
