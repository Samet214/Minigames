// Import required modules
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

// Initialize the Express app
const app = express();

app.use(cors());
app.use(express.json());

// Create a MySQL database connection for the "Spel" database
const spelDb = mysql.createConnection({
  host: 'localhost',
  user: 'samet',
  password: 'samet', // Replace with your MySQL password
  database: 'Spel', // "Spel" database name
});

// Create a MySQL database connection for the "ekonomi" database
const ekonomiDb = mysql.createConnection({
  host: 'localhost',
  user: 'samet',
  password: 'samet', // Replace with your MySQL password
  database: 'ekonomi', // "ekonomi" database name
});

// Connect to the "Spel" database
spelDb.connect((err) => {
  if (err) {
    console.error('Error connecting to the Spel database:', err);
    process.exit(1);
  }
  console.log('Connected to the Spel database.');
});

// Connect to the "ekonomi" database
ekonomiDb.connect((err) => {
  if (err) {
    console.error('Error connecting to the ekonomi database:', err);
    process.exit(1);
  }
  console.log('Connected to the ekonomi database.');
});

// Route to fetch all data from the "memory" table in the "Spel" database
app.get('/memory', (req, res) => {
  const query = 'SELECT * FROM memory';
  spelDb.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching data from memory table:', err);
      return res.status(500).send('Error fetching data from the memory table.');
    }

    // Log all rows from the memory table to the console
    console.log('Memory Table Data:', results);

    res.json(results); // Send the results as JSON
  });
});

// Route to fetch "netvärde" column from the "ekonomi" table in the "ekonomi" database
app.get('/netvarde', (req, res) => {
  const query = 'SELECT * FROM ekonomi';
  ekonomiDb.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching data from ekonomi table:', err);
      return res.status(500).send('Error fetching data from the ekonomi table.');
    }
    res.json(results); // Send the results as JSON
  });
});

// Route to insert or update data in the "memory" table
app.post('/add-memory', (req, res) => {
  const { username, nivå, level, pengar_tjänat, exp_tjänat, tid, position, netvarde } = req.body;

  const checkUserQuery = 'SELECT * FROM memory WHERE username = ?';
  spelDb.query(checkUserQuery, [username], (err, results) => {
    if (err) {
      console.error('Error checking if user exists:', err);
      return res.status(500).send('Error checking if user exists.');
    }

    if (results.length > 0) {
      const existingData = results[0];
      const updatedData = {
        nivå: Math.max(existingData.nivå, nivå),
        level: Math.max(existingData.level, level),
        pengar_tjänat: Math.max(existingData.pengar_tjänat, pengar_tjänat),
        exp_tjänat: Math.max(existingData.exp_tjänat, exp_tjänat),
        tid: Math.min(existingData.tid, tid),
        position: position !== existingData.position ? position : existingData.position,
        netvarde: Math.max(existingData.netvarde || 0, netvarde),
      };

      const updateQuery = `
        UPDATE memory 
        SET nivå = ?, level = ?, pengar_tjänat = ?, exp_tjänat = ?, tid = ?, position = ?, netvarde = ?
        WHERE username = ?
      `;
      spelDb.query(
        updateQuery,
        [
          updatedData.nivå,
          updatedData.level,
          updatedData.pengar_tjänat,
          updatedData.exp_tjänat,
          updatedData.tid,
          updatedData.position,
          updatedData.netvarde,
          username,
        ],
        (updateErr) => {
          if (updateErr) {
            console.error('Error updating memory data:', updateErr);
            return res.status(500).send('Error updating memory data.');
          }
          res.status(200).json({ message: 'Data updated successfully' });
        }
      );
    } else {
      const query = `
        INSERT INTO memory (username, nivå, level, pengar_tjänat, exp_tjänat, tid, position, netvarde)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      spelDb.query(
        query,
        [username, nivå, level, pengar_tjänat, exp_tjänat, tid, position, netvarde],
        (err) => {
          if (err) {
            console.error('Error inserting data into memory table:', err);
            return res.status(500).send('Error inserting data into the memory table.');
          }
          res.status(200).json({ message: 'Data inserted successfully' });
        }
      );
    }
  });
});

// Start the server on a specific port
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});