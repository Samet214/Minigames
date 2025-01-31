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
  password: 'samet',
  database: 'Spel',
}).promise(); // <-- Add this

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
        SET nivå = ?, level = ?, pengar_tjanat = ?, exp_tjanat = ?, tid = ?, netvarde = ?
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
  try {
    const { updatedData, currentGameData } = req.body;

    if (!updatedData || !currentGameData) {
      return res.status(400).json({ error: 'Missing data in request body' });
    }

    const { username, nivå, level, pengar_tjanat, exp_tjanat, tid, netvarde } = updatedData;
    const { pengar_tjanat: gamePengar, exp_tjanat: gameExp } = currentGameData;

    // Validate required fields
    if (!username || nivå === undefined || level === undefined || pengar_tjanat === undefined || exp_tjanat === undefined || tid === undefined || netvarde === undefined) {
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

      // Run multiple database updates in parallel
      const updateQuery = `UPDATE memory SET nivå = ?, level = ?, pengar_tjanat = ?, exp_tjanat = ?, tid = ?, netvarde = ? WHERE username = ?`;
      const updateQuery2 = `UPDATE ekonomi SET value = value + ?, networth = networth + ? WHERE username = ?`;
      const updateQuery3 = `UPDATE poängssystem SET EXP = EXP + ? WHERE Namn = ?`;

      // Execute multiple queries asynchronously
      Promise.all([
        new Promise((resolve, reject) => {
          db.query(updateQuery, [updatedUser.nivå, updatedUser.level, updatedUser.pengar_tjanat, updatedUser.exp_tjanat, updatedUser.tid, updatedUser.netvarde, username], (err, result) => {
            if (err) reject(err);
            else resolve('Memory updated successfully');
          });
        }),
        new Promise((resolve, reject) => {
          ekonomiDb.query(updateQuery2, [gamePengar, gamePengar, username], (err, result) => {
            if (err) reject(err);
            else resolve('Ekonomi updated successfully');
          });
        }),
        new Promise((resolve, reject) => {
          anvandarDb.query(updateQuery3, [gameExp, username], (err, result) => {
            if (err) reject(err);
            else resolve('Poängssystem updated successfully');
          });
        }),
      ])
        .then((results) => {
          console.log(results);
          res.json({ message: 'User updated successfully', user: updatedUser });
        })
        .catch((error) => {
          console.error('Error updating user:', error);
          res.status(500).json({ error: 'Failed to update user' });
        });
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/squigglegolf', (req, res) => {
  const query = 'SELECT * FROM squigglegolf';

  spelDb.query(query, (err, results) => {
      if (err) {
          console.error('Error fetching data from squigglegolf table:', err);
          res.status(500).send('Internal Server Error');
          return;
      }

      res.json(results);
  });
});

