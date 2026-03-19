
//CREATE TABLE players (id INTEGER PRIMARY KEY AUTOINCREMENT, accountid INTEGER UNIQUE, name TEXT, current_race TEXT, lastconnect REAL, bank_level INTEGER, rested_xp INTEGER)
type Player = {
    id: number;
    accountid: number;
    name: string;
    current_race: string;
    lastconnect: number;
    bank_level: number;
    rested_xp: number;
}

//CREATE TABLE skills (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, race TEXT, playerid INTEGER, level INTEGER DEFAULT 0)
type Skill = {
    id?: number; // optional because it is auto-incremented
    name: string;
    race: string;
    playerid: number;
    level: number;
}

// knex connection
import * as fs from 'fs';
import knex from 'knex';
import * as path from 'path';

const dbFile = path.join(__dirname, '..', 'players.sqlite');
if (!fs.existsSync(dbFile)) {
    console.warn('Database file not found:', dbFile);
}

const db = knex({
    client: 'sqlite3',
    connection: {
        filename: dbFile
    },
    useNullAsDefault: true
});

console.log('Connecting to database (file:', dbFile, ')...');

// knex sqlite n’émet pas d’événement "open"; on teste avec une requête brute.
db.raw('select 1')
    .then(() => {
        console.log('Connected to database');

        // suppression des joueurs sans accountid
        return db('players').whereNull('accountid').select().then((players: Player[]) => {
            const deletes = players.map((player) => {
                console.log('Removing player with id:', player.id, 'and name:', player.name);
                return db('players').where({ id: player.id }).del();
            });
            return Promise.all(deletes);
        });
    })
    .then(() => {
        // suppression de toutes les compétences
        return db('skills').del().then(() => {
            console.log('Removed all skills');
        });
    })
    .then(() => {
        // insertion de compétences pour tous les joueurs valides
        return db('players').whereNotNull('accountid').select().then((players: Player[]) => {
            if (players.length === 0) {
                console.log('Aucun joueur avec accountid, pas d’insertion de skills');
                return;
            }

            const entries: Skill[] = players.flatMap((player) => [
                { name: 'levitation', race: 'undead_scourge', level: 8, playerid: player.id },
                { name: 'unholy_aura', race: 'undead_scourge', level: 8, playerid: player.id },
                { name: 'vampiric_aura', race: 'undead_scourge', level: 8, playerid: player.id },
                { name: 'suicide_bomber', race: 'undead_scourge', level: 8, playerid: player.id }
            ]);

            return db('skills').insert(entries).then(() => {
                console.log('Inserted skills for undead_scourge');
            });
        });
    })
    .catch((err) => {
        console.error('Database error:', err);
    })
    .finally(() => {
        return db.destroy();
    });