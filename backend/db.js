const Datastore = require('nedb-promises');
const path = require('path');

const dbPath = (name) => path.join(__dirname, 'data', `${name}.db`);

const db = {
    items: Datastore.create({ filename: dbPath('items'), autoload: true }),
    claims: Datastore.create({ filename: dbPath('claims'), autoload: true }),
    users: Datastore.create({ filename: dbPath('users'), autoload: true })
};

module.exports = db;
