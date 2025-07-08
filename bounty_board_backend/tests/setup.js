const path = require('path');
const fs = require('fs');
const { runMigrations, DB_FILE } = require('../src/services/db');

// Set test DB file path (per test run, isolated)
const TEST_DB_FILE = path.join(__dirname, '../bounty_board-test.sqlite');
process.env.SQLITE_DB_FILE = TEST_DB_FILE;
process.env.JWT_SECRET = 'testsecret-jwt'; // known for verification

// Ensure clean DB file before each test run
beforeAll(async () => {
  if (fs.existsSync(TEST_DB_FILE)) fs.unlinkSync(TEST_DB_FILE);
  runMigrations();
});

afterAll(async () => {
  // Cleanup test database file after all tests run
  if (fs.existsSync(TEST_DB_FILE)) fs.unlinkSync(TEST_DB_FILE);
});
