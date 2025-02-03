const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// MySQL connection with retry logic
const dbConfig = {
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'root',
    database: process.env.DB_NAME || 'clickops_db'
};

let db;

function connectWithRetry() {
    db = mysql.createConnection(dbConfig);
    db.connect(err => {
        if (err) {
            console.error('Database connection failed. Retrying in 5 seconds...', err);
            setTimeout(connectWithRetry, 5000);
        } else {
            console.log('Connected to MySQL database.');
        }
    });
}

connectWithRetry(); // Start connection attempts

// Serve static files
app.use(express.static('public'));

// Register route with age and gender
app.post('/register', (req, res) => {
    const { name, course, age, gender } = req.body;

    // Validate input
    if (!name || !course || age === undefined || gender === undefined) {
        return res.status(400).json({ error: 'Name, course, age, and gender are required' });
    }

    const sql = 'INSERT INTO clickops (name, course, age, gender) VALUES (?, ?, ?, ?)';
    db.query(sql, [name, course, age, gender], (err, result) => {
        if (err) {
            console.error('Error inserting data: ', err);
            return res.status(500).json({ error: 'Database error' });
        }
        console.log('Insert result:', result);
        res.json({ message: 'Congratulations, you have successfully registered!', id: result.insertId });
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

