const { Client } = require('pg');
require('dotenv').config();

const tablesToReset = [
    'master_title',
    'master_pincode',
    'master_city',
    'master_district',
    'master_state',
    'master_gender',
    'master_nationality',
    'master_religion',
    'master_id_proof_type',
    'master_language',
    'master_referral_source',
    'master_death_cause',
    'master_patient_category',
    'master_marital_status',
    'master_blood_group',
    'master_occupation',
    'master_education_level',
    'master_socio_economic_class',
    'master_relationship',
    'hospital_branch'
];

async function resetAndSeed() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        await client.connect();
        console.log('--- Resetting Master Data ---');

        const tablesString = tablesToReset.join(', ');
        console.log(`Truncating tables: ${tablesString}...`);
        await client.query(`TRUNCATE TABLE ${tablesString} RESTART IDENTITY CASCADE`);

        console.log('All master tables truncated. IDs reset to 1.');

        console.log('\n--- Seeding master_gender ---');
        const genders = [
            ['Male', 'M'],
            ['Female', 'F'],
            ['Other', 'O'],
            ['Transgender', 'T'],
            ['Prefer not to say', 'PNS']
        ];

        for (const gender of genders) {
            await client.query('INSERT INTO master_gender (gender_name, gender_code) VALUES ($1, $2)', gender);
        }
        console.log('master_gender seeded.');

        console.log('\n--- Seeding other tables ---');

        const categories = ['Self-Pay', 'Corporate', 'Insurance', 'Govt Scheme', 'Staff', 'VIP'];
        for (const cat of categories) {
            await client.query('INSERT INTO master_patient_category (category_name) VALUES ($1)', [cat]);
        }

        const maritalStatus = ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'];
        for (const status of maritalStatus) {
            await client.query('INSERT INTO master_marital_status (status_name) VALUES ($1)', [status]);
        }

        const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
        for (const group of bloodGroups) {
            await client.query('INSERT INTO master_blood_group (group_name) VALUES ($1)', [group]);
        }

        console.log('Basic seeding complete!');

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

resetAndSeed();
