const express = require('express');
const bountiesController = require('../controllers/bounties');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /bounties:
 *   get:
 *     summary: List all bounties
 *     responses:
 *       200:
 *         description: List of bounties
 */
router.get('/', bountiesController.listBounties);

/**
 * @swagger
 * /bounties:
 *   post:
 *     summary: Create a new bounty
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               github_repo_link:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Bounty created
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/', requireAuth, bountiesController.createBounty);

/**
 * @swagger
 * /bounties/{id}:
 *   get:
 *     summary: Get a bounty by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Success }
 *       404: { description: Not found }
 */
router.get('/:id', bountiesController.getBounty);

/**
 * @swagger
 * /bounties/{id}:
 *   put:
 *     summary: Update a bounty (creator only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               github_repo_link: { type: string }
 *               amount: { type: number }
 *               status: { type: string }
 *     responses:
 *       200: { description: Updated }
 *       400: { description: Bad Request }
 *       403: { description: Not allowed }
 *       404: { description: Not found }
 */
router.put('/:id', requireAuth, bountiesController.updateBounty);

/**
 * @swagger
 * /bounties/{id}:
 *   delete:
 *     summary: Delete a bounty (creator only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Deleted }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 */
router.delete('/:id', requireAuth, bountiesController.deleteBounty);

/**
 * @swagger
 * /bounties/{id}/claims:
 *   get:
 *     summary: List claims for the bounty
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Success }
 *       404: { description: Not found }
 */
router.get('/:id/claims', bountiesController.getClaimsForBounty);

module.exports = router;
