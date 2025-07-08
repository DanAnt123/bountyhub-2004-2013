const express = require('express');
const claimsController = require('../controllers/claims');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /claims:
 *   post:
 *     summary: Claim a bounty
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bounty_id:
 *                 type: integer
 *     responses:
 *       201: { description: Claimed }
 *       400: { description: Bad Request }
 *       401: { description: Unauthorized }
 */
router.post('/', requireAuth, claimsController.claimBounty);

/**
 * @swagger
 * /claims/{id}/complete:
 *   post:
 *     summary: Complete a claim (by user)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Completed }
 *       404: { description: Not found }
 *       401: { description: Unauthorized }
 */
router.post('/:id/complete', requireAuth, claimsController.completeClaim);

/**
 * @swagger
 * /claims:
 *   get:
 *     summary: List my claims
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: List of claims }
 *       401: { description: Unauthorized }
 */
router.get('/', requireAuth, claimsController.listMyClaims);

module.exports = router;
