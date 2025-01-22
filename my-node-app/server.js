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
});

// Connect to the "ekonomi" database
ekonomiDb.connect((err) => {
  if (err) {
    console.error('Error connecting to the ekonomi database:', err);
    process.exit(1);
  }
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

      const updateQuery = 
        `UPDATE memory 
        SET nivå = ?, level = ?, pengar_tjanat = ?, exp_tjanat = ?, tid = ?, position = ?, netvarde = ?
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
      const query = 
        `INSERT INTO memory (username, nivå, level, pengar_tjanat, exp_tjanat, tid, netvarde)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      spelDb.query(
        query,
        [username, nivå, level, pengar_tjänat, exp_tjänat, tid, netvarde],
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

const db = mysql.createConnection({
  host: 'localhost', // or your DB host
  user: 'samet', // username
  password: 'samet', // password
  database: 'Spel', // database name
});

db.connect(err => {
  if (err) {
      console.error('Database connection failed:', err);
      process.exit(1);
  }
});

app.post('/update-memory', (req, res) => {
  const { username, nivå, level, pengar_tjanat, exp_tjanat, tid, netvarde } = req.body;

  if (!username || nivå == null || level == null || pengar_tjanat == null || exp_tjanat == null || tid == null || netvarde == null) {
      return res.status(400).json({ error: 'Invalid request body' });
  }

  // Check if user exists in the database
  const query = 'SELECT * FROM memory WHERE username = ?';
  db.query(query, [username], (err, results) => {
      if (err) {
          console.error('Database query error:', err);
          return res.status(500).json({ error: 'Database error' });
      }

      if (results.length === 0) {
          return res.status(404).json({ error: 'User not found' });
      }

      const user = results[0];

      // Update logic
      const updatedUser = {
          nivå: Math.max(user.nivå, nivå),
          level: Math.max(user.level, level),
          pengar_tjanat: Math.max(user.pengar_tjanat, pengar_tjanat),
          exp_tjanat: Math.max(user.exp_tjanat, exp_tjanat),
          tid: Math.min(user.tid, tid),
          netvarde: Math.max(user.netvarde, netvarde),
      };

      const updateQuery = `
          UPDATE memory
          SET nivå = ?, level = ?, pengar_tjanat = ?, exp_tjanat = ?, tid = ?, netvarde = ?
          WHERE username = ?
      `;

      db.query(
          updateQuery,
          [
              updatedUser.nivå,
              updatedUser.level,
              updatedUser.pengar_tjanat,
              updatedUser.exp_tjanat,
              updatedUser.tid,
              updatedUser.netvarde,
              username,
          ],
          (err, updateResults) => {
              if (err) {
                  console.error('Error updating user:', err);
                  return res.status(500).json({ error: 'Failed to update user' });
              }

              console.log('User updated successfully:', updatedUser);
              res.json({ message: 'User updated successfully', user: updatedUser });
          }
      );
  });
});



// Route to fetch and log the total number of users in the "memory" table
app.get('/memory-count', (req, res) => {
  const query = 'SELECT COUNT(*) AS totalUsers FROM memory';
  spelDb.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching user count from memory table:', err);
      return res.status(500).send('Error fetching user count from the memory table.');
    }

    const totalUsers = results[0].totalUsers;
    console.log('Total number of users in the memory table:', totalUsers);

    res.json({ totalUsers }); // Send the count as JSON
  });
});

// Route to fetch user counts from multiple tables in the "Spel" database
app.get('/user-counts', (req, res) => {
  const tables = ['biljard', 'colourvision', 'mazerunner', 'memory', 'squigglegolf'];
  const results = {};
  let completed = 0;

  tables.forEach((table) => {
    const query = `SELECT COUNT(*) AS totalUsers FROM ${table}`;
    spelDb.query(query, (err, tableResults) => {
      if (err) {
        console.error(`Error fetching user count from ${table} table:, err`);
        results[table] = 'Error fetching count';
      } else {
        results[table] = tableResults[0].totalUsers;
        console.log(`Total users in ${table} table:, tableResults[0].totalUsers`);
      }

      completed++;
      if (completed === tables.length) {
        res.json(results); // Send the results after processing all tables
      }
    });
  });
});

