const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDbConnection } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production';
const JWT_EXPIRES_IN = '7d';
const SALT_ROUNDS = 10;

/**
 * PUBLIC_INTERFACE
 * Registers a new user with email, username, and plain password.
 * Returns user object without password.
 */
async function registerUser({ email, username, display_name, password }) {
  const db = getDbConnection();

  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username],
      async (err, row) => {
        if (err) return reject(err);
        if (row) return reject(new Error('Email or username already in use.'));

        const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

        db.run(
          'INSERT INTO users (email, username, display_name, password_hash) VALUES (?, ?, ?, ?)',
          [email, username, display_name || null, password_hash],
          function (insertErr) {
            if (insertErr) return reject(insertErr);

            db.get(
              'SELECT id, email, username, display_name, created_at FROM users WHERE id = ?',
              [this.lastID],
              (fetchErr, user) => {
                if (fetchErr) return reject(fetchErr);
                resolve(user);
              }
            );
          }
        );
      }
    );
  });
}

/**
 * PUBLIC_INTERFACE
 * Authenticates with email/username and password.
 * If valid, returns user object and JWT token.
 */
async function loginUser({ emailOrUsername, password }) {
  const db = getDbConnection();

  const statement =
    emailOrUsername.includes('@')
      ? 'SELECT * FROM users WHERE email = ?'
      : 'SELECT * FROM users WHERE username = ?';

  return new Promise((resolve, reject) => {
    db.get(statement, [emailOrUsername], async (err, user) => {
      if (err) return reject(err);
      if (!user) return reject(new Error('Invalid credentials.'));

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) return reject(new Error('Invalid credentials.'));

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });

      // Don't return password_hash
      const userResult = {
        id: user.id,
        email: user.email,
        username: user.username,
        display_name: user.display_name,
        created_at: user.created_at,
      };

      resolve({ user: userResult, token });
    });
  });
}

module.exports = {
  registerUser,
  loginUser,
};
