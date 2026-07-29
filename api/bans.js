import mysql from 'mysql2/promise';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    try {
        const connection = await mysql.createConnection({
            host: '23.139.82.19',
            port: 30050,
            user: 'u305_iumUkCPrlh',
            password: 'kG7+d+tqy5n0^ylCi^0!0pQ3',
            database: 's305_litebans'
        });

        const [rows] = await connection.execute(
            'SELECT name, reason, banned_by_name, time, until FROM litebans_bans WHERE active = 1 ORDER BY id DESC LIMIT 20'
        );

        await connection.end();
        return res.status(200).json(rows);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
