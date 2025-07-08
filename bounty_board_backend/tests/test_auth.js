const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('Authentication Endpoints', () => {
  const userPayload = {
    email: 'testuser@example.com',
    username: 'testuser',
    display_name: 'Test User',
    password: 'P@ssw0rd!'
  };

  describe('POST /auth/register', () => {
    it('registers a new user successfully', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send(userPayload);
      expect(res.statusCode).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(userPayload.email);
      expect(res.body.user.username).toBe(userPayload.username);
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('fails if missing required fields', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: '', username: '', password: '' });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/required/i);
    });

    it('fails on duplicate email or username', async () => {
      await request(app).post('/auth/register').send(userPayload);
      // Duplicate registration
      const res = await request(app).post('/auth/register').send(userPayload);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/already in use/i);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Ensure user exists for login tests
      await request(app).post('/auth/register').send(userPayload);
    });

    it('logs in with email & correct password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ emailOrUsername: userPayload.email, password: userPayload.password });
      expect(res.statusCode).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.token).toBeDefined();
    });

    it('logs in with username & correct password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ emailOrUsername: userPayload.username, password: userPayload.password });
      expect(res.statusCode).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.token).toBeDefined();
    });

    it('fails with incorrect password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ emailOrUsername: userPayload.email, password: 'wrongpass' });
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/invalid credentials/i);
    });

    it('fails with non-existent user', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ emailOrUsername: 'notfound@example.com', password: 'whatever' });
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/invalid credentials/i);
    });

    it('fails with missing fields', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ emailOrUsername: '', password: '' });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/required/i);
    });
  });
});