// Route to fetch nivå values along with usernames, sorted by nivå in descending order
app.get('/memory/niva', (req, res) => {
  const query = 
    `SELECT username, nivå
    FROM memory
    ORDER BY nivå DESC
  `;

  spelDb.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching nivå data from memory table:', err);
      return res.status(500).send('Error fetching nivå data from memory table.');
    }

    res.json(results); // Send the sorted results as JSON
  });
});

app.get('/memory/levels', (req, res) => {
  const query = 
    `SELECT username, level
    FROM memory
    ORDER BY level DESC
  `;

  spelDb.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching nivå data from memory table:', err);
      return res.status(500).send('Error fetching nivå data from memory table.');
    }

    res.json(results); // Send the sorted results as JSON
  });
});

app.get('/memory/tid', (req, res) => {
  const query = 
    `SELECT username, tid
    FROM memory
    ORDER BY tid ASC
  `;

  spelDb.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching nivå data from memory table:', err);
      return res.status(500).send('Error fetching nivå data from memory table.');
    }

    res.json(results); // Send the sorted results as JSON
  });
});

app.get('/memory/pengar', (req, res) => {
  const query = 
    `SELECT username, pengar_tjanat
    FROM memory
    ORDER BY pengar_tjanat DESC
  `;

  spelDb.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching nivå data from memory table:', err);
      return res.status(500).send('Error fetching nivå data from memory table.');
    }

    res.json(results); // Send the sorted results as JSON
  });
});

app.get('/memory/exp', (req, res) => {
  const query = 
    `SELECT username, exp_tjanat
    FROM memory
    ORDER BY exp_tjanat DESC
  `;

  spelDb.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching nivå data from memory table:', err);
      return res.status(500).send('Error fetching nivå data from memory table.');
    }

    res.json(results); // Send the sorted results as JSON
  });
});

app.get('/memory/netvarde', (req, res) => {
  const query = 
    `SELECT username, netvarde
    FROM memory
    ORDER BY netvarde DESC
  `;

  spelDb.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching nivå data from memory table:', err);
      return res.status(500).send('Error fetching nivå data from memory table.');
    }

    res.json(results); // Send the sorted results as JSON
  });
});

const anvandarDb = mysql.createConnection({
  host: 'localhost',
  user: 'samet',
  password: 'samet', // Replace with your MySQL password
  database: 'användarinformation', // "Spel" database name
});

app.get('/poangssystem', (req, res) => {
  const query = `SELECT * FROM poängssystem;`;

  anvandarDb.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching data from användarinformation and poängssystem:', err);
      return res.status(500).send('Error fetching data from the tables.');
    }

    res.json(results); // Send the combined results as JSON
  });
});


app.get('/ekonomi', (req, res) => {
  const query = `SELECT * FROM ekonomi;`;

  ekonomiDb.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching data from användarinformation and poängssystem:', err);
      return res.status(500).send('Error fetching data from the tables.');
    }

    res.json(results); // Send the combined results as JSON
  });
});

app.post('/insert-memory', (req, res) => {
  const { username, level, userlevel, pengar_tjanat, exp_tjanat, tid, netvarde } = req.body;

  const query = `
      INSERT INTO memory (username, nivå, level, pengar_tjanat, exp_tjanat, tid, netvarde)
      VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  spelDb.query(query, [username, level, userlevel, pengar_tjanat, exp_tjanat, tid, netvarde], (err, results) => {
      if (err) {
          console.error('Error inserting data into memory table:', err);
          return res.status(500).json({ success: false, message: 'Failed to insert data.' });
      }
      res.json({ success: true });
  });
});

app.post('/update-ekonomi', (req, res) => {
  const { username, value, networth } = req.body;

  const query = `
      UPDATE ekonomi
      SET value = ?, networth = ?
      WHERE username = ?
  `;

  ekonomiDb.query(query, [value, networth, username], (err, results) => {
      if (err) {
          console.error('Error updating ekonomi table:', err);
          return res.status(500).json({ success: false, message: 'Failed to update ekonomi data.' });
      }
      res.json({ success: true });
  });
});

app.get('/anvandare', (req, res) => {
  const query = `SELECT * FROM användare;`;

  anvandarDb.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching data from användarinformation and poängssystem:', err);
      return res.status(500).send('Error fetching data from the tables.');
    }

    res.json(results); // Send the combined results as JSON
  });
});





// Start the server on a specific port
const PORT = 3000;

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://samet-desktop.adm.huddinge.se:${PORT}`);
});