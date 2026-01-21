// server.js
// Role: HTTP Server, Port, Clustering
// This file imports the express app and starts the server.

const app = require('./app');
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
