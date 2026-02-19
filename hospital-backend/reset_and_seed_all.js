const mysql = require('mysql2/promise');
require('dotenv').config();

const tablesToReset = [
    'master_title', // Title references gender, so reset it first
    'master_pincode', // references city
    'master_city', // references district
    'master_district', // references state
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
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('--- Resetting Master Data ---');

        // Disable foreign key checks to allow TRUNCATE
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        for (const table of tablesToReset) {
            console.log(`Truncating ${table}...`);
            await connection.query(`TRUNCATE TABLE ${table}`);
        }

        // Re-enable foreign key checks
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ All master tables truncated. IDs reset to 1.');

        console.log('\n--- Seeding master_gender ---');
        const genders = [
            ['Male', 'M'],
            ['Female', 'F'],
            ['Other', 'O'],
            ['Transgender', 'T'],
            ['Prefer not to say', 'PNS']
        ];
        await connection.query(
            'INSERT INTO master_gender (gender_name, gender_code) VALUES ?',
            [genders]
        );
        console.log('✅ master_gender seeded.');

        // Add more seeds here if needed or run the existing seed file
        console.log('\n--- Seeding other tables from master_data.sql patterns ---');

        const categories = [['Self-Pay'], ['Corporate'], ['Insurance'], ['Govt Scheme'], ['Staff'], ['VIP']];
        await connection.query('INSERT INTO master_patient_category (category_name) VALUES ?', [categories]);

        const maritalStatus = [['Single'], ['Married'], ['Divorced'], ['Widowed'], ['Separated']];
        await connection.query('INSERT INTO master_marital_status (status_name) VALUES ?', [maritalStatus]);

        const bloodGroups = [['A+'], ['A-'], ['B+'], ['B-'], ['AB+'], ['AB-'], ['O+'], ['O-'], ['Unknown']];
        await connection.query('INSERT INTO master_blood_group (group_name) VALUES ?', [bloodGroups]);

        console.log('✅ Basic seeding complete!');
        console.log('\nFinal Tip: Always use TRUNCATE TABLE instead of DELETE to reset IDs to 1.');

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        if (connection) await connection.end();
    }
}

resetAndSeed();
