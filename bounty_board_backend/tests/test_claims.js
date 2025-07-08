const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('Claims Endpoints (bounty claims)', () => {
  // Shared users
  const user1 = {
    email: 'c1@example.com',
    username: 'claimer1',
    display_name: 'Claimer One',
    password: 'User1Strong!'
  };
  const user2 = {
    email: 'c2@example.com',
    username: 'claimer2',
    display_name: 'Claimer Two',
    password: 'User2Strong!'
  };
  let token1;
  let token2;
  let bountyId;

  beforeEach(async () => {
    // Register & login both users
    await request(app).post('/auth/register').send(user1);
    const res1 = await request(app).post('/auth/login').send({ emailOrUsername: user1.email, password: user1.password });
    token1 = res1.body.token;
    await request(app).post('/auth/register').send(user2);
    const res2 = await request(app).post('/auth/login').send({ emailOrUsername: user2.username, password: user2.password });
    token2 = res2.body.token;

    // Create an open bounty as user1
    const createBounty = await request(app)
      .post('/bounties')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        title: 'Cool Bounty',
        description: 'Implement new feature',
        github_repo_link: 'https://github.com/some/repo',
        amount: 222
      });
    bountyId = createBounty.body.bounty.id;
  });

  describe('POST /claims - claim bounty', () => {
    it('allows an authenticated user to claim an open bounty successfully', async () => {
      const res = await request(app)
        .post('/claims')
        .set('Authorization', `Bearer ${token2}`)
        .send({ bounty_id: bountyId });
      expect(res.statusCode).toBe(201);
      expect(res.body.claim).toBeDefined();
      expect(res.body.claim.bounty_id).toBe(bountyId);
      expect(res.body.claim.user_id).toBeDefined();
      expect(res.body.claim.status).toBe('claimed');
    });

    it('rejects claim if no token', async () => {
      const res = await request(app)
        .post('/claims')
        .send({ bounty_id: bountyId });
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/missing/i);
    });

    it('rejects claim if missing bounty_id', async () => {
      const res = await request(app)
        .post('/claims')
        .set('Authorization', `Bearer ${token1}`)
        .send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/bounty_id required/i);
    });

    it('rejects claim for non-existent bounty', async () => {
      const res = await request(app)
        .post('/claims')
        .set('Authorization', `Bearer ${token1}`)
        .send({ bounty_id: 999999 });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/bounty not found/i);
    });

    it('rejects double claim by same user', async () => {
      // First claim works
      await request(app)
        .post('/claims')
        .set('Authorization', `Bearer ${token1}`)
        .send({ bounty_id: bountyId });
      // Repeat
      const res = await request(app)
        .post('/claims')
        .set('Authorization', `Bearer ${token1}`)
        .send({ bounty_id: bountyId });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/already claimed/i);
    });

    it('rejects claim if bounty not open', async () => {
      // Mark bounty as closed
      await request(app)
        .put(`/bounties/${bountyId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ status: 'closed' });

      const res = await request(app)
        .post('/claims')
        .set('Authorization', `Bearer ${token2}`)
        .send({ bounty_id: bountyId });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/not open/i);
    });
  });

  describe('POST /claims/:id/complete - complete claim (as claimer only)', () => {
    let claimId;

    beforeEach(async () => {
      // user2 claims the bounty (not the creator!)
      const claimRes = await request(app)
        .post('/claims')
        .set('Authorization', `Bearer ${token2}`)
        .send({ bounty_id: bountyId });
      claimId = claimRes.body.claim.id;
    });

    it('allows the claim owner to mark claim as completed', async () => {
      const res = await request(app)
        .post(`/claims/${claimId}/complete`)
        .set('Authorization', `Bearer ${token2}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.claim).toBeDefined();
      expect(res.body.claim.status).toBe('completed');
      expect(res.body.claim.completed_at).toBeTruthy();
    });

    it('rejects if not authenticated', async () => {
      const res = await request(app)
        .post(`/claims/${claimId}/complete`);
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/missing/i);
    });

    it('forbids if not claim owner', async () => {
      // token1 (bounty creator, but *not* the claimer)
      const res = await request(app)
        .post(`/claims/${claimId}/complete`)
        .set('Authorization', `Bearer ${token1}`);
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toMatch(/not found/i); // 404 for unauthorized
    });

    it('404 if claim does not exist', async () => {
      const res = await request(app)
        .post('/claims/1234567/complete')
        .set('Authorization', `Bearer ${token2}`);
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    it('rejects if already completed', async () => {
      // Complete once
      await request(app)
        .post(`/claims/${claimId}/complete`)
        .set('Authorization', `Bearer ${token2}`);
      // Try again
      const res = await request(app)
        .post(`/claims/${claimId}/complete`)
        .set('Authorization', `Bearer ${token2}`);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/already completed/i);
    });
  });

  describe('GET /claims - list my claims (authenticated)', () => {
    it('lists only the authenticated user\'s claims', async () => {
      // user1 claims
      await request(app)
        .post('/claims')
        .set('Authorization', `Bearer ${token1}`)
        .send({ bounty_id: bountyId });
      // user2 claims a different bounty
      const bounty2 = await request(app)
        .post('/bounties')
        .set('Authorization', `Bearer ${token2}`)
        .send({ title: 'Extra work', amount: 11 }).then(r => r.body.bounty);
      await request(app)
        .post('/claims')
        .set('Authorization', `Bearer ${token2}`)
        .send({ bounty_id: bounty2.id });

      // List user1's claims
      const list1 = await request(app)
        .get('/claims')
        .set('Authorization', `Bearer ${token1}`);
      expect(list1.statusCode).toBe(200);
      expect(Array.isArray(list1.body.claims)).toBe(true);
      expect(list1.body.claims.length).toBe(1);
      expect(list1.body.claims[0].user_id).toBeDefined();

      // List user2's claims
      const list2 = await request(app)
        .get('/claims')
        .set('Authorization', `Bearer ${token2}`);
      expect(list2.statusCode).toBe(200);
      expect(Array.isArray(list2.body.claims)).toBe(true);
      expect(list2.body.claims.length).toBe(1);
    });

    it('forbids listing claims without token', async () => {
      const res = await request(app)
        .get('/claims');
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/missing/i);
    });
  });

}); // end describe claims

