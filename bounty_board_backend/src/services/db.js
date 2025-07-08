const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_FILE = process.env.SQLITE_DB_FILE || path.join(__dirname, '../../bounty_board.sqlite');
let db;

// PUBLIC_INTERFACE
function getDbConnection() {
  if (!db) {
    db = new sqlite3.Database(DB_FILE, (err) => {
      if (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to connect to SQLite database:', err.message);
        throw err;
      }
    });
  }
  return db;
}

// PUBLIC_INTERFACE
function runMigrations() {
  const db = getDbConnection();

  // Users table
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email VARCHAR(255) NOT NULL UNIQUE,
      username VARCHAR(50) NOT NULL UNIQUE,
      display_name VARCHAR(100),
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`
  );

  // Bounties table
  db.run(
    `CREATE TABLE IF NOT EXISTS bounties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      github_repo_link VARCHAR(255),
      amount NUMERIC NOT NULL,
      status VARCHAR(32) DEFAULT 'open',
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );`
  );

  // Claims table
  db.run(
    `CREATE TABLE IF NOT EXISTS claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bounty_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP,
      status VARCHAR(32) NOT NULL,
      FOREIGN KEY (bounty_id) REFERENCES bounties(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );`
  );
}

// Run migrations on module load
if (!fs.existsSync(DB_FILE)) {
  runMigrations();
} else {
  // Optionally, check if migrations are up to date
  runMigrations();
}

module.exports = {
  getDbConnection,
  runMigrations,
  DB_FILE,
};
