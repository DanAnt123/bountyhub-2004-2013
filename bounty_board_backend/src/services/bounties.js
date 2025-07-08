const { getDbConnection } = require('./db');

// PUBLIC_INTERFACE
// Create a bounty
function createBounty({ title, description, github_repo_link, amount, created_by }) {
  const db = getDbConnection();
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO bounties (title, description, github_repo_link, amount, created_by) VALUES (?, ?, ?, ?, ?)',
      [title, description || '', github_repo_link || '', amount, created_by],
      function (err) {
        if (err) return reject(err);
        db.get(
          'SELECT * FROM bounties WHERE id = ?',
          [this.lastID],
          (err2, bounty) => {
            if (err2) return reject(err2);
            resolve(bounty);
          }
        );
      }
    );
  });
}

// PUBLIC_INTERFACE
// List all bounties
function listBounties() {
  const db = getDbConnection();
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM bounties ORDER BY created_at DESC', [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// PUBLIC_INTERFACE
// Get a bounty by id
function getBountyById(id) {
  const db = getDbConnection();
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM bounties WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

// PUBLIC_INTERFACE
// Update a bounty by id (only specified fields)
function updateBounty(id, { title, description, github_repo_link, amount, status }) {
  const db = getDbConnection();
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM bounties WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      if (!row) return resolve(null);
      const newTitle = title !== undefined ? title : row.title;
      const newDescription = description !== undefined ? description : row.description;
      const newGithubRepo = github_repo_link !== undefined ? github_repo_link : row.github_repo_link;
      const newAmount = amount !== undefined ? amount : row.amount;
      const newStatus = status !== undefined ? status : row.status;

      db.run(
        'UPDATE bounties SET title = ?, description = ?, github_repo_link = ?, amount = ?, status = ? WHERE id = ?',
        [newTitle, newDescription, newGithubRepo, newAmount, newStatus, id],
        function (err2) {
          if (err2) return reject(err2);
          db.get('SELECT * FROM bounties WHERE id = ?', [id], (err3, updated) => {
            if (err3) return reject(err3);
            resolve(updated);
          });
        }
      );
    });
  });
}

// PUBLIC_INTERFACE
// Delete a bounty by id
function deleteBounty(id) {
  const db = getDbConnection();
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM bounties WHERE id = ?', [id], function (err) {
      if (err) return reject(err);
      resolve();
    });
  });
}

module.exports = {
  createBounty,
  listBounties,
  getBountyById,
  updateBounty,
  deleteBounty,
};
