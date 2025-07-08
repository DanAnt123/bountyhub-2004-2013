const bountyService = require('../services/bounties');
const claimService = require('../services/claims');

// PUBLIC_INTERFACE
// Create a new bounty (auth required)
async function createBounty(req, res) {
  try {
    const { title, description, github_repo_link, amount } = req.body;
    if (!title || !amount) {
      return res.status(400).json({ message: 'Title and amount are required.' });
    }
    const bounty = await bountyService.createBounty({
      title,
      description,
      github_repo_link,
      amount,
      created_by: req.user.id,
    });
    return res.status(201).json({ bounty });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

// PUBLIC_INTERFACE
// List all bounties
async function listBounties(req, res) {
  try {
    const bounties = await bountyService.listBounties();
    return res.status(200).json({ bounties });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

// PUBLIC_INTERFACE
// Get bounty by id
async function getBounty(req, res) {
  try {
    const { id } = req.params;
    const bounty = await bountyService.getBountyById(Number(id));
    if (!bounty) return res.status(404).json({ message: 'Bounty not found.' });
    return res.status(200).json({ bounty });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

// PUBLIC_INTERFACE
// Update bounty (only creator)
async function updateBounty(req, res) {
  try {
    const { id } = req.params;
    const bounty = await bountyService.getBountyById(Number(id));
    if (!bounty) return res.status(404).json({ message: 'Bounty not found.' });
    if (bounty.created_by !== req.user.id) return res.status(403).json({ message: 'Not allowed.' });

    const { title, description, github_repo_link, amount, status } = req.body;
    const updated = await bountyService.updateBounty(Number(id), { title, description, github_repo_link, amount, status });
    return res.status(200).json({ bounty: updated });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

// PUBLIC_INTERFACE
// Delete bounty (only creator)
async function deleteBounty(req, res) {
  try {
    const { id } = req.params;
    const bounty = await bountyService.getBountyById(Number(id));
    if (!bounty) return res.status(404).json({ message: 'Bounty not found.' });
    if (bounty.created_by !== req.user.id) return res.status(403).json({ message: 'Not allowed.' });

    await bountyService.deleteBounty(Number(id));
    return res.status(204).send();
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

// PUBLIC_INTERFACE
// List claims for a bounty
async function getClaimsForBounty(req, res) {
  try {
    const { id } = req.params;
    const claims = await claimService.listClaimsForBounty(Number(id));
    return res.status(200).json({ claims });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

module.exports = {
  createBounty,
  listBounties,
  getBounty,
  updateBounty,
  deleteBounty,
  getClaimsForBounty,
};
