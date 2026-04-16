const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    log: [
        { level: 'query', emit: 'event' },
        { level: 'info', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
        { level: 'error', emit: 'stdout' },
    ],
});

// Log Queries for Development
if (process.env.NODE_ENV === 'development') {
    prisma.$on('query', (e) => {
        console.log(`\x1b[36mQuery: ${e.query}\x1b[0m`);
        console.log(`\x1b[33mParams: ${e.params}\x1b[0m`);
        console.log(`\x1b[32mDuration: ${e.duration}ms\x1b[0m`);
        console.log('---');
    });
}

prisma.$connect()
    .then(() => {
        console.log('✅ PostgreSQL Connected Successfully via Prisma');
    })
    .catch(err => {
        console.error('❌ PostgreSQL Connection Failed!');
        console.error('Error:', err.message);
        process.exit(1);
    });

module.exports = { prisma };