app.post('/update-squigglegolf', (req, res) => {
  const { username, totalStrokes, levels, pengar_tjanat, exp_tjanat, timeTaken, networth } = req.body;

  if (!username || totalStrokes == null || levels == null || pengar_tjanat == null || exp_tjanat == null || timeTaken == null || networth == null) {
      return res.status(400).json({ error: 'Invalid request body' });
  }

  const checkQuery = 'SELECT * FROM squigglegolf WHERE username = ?';
  db.query(checkQuery, [username], (err, results) => {
      if (err) {
          console.error('Database query error:', err);
          return res.status(500).json({ error: 'Database error' });
      }

      if (results.length === 0) {
          // User doesn't exist, insert them
          const insertQuery = `
              INSERT INTO squigglegolf (username, slag, level, pengar_tjanat, exp_tjanat, tid, netvarde)
              VALUES (?, ?, ?, ?, ?, ?, ?)
          `;
          db.query(insertQuery, [username, totalStrokes, levels, pengar_tjanat, exp_tjanat, timeTaken, networth], (err) => {
              if (err) {
                  console.error('Error inserting user:', err);
                  return res.status(500).json({ error: 'Failed to insert user' });
              }
              res.json({ message: 'User inserted successfully' });
          });
      } else {
          // User exists, update them if necessary
          const user = results[0];

          const updatedUser = {
              slag: Math.min(user.slag, totalStrokes),
              level: Math.max(user.level, levels),
              pengar_tjanat: Math.max(user.pengar_tjanat, pengar_tjanat),
              exp_tjanat: Math.max(user.exp_tjanat, exp_tjanat),
              tid: Math.min(user.tid, timeTaken),
              netvarde: Math.max(user.netvarde, networth),
          };

          const updateQuery = `
              UPDATE squigglegolf
              SET slag = ?, level = ?, pengar_tjanat = ?, exp_tjanat = ?, tid = ?, netvarde = ?
              WHERE username = ?
          `;
          db.query(
              updateQuery,
              [
                  updatedUser.slag,
                  updatedUser.level,
                  updatedUser.pengar_tjanat,
                  updatedUser.exp_tjanat,
                  updatedUser.tid,
                  updatedUser.netvarde,
                  username,
              ],
              (err) => {
                  if (err) {
                      console.error('Error updating user:', err);
                      return res.status(500).json({ error: 'Failed to update user' });
                  }
                  res.json({ message: 'User updated successfully', user: updatedUser });
              }
          );
      }
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
  const { username, pengar_tjanat } = req.body;

  const query = `
      UPDATE ekonomi
      SET value = value + ?, networth = networth + ?
      WHERE username = ?
  `;

  

  ekonomiDb.query(query, [pengar_tjanat, pengar_tjanat, username], (err, results) => {
      if (err) {
          console.error('Error updating ekonomi table:', err);
          return res.status(500).json({ success: false, message: 'Failed to update ekonomi data.' });
      }
      res.json({ success: true, message: `Added ${pengar_tjanat} to value and networth.` });
  });
});



app.post('/update-netvarde', (req, res) => {
  const { username, pengar_tjanat } = req.body;

  const query = `
      UPDATE poängssystem
      SET EXP = EXP + ?
      WHERE Namn = ?
  `;

  anvandarDb.query(query, [pengar_tjanat, username], (err, results) => {
      if (err) {
          console.error('Error updating anvandar table:', err);
          return res.status(500).json({ success: false, message: 'Failed to update anvandar data.' });
      }
      res.json({ success: true, message: `Added ${pengar_tjanat} to value and networth.` });
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



app.post('/updateUserStats', (req, res) => {
  const { username, level, userlevel, averagetime, money, experience, userNetWorth } = req.body;

  const checkUserQuery = 'SELECT * FROM colourvision WHERE username = ?';

  spelDb.query(checkUserQuery, [username], (err, results) => {
      if (err) {
          console.error('Error checking user:', err);
          return res.status(500).json({ error: 'Database error' });
      }

      if (results.length > 0) {
          // User exists, update based on conditions
          const existingUser = results[0];

          const newLevel = level > existingUser.nivå ? level : existingUser.nivå;
          const newUserLevel = userlevel > existingUser.level ? userlevel : existingUser.level;
          const newTime = averagetime < existingUser.tid ? averagetime : existingUser.tid;
          const newMoney = money > existingUser.pengar_tjanat ? money : existingUser.pengar_tjanat;
          const newExperience = experience > existingUser.exp_tjanat ? experience : existingUser.exp_tjanat;
          const newNetworth = userNetWorth > existingUser.netvarde ? userNetWorth : existingUser.netvarde;

          const updateQuery = `
              UPDATE colourvision 
              SET nivå = ?, level = ?, tid = ?, pengar_tjanat = ?, exp_tjanat = ?, netvarde = ?
              WHERE username = ?
          `;

          spelDb.query(updateQuery, [newLevel, newUserLevel, newTime, newMoney, newExperience, newNetworth, username], (updateErr) => {
              if (updateErr) {
                  console.error('Error updating user:', updateErr);
                  return res.status(500).json({ error: 'Failed to update user' });
              }
              res.json({ message: 'User stats updated successfully' });
          });

      } else {
          // User does not exist, insert new record
          const insertQuery = `
              INSERT INTO colourvision (username, nivå, level, tid, pengar_tjanat, exp_tjanat, netvarde)
              VALUES (?, ?, ?, ?, ?, ?, ?)
          `;

          spelDb.query(insertQuery, [username, level, userlevel, averagetime, money, experience, userNetWorth], (insertErr) => {
              if (insertErr) {
                  console.error('Error inserting user:', insertErr);
                  return res.status(500).json({ error: 'Failed to insert user' });
              }
              res.json({ message: 'User inserted successfully' });
          });
      }
  });
});

async function updateSquiggleGolfTable(username, totalStrokes, timeTaken, levels, networth, pengar_tjanat, exp_tjanat) {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'samet',
        password: 'samet',
        database: 'Spel'
    });

    try {
        // Check if user exists
        const [rows] = await connection.execute('SELECT * FROM squigglegolf WHERE username = ?', [username]);

        if (rows.length > 0) {
            // User exists, check and update columns if necessary
            const user = rows[0];

            const updates = [];
            if (totalStrokes < user.slag) {
                updates.push({ column: 'slag', value: totalStrokes });
            }

            if (timeTaken < user.tid) {
                updates.push({ column: 'tid', value: timeTaken });
            }

            if (levels > user.level) {
                updates.push({ column: 'level', value: levels });
            }

            if (networth > user.netvarde) {
                updates.push({ column: 'netvarde', value: networth });
            }

            if (pengar_tjanat > user.pengar_tjanat) {
                updates.push({ column: 'pengar_tjanat', value: pengar_tjanat });
            }

            if (exp_tjanat > user.exp_tjanat) {
                updates.push({ column: 'exp_tjanat', value: exp_tjanat });
            }

            // Perform updates if necessary
            for (const update of updates) {
                await connection.execute(`UPDATE squigglegolf SET ${update.column} = ? WHERE username = ?`, [update.value, username]);
            }

        } else {
            // User does not exist, insert new record
            await connection.execute(
                'INSERT INTO squigglegolf (username, slag, tid, level, netvarde, pengar_tjanat, exp_tjanat) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [username, totalStrokes, timeTaken, levels, networth, pengar_tjanat, exp_tjanat]
            );
        }

    } catch (error) {
        console.error('Database error:', error);
    } finally {
        await connection.end();
    }
}

app.get("/colourvision", (req, res) => {
  const query = "SELECT username, nivå, level, tid, pengar_tjanat, exp_tjanat, netvarde FROM colourvision";
  spelDb.query(query, (error, results) => {
      if (error) {
          console.error("Error fetching Colourvision data: ", error);
          res.status(500).send("Internal Server Error");
      } else {
          res.json(results);
      }
  });
});

app.post("/mazerunner", async (req, res) => {
  const { username, nivå, level, tid, pengar_tjanat, exp_tjanat } = req.body;

  // Validate required fields
  if (!username || !nivå || !level || !tid || !pengar_tjanat || !exp_tjanat) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Check if the user already exists in the mazerunner table
    const checkUserQuery = "SELECT * FROM mazerunner WHERE username = ?";
    const result = await spelDb.execute(checkUserQuery, [username]);
    const existingUser = result[0]; // Access the first element of the result

    if (existingUser && existingUser.length > 0) {
      // User exists, update the existing record
      const updateQuery = `
        UPDATE mazerunner 
        SET nivå = ?, level = ?, tid = ?, pengar_tjanat = ?, exp_tjanat = ?
        WHERE username = ?
      `;
      const updateValues = [nivå, level, tid, pengar_tjanat, exp_tjanat, username];

      await spelDb.execute(updateQuery, updateValues);
      res.status(200).json({ message: "User updated successfully" });
    } else {
      // User does not exist, insert a new record
      const insertQuery = `
        INSERT INTO mazerunner (username, nivå, level, tid, pengar_tjanat, exp_tjanat)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const insertValues = [username, nivå, level, tid, pengar_tjanat, exp_tjanat];

      await spelDb.execute(insertQuery, insertValues);
      res.status(201).json({ message: "User inserted successfully" });
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to process user data" });
  }
});

app.put("/mazerunner", async (req, res) => {
  const { username, nivå, level, tid, pengar_tjanat, exp_tjanat } = req.body;

  // Validate required fields
  if (!username || !nivå || !level || !tid || !pengar_tjanat || !exp_tjanat) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Check if the user exists
    const checkUserQuery = "SELECT * FROM mazerunner WHERE username = ?";
    const [rows] = await spelDb.execute(checkUserQuery, [username]); // Destructure the result

    // Log the retrieved user data for debugging
    console.log("Retrieved user data:", rows);

    if (rows.length === 0) {
      // Insert new user
      const insertQuery = `
        INSERT INTO mazerunner (username, nivå, level, tid, pengar_tjanat, exp_tjanat)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      await spelDb.execute(insertQuery, [
        username, nivå, level, tid, pengar_tjanat, exp_tjanat,
      ]);
      console.log("Inserted new user:", { username, nivå, level, tid, pengar_tjanat, exp_tjanat });
      return res.status(201).json({ message: "User inserted successfully" });
    }

    // Extract existing values from the database
    const existingUser = rows[0];
    console.log("Existing user values:", existingUser);

    // Update existing user
    const updateQuery = `
      UPDATE mazerunner 
      SET 
        nivå = CASE WHEN ? > nivå THEN ? ELSE nivå END,
        level = CASE WHEN ? > level THEN ? ELSE level END,
        tid = CASE WHEN ? < tid THEN ? ELSE tid END,
        pengar_tjanat = CASE WHEN ? > pengar_tjanat THEN ? ELSE pengar_tjanat END,
        exp_tjanat = CASE WHEN ? > exp_tjanat THEN ? ELSE exp_tjanat END
      WHERE username = ?
    `;

    const updateValues = [
      nivå, nivå,
      level, level,
      tid, tid,
      pengar_tjanat, pengar_tjanat,
      exp_tjanat, exp_tjanat,
      username,
    ];

    console.log("Update values:", {
      nivå, level, tid, pengar_tjanat, exp_tjanat,
      existing_tid: existingUser.tid
    });

    await spelDb.execute(updateQuery, updateValues);
    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});


app.get("/mazerunner", async (req, res) => {
  const query = "SELECT * FROM mazerunner";

  try {
    const [results] = await spelDb.query(query); // Use await since spelDb is promise-based
    res.json(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Database query failed" });
  }
});


app.post('/updateEkonomi', (req, res) => {
  const { username, moneyToAdd, netWorthToAdd } = req.body;

  console.log('Received data:', { username, moneyToAdd, netWorthToAdd }); // Debugging

  if (!username || isNaN(moneyToAdd) || isNaN(netWorthToAdd)) {
      return res.status(400).json({ success: false, message: 'Invalid request data.' });
  }

  const query = `
      UPDATE ekonomi
      SET value = value + ?, networth = networth + ?
      WHERE username = ?;
  `;

  ekonomiDb.query(query, [moneyToAdd, netWorthToAdd, username], (err, result) => {
      if (err) {
          console.error('Database Error:', err);
          res.status(500).json({ success: false, message: 'Error updating ekonomi' });
      } else if (result.affectedRows > 0) {
          res.status(200).json({ success: true, message: 'Ekonomi updated successfully' });
      } else {
          res.status(404).json({ success: false, message: 'User not found in ekonomi table.' });
      }
  });
});


// Update användarinformation
app.post('/updateAnvandarinformation', (req, res) => {
  const { username, expToAdd } = req.body;

  console.log('Received data:', { username, expToAdd }); // Debugging

  if (!username || isNaN(expToAdd)) {
      return res.status(400).json({ success: false, message: 'Invalid request data.' });
  }

  const query = `
      UPDATE poängssystem
      SET EXP = EXP + ?
      WHERE Namn = ?;
  `;

  anvandarDb.query(query, [expToAdd, username], (err, result) => {
      if (err) {
          console.error('Database Error:', err);
          res.status(500).json({ success: false, message: 'Error updating experience' });
      } else if (result.affectedRows > 0) {
          res.status(200).json({ success: true, message: 'Experience updated successfully' });
      } else {
          res.status(404).json({ success: false, message: 'User not found in poängssystem table.' });
      }
  });
});

app.post('/updateUserStats', (req, res) => {
  const { username, level, userlevel } = req.body;

  if (!username || isNaN(level) || isNaN(userlevel)) {
      return res.status(400).json({ success: false, message: 'Invalid input data.' });
  }

  // Calculate the new values
  const updatedValue = 2 * level * userlevel;
  const updatedNetworth = 2 * level * userlevel;

  // Begin a transaction to ensure both updates succeed together
  ekonomiDb.beginTransaction(err => {
      if (err) {
          return res.status(500).json({ success: false, message: 'Error starting transaction.' });
      }

      // Update the ekonomi table
      const ekonomiQuery = `
          UPDATE ekonomi
          SET value = value + ?, networth = networth + ?
          WHERE username = ?;
      `;
      ekonomiDb.query(ekonomiQuery, [updatedValue, updatedNetworth, username], (err, ekonomiResult) => {
          if (err) {
              return ekonomiDb.rollback(() => {
                  console.error('Error updating ekonomi:', err);
                  res.status(500).json({ success: false, message: 'Error updating ekonomi.' });
              });
          }

          // Update the poängssystem table
          const poangQuery = `
              UPDATE poängssystem
              SET EXP = EXP + ?
              WHERE Namn = ?;
          `;
          ekonomiDb.query(poangQuery, [updatedValue, username], (err, poangResult) => {
              if (err) {
                  return ekonomiDb.rollback(() => {
                      console.error('Error updating poängssystem:', err);
                      res.status(500).json({ success: false, message: 'Error updating poängssystem.' });
                  });
              }

              // Commit the transaction
              ekonomiDb.commit(err => {
                  if (err) {
                      return ekonomiDb.rollback(() => {
                          console.error('Error committing transaction:', err);
                          res.status(500).json({ success: false, message: 'Error committing transaction.' });
                      });
                  }

                  res.status(200).json({
                      success: true,
                      message: 'User stats updated successfully!',
                      ekonomiResult,
                      poangResult
                  });
              });
          });
      });
  });
});

app.get("/get-networth", (req, res) => {
  const sql = "SELECT username, networth FROM ekonomi";
  
  ekonomiDb.query(sql, (err, results) => {
      if (err) {
          return res.status(500).json({ error: "Database query error" });
      }
      res.json(results);
  });
});

// Start the server on a specific port
const PORT = 3000;

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://samet-desktop.adm.huddinge.se:${PORT}`);
});
