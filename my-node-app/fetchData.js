const axios = require('axios');

// Fetch both endpoints in parallel
Promise.all([
  axios.get('http://localhost:3000/memory'),  // Fetch memory table data
  axios.get('http://localhost:3000/netvarde') // Fetch netvärde column data
])
  .then(([memoryResponse, netvardeResponse]) => {
    // Log data from the memory table
    console.log('Data from the memory table:', memoryResponse.data);

    // Log data from the netvärde column
    console.log('Data from the netvärde column:', netvardeResponse.data);
  })
  .catch((error) => {
    console.error('Error fetching data:', error.message);
  });

