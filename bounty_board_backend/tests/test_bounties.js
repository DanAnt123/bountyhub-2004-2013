const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('Bounties CRUD Endpoints', () => {
  // Shared user credentials
  const user1 = {
    email: 'user1@example.com',
    username: 'userone',
    display_name: 'User One',
    password: 'Password123!'
  };
  const user2 = {
    email: 'user2@example.com',
    username: 'usertwo',
    display_name: 'User Two',
    password: 'Password456!'
  };
  let token1;
  let token2;

  beforeEach(async () => {
    // Clean DB seeded by setup.js. Register & login users fresh for each test
    // Register & get token for user1
    await request(app).post('/auth/register').send(user1);
    const res1 = await request(app).post('/auth/login').send({ emailOrUsername: user1.email, password: user1.password });
    token1 = res1.body.token;

    await request(app).post('/auth/register').send(user2);
    const res2 = await request(app).post('/auth/login').send({ emailOrUsername: user2.username, password: user2.password });
    token2 = res2.body.token;
  });

  describe('POST /bounties', () => {
    it('creates a new bounty with valid auth and required fields', async () => {
      const payload = {
        title: 'Implement login',
        description: 'Add login route',
        github_repo_link: 'https://github.com/repo/project',
        amount: 100
      };
      const res = await request(app)
        .post('/bounties')
        .set('Authorization', `Bearer ${token1}`)
        .send(payload);
      expect(res.statusCode).toBe(201);
      expect(res.body.bounty).toBeDefined();
      expect(res.body.bounty.title).toBe(payload.title);
      expect(res.body.bounty.amount).toBe(payload.amount);
      expect(res.body.bounty.description).toBe(payload.description);
      expect(res.body.bounty.github_repo_link).toBe(payload.github_repo_link);
      expect(res.body.bounty.status).toBe('open');
      expect(res.body.bounty.created_by).toBeDefined();
    });

    it('fails to create bounty without auth', async () => {
      const res = await request(app)
        .post('/bounties')
        .send({ title: 'NoAuth', amount: 50 });
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/missing/i);
    });

    it('fails if missing required fields', async () => {
      const res = await request(app)
        .post('/bounties')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: '', amount: null });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/required/i);
    });
  });

  describe('GET /bounties', () => {
    it('lists all bounties (no auth required)', async () => {
      // Seed one bounty
      await request(app)
        .post('/bounties')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: 'Seed', description: 'testing', amount: 123 });
      const res = await request(app).get('/bounties');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.bounties)).toBe(true);
      expect(res.body.bounties.length).toBeGreaterThanOrEqual(1);
      const bounty = res.body.bounties.find(b => b.title === 'Seed');
      expect(bounty).toBeDefined();
    });
  });

  describe('GET /bounties/:id', () => {
    it('returns a bounty by id', async () => {
      // Create a bounty to lookup
      const createRes = await request(app)
        .post('/bounties')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: 'GetMe', description: '', amount: 77 });
      const bountyId = createRes.body.bounty.id;

      const res = await request(app).get(`/bounties/${bountyId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.bounty).toBeDefined();
      expect(res.body.bounty.id).toBe(bountyId);
      expect(res.body.bounty.title).toBe('GetMe');
    });

    it('404 for non-existent bounty', async () => {
      const res = await request(app).get('/bounties/99999');
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });
  });

  describe('PUT /bounties/:id', () => {
    it('updates a bounty if creator and valid token', async () => {
      const create = await request(app)
        .post('/bounties')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: 'Upd', amount: 10 });
      const id = create.body.bounty.id;

      const update = await request(app)
        .put(`/bounties/${id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: 'Updated title', amount: 99, status: 'closed' });

      expect(update.statusCode).toBe(200);
      expect(update.body.bounty.title).toBe('Updated title');
      expect(update.body.bounty.amount).toBe(99);
      expect(update.body.bounty.status).toBe('closed');
    });

    it('forbids update if not creator', async () => {
      const create = await request(app)
        .post('/bounties')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: 'NotYours', amount: 18 });
      const id = create.body.bounty.id;

      const update = await request(app)
        .put(`/bounties/${id}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ title: 'Hacked' });
      expect(update.statusCode).toBe(403);
      expect(update.body.message).toMatch(/not allowed/i);
    });

    it('requires auth for update', async () => {
      const create = await request(app)
        .post('/bounties')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: 'NeedAuth', amount: 1 });
      const id = create.body.bounty.id;

      const update = await request(app)
        .put(`/bounties/${id}`)
        .send({ title: 'Fail' });

      expect(update.statusCode).toBe(401);
      expect(update.body.message).toMatch(/missing/i);
    });

    it('404 if bounty does not exist', async () => {
      const res = await request(app)
        .put('/bounties/9999')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: 'FooBar' });
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });
  });

  describe('DELETE /bounties/:id', () => {
    it('deletes a bounty if creator', async () => {
      const create = await request(app)
        .post('/bounties')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: 'DelBounty', amount: 15 });
      const id = create.body.bounty.id;

      const del = await request(app)
        .delete(`/bounties/${id}`)
        .set('Authorization', `Bearer ${token1}`);
      expect(del.statusCode).toBe(204);

      // Confirm actually deleted
      const get = await request(app).get(`/bounties/${id}`);
      expect(get.statusCode).toBe(404);
    });

    it('forbids delete if not creator', async () => {
      // User1 creates, user2 tries delete
      const create = await request(app)
        .post('/bounties')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: 'NoDelete', amount: 42 });
      const id = create.body.bounty.id;

      const del = await request(app)
        .delete(`/bounties/${id}`)
        .set('Authorization', `Bearer ${token2}`);
      expect(del.statusCode).toBe(403);
      expect(del.body.message).toMatch(/not allowed/i);
    });

    it('requires auth for delete', async () => {
      const create = await request(app)
        .post('/bounties')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: 'DelNoAuth', amount: 34 });
      const id = create.body.bounty.id;

      const del = await request(app)
        .delete(`/bounties/${id}`);
      expect(del.statusCode).toBe(401);
      expect(del.body.message).toMatch(/missing/i);
    });

    it('404 for non-existent bounty', async () => {
      const del = await request(app)
        .delete('/bounties/99955')
        .set('Authorization', `Bearer ${token1}`);
      expect(del.statusCode).toBe(404);
      expect(del.body.message).toMatch(/not found/i);
    });
  });

  describe('GET /bounties/:id/claims', () => {
    it('returns empty list when no claims', async () => {
      const create = await request(app)
        .post('/bounties')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: 'ClaimMe', amount: 66 });
      const id = create.body.bounty.id;

      const res = await request(app).get(`/bounties/${id}/claims`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.claims)).toBe(true);
      expect(res.body.claims.length).toBe(0);
    });

    it('shows claims for bounty if claimed', async () => {
      // Create a bounty
      const create = await request(app)
        .post('/bounties')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: 'ClaimedBounty', amount: 20 });
      const id = create.body.bounty.id;

      // Now claim it via POST /claims
      await request(app)
        .post('/claims')
        .set('Authorization', `Bearer ${token2}`)
        .send({ bounty_id: id });

      // Check claims for bounty
      const res = await request(app).get(`/bounties/${id}/claims`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.claims)).toBe(true);
      expect(res.body.claims.length).toBe(1);
      expect(res.body.claims[0].bounty_id).toBe(id);
    });
  });
});
