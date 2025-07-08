const { getDbConnection } = require('./db');

// PUBLIC_INTERFACE
// Claim a bounty - user can claim an open bounty only if not already claimed by same user and bounty is open
function claimBounty({ bounty_id, user_id }) {
  const db = getDbConnection();
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM bounties WHERE id = ?', [bounty_id], (err, bounty) => {
      if (err) return reject(err);
      if (!bounty) return reject(new Error('Bounty not found.'));
      if (bounty.status !== 'open') return reject(new Error('Bounty not open for claim.'));
      // Check if already claimed by user
      db.get('SELECT * FROM claims WHERE bounty_id = ? AND user_id = ?', [bounty_id, user_id], (err2, claimRow) => {
        if (err2) return reject(err2);
        if (claimRow) return reject(new Error('You have already claimed this bounty.'));
        db.run(
          'INSERT INTO claims (bounty_id, user_id, status) VALUES (?, ?, ?)',
          [bounty_id, user_id, 'claimed'],
          function (err3) {
            if (err3) return reject(err3);
            db.get(
              'SELECT * FROM claims WHERE id = ?',
              [this.lastID],
              (err4, claim) => {
                if (err4) return reject(err4);
                resolve(claim);
              }
            );
          }
        );
      });
    });
  });
}

// PUBLIC_INTERFACE
// Mark claim as completed (only the claimer)
function completeClaim(claim_id, user_id) {
  const db = getDbConnection();
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM claims WHERE id = ?', [claim_id], (err, claim) => {
      if (err) return reject(err);
      if (!claim) return resolve(null);
      if (claim.user_id !== user_id) return resolve(null);
      if (claim.status === 'completed') return reject(new Error('Already completed.'));

      db.run(
        "UPDATE claims SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?",
        [claim_id],
        function (err2) {
          if (err2) return reject(err2);
          db.get('SELECT * FROM claims WHERE id = ?', [claim_id], (err3, updated) => {
            if (err3) return reject(err3);
            resolve(updated);
          });
        }
      );
    });
  });
}

// PUBLIC_INTERFACE
// List all claims for a user
function listClaimsForUser(user_id) {
  const db = getDbConnection();
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM claims WHERE user_id = ? ORDER BY claimed_at DESC', [user_id], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// PUBLIC_INTERFACE
// List all claims for a bounty
function listClaimsForBounty(bounty_id) {
  const db = getDbConnection();
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM claims WHERE bounty_id = ? ORDER BY claimed_at DESC', [bounty_id], function (err, rows) {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

module.exports = {
  claimBounty,
  completeClaim,
  listClaimsForUser,
  listClaimsForBounty,
};
