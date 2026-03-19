"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// knex connection
var fs = require("fs");
var knex_1 = require("knex");
var path = require("path");
var dbFile = path.join(__dirname, '..', 'players.sqlite');
if (!fs.existsSync(dbFile)) {
    console.warn('Database file not found:', dbFile);
}
var db = (0, knex_1.default)({
    client: 'sqlite3',
    connection: {
        filename: dbFile
    },
    useNullAsDefault: true
});
console.log('Connecting to database (file:', dbFile, ')...');
// knex sqlite n’émet pas d’événement "open"; on teste avec une requête brute.
db.raw('select 1')
    .then(function () {
    console.log('Connected to database');
    // suppression des joueurs sans accountid
    return db('players').whereNull('accountid').select().then(function (players) {
        var deletes = players.map(function (player) {
            console.log('Removing player with id:', player.id, 'and name:', player.name);
            return db('players').where({ id: player.id }).del();
        });
        return Promise.all(deletes);
    });
})
    .then(function () {
    // suppression de toutes les compétences
    return db('skills').del().then(function () {
        console.log('Removed all skills');
    });
})
    .then(function () {
    // insertion de compétences pour tous les joueurs valides
    return db('players').whereNotNull('accountid').select().then(function (players) {
        if (players.length === 0) {
            console.log('Aucun joueur avec accountid, pas d’insertion de skills');
            return;
        }
        var entries = players.flatMap(function (player) { return [
            { name: 'levitation', race: 'undead_scourge', level: 8, playerid: player.id },
            { name: 'unholy_aura', race: 'undead_scourge', level: 8, playerid: player.id },
            { name: 'vampiric_aura', race: 'undead_scourge', level: 8, playerid: player.id },
            { name: 'suicide_bomber', race: 'undead_scourge', level: 8, playerid: player.id }
        ]; });
        return db('skills').insert(entries).then(function () {
            console.log('Inserted skills for undead_scourge');
        });
    });
})
    .catch(function (err) {
    console.error('Database error:', err);
})
    .finally(function () {
    return db.destroy();
});
