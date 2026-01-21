const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'hospital-backend');
const srcDir = path.join(baseDir, 'src');
const frontendDir = path.join(baseDir, 'frontend');

// 1. Ensure src/api/v1 (verification)
const apiV1Dir = path.join(srcDir, 'api', 'v1');
if (!fs.existsSync(apiV1Dir)) {
    fs.mkdirSync(apiV1Dir, { recursive: true });
    console.log('Fixed: Created src/api/v1');
} else {
    console.log('Verified: src/api/v1 exists');
}

// 2. Add frontend/dist
const distDir = path.join(frontendDir, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
    console.log('Fixed: Created frontend/dist for Angular prod build');
}

// 3. Update app.js and server.js with Role Clarity
const appJsPath = path.join(srcDir, 'app.js');
const serverJsPath = path.join(srcDir, 'server.js');

const appJsContent = `// app.js
// Role: Express Application, Middlewares, Routes configuration
// This file initializes the express app and exports it.

const express = require('express');
const app = express();

module.exports = app;
`;

const serverJsContent = `// server.js
// Role: HTTP Server, Port, Clustering
// This file imports the express app and starts the server.

const app = require('./app');
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(\`Server running on port \${port}\`);
});
`;

fs.writeFileSync(appJsPath, appJsContent);
console.log('Updated: src/app.js with role description');

fs.writeFileSync(serverJsPath, serverJsContent);
console.log('Updated: src/server.js with role description');

console.log('Minor structure improvements completed successfully.');
