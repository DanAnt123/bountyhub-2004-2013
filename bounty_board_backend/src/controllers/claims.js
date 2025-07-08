const claimService = require('../services/claims');

// PUBLIC_INTERFACE
// Claim a bounty (auth required)
async function claimBounty(req, res) {
  try {
    const { bounty_id } = req.body;
    if (!bounty_id) return res.status(400).json({ message: 'bounty_id required.' });

    const claim = await claimService.claimBounty({
      bounty_id,
      user_id: req.user.id,
    });
    return res.status(201).json({ claim });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

// PUBLIC_INTERFACE
// Mark claim as completed (auth required, only the claimant)
async function completeClaim(req, res) {
  try {
    const { id } = req.params;
    const updated = await claimService.completeClaim(Number(id), req.user.id);
    if (!updated) return res.status(404).json({ message: 'Claim not found or unauthorized.' });
    return res.status(200).json({ claim: updated });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

// PUBLIC_INTERFACE
// List my claims (auth required)
async function listMyClaims(req, res) {
  try {
    const claims = await claimService.listClaimsForUser(req.user.id);
    return res.status(200).json({ claims });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

module.exports = {
  claimBounty,
  completeClaim,
  listMyClaims,
};
