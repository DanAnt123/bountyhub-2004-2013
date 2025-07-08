const authService = require('../services/auth');

// PUBLIC_INTERFACE
// Registration handler
async function register(req, res) {
  try {
    const { email, username, display_name, password } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ message: 'Email, username, and password are required.' });
    }
    const user = await authService.registerUser({ email, username, display_name, password });
    return res.status(201).json({ user });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

// PUBLIC_INTERFACE
// Login handler
async function login(req, res) {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) {
      return res.status(400).json({ message: 'Email/username and password are required.' });
    }
    const { user, token } = await authService.loginUser({ emailOrUsername, password });
    return res.status(200).json({ user, token });
  } catch (err) {
    return res.status(401).json({ message: err.message });
  }
}

module.exports = {
  register,
  login,
};
