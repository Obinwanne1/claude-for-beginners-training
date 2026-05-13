const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');

/**
 * Read the entire database.
 * @returns {object}
 */
function read() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Write the entire database.
 * @param {object} data
 */
function write(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = { read, write };
