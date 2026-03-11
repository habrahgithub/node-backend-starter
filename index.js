const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello World from SWD Pulse!');
});

// Only start the server if this file is run directly (not required as a module)
if (require.main === module) {
  app.listen(port, () => {
    console.log(`SWD Pulse app listening on port ${port}`);
  });
}

module.exports = app;
