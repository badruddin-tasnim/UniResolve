// seed.js
// Database initialization and seeding script

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration check
if (!process.env.DB_DATABASE) {
    console.error("Error: DB_DATABASE environment variable not set in .env.");
    process.exit(1);
}

// Create connection pool (connects to standard postgres database first to create 'uniresolve' database if needed)
const systemPool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: 'postgres' // Connect to default admin db first
});

async function runSeed() {
    let client;
    try {
        console.log("Connecting to PostgreSQL to check database...");
        client = await systemPool.connect();
        
        // 1. Create database if it doesn't exist
        const dbName = process.env.DB_DATABASE;
        const dbExistsQuery = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
        if (dbExistsQuery.rowCount === 0) {
            console.log(`Database '${dbName}' does not exist. Creating it...`);
            // Run without transactions because CREATE DATABASE cannot run inside a transaction block
            await client.query(`CREATE DATABASE ${dbName}`);
            console.log(`Database '${dbName}' created successfully.`);
        } else {
            console.log(`Database '${dbName}' already exists.`);
        }
        client.release();
        await systemPool.end();

        // 2. Connect to the actual uniresolve database
        console.log(`Connecting directly to database '${dbName}' to run schema...`);
        const appPool = new Pool({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: dbName
        });
        
        const appClient = await appPool.connect();

        // Read and run the SQL schema file
        const sqlPath = path.join(__dirname, 'database.sql');
        const sqlSchema = fs.readFileSync(sqlPath, 'utf8');
        console.log("Creating tables using database.sql...");
        await appClient.query(sqlSchema);
        console.log("Tables created successfully.");

        // 3. Insert seed users with hashed passwords
        console.log("Seeding users...");
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        // Insert Student
        const studentResult = await appClient.query(
            "INSERT INTO users (name, email, password, role, roll) VALUES ($1, $2, $3, $4, $5) RETURNING id",
            ['John Doe', 'student@university.edu', hashedPassword, 'student', '2003101']
        );
        const studentId = studentResult.rows[0].id;
        console.log(`Student created (ID: ${studentId}, Email: student@university.edu, Password: password123, Roll: 2003101)`);

        // Insert another Student (Jane Smith)
        const student2Result = await appClient.query(
            "INSERT INTO users (name, email, password, role, roll) VALUES ($1, $2, $3, $4, $5) RETURNING id",
            ['Jane Smith', 'jane@university.edu', hashedPassword, 'student', '2003102']
        );
        const student2Id = student2Result.rows[0].id;

        // Insert another Student (Mark Taylor)
        const student3Result = await appClient.query(
            "INSERT INTO users (name, email, password, role, roll) VALUES ($1, $2, $3, $4, $5) RETURNING id",
            ['Mark Taylor', 'mark@university.edu', hashedPassword, 'student', '2003103']
        );
        const student3Id = student3Result.rows[0].id;

        // Insert Admin
        const adminPasswordHash = await bcrypt.hash('ruet123', salt);
        const adminResult = await appClient.query(
            "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id",
            ['Admin Staff', 'admin@ruet.ac.bd', adminPasswordHash, 'admin']
        );
        const adminId = adminResult.rows[0].id;
        console.log(`Admin created (ID: ${adminId}, Email: admin@ruet.ac.bd, Password: ruet123)`);

        // 4. Insert dummy complaints with correct user foreign key mappings
        console.log("Seeding dummy complaints...");
        
        const dummyComplaints = [
            {
                title: 'Wi-Fi not working in Library',
                description: 'The wifi drops out every 5 minutes in the central library zone.',
                category: 'IT',
                status: 'pending',
                date: '2023-10-25',
                userId: studentId
            },
            {
                title: 'Broken chair in Room 302',
                description: 'Desk chair is missing a wheel and is unsafe.',
                category: 'Facilities',

                status: 'in_progress',
                date: '2023-10-24',
                userId: student2Id
            },
            {
                title: 'Cafeteria food hygiene issue',
                description: 'Found insects in the salad bar at lunchtime.',
                category: 'Food',
                status: 'resolved',
                date: '2023-10-20',
                userId: student3Id
            },
            {
                title: 'Projector missing cable',
                description: 'Cannot connect laptop to the projector in lecture hall B.',
                category: 'IT',
                status: 'pending',
                date: '2023-10-26',
                userId: studentId
            }
        ];

        for (const c of dummyComplaints) {
            await appClient.query(
                "INSERT INTO complaints (title, description, category, status, date, user_id) VALUES ($1, $2, $3, $4, $5, $6)",
                [c.title, c.description, c.category, c.status, c.date, c.userId]
            );
        }

        console.log("Dummy complaints seeded successfully.");
        
        appClient.release();
        await appPool.end();
        console.log("Database seeding completed successfully! 🎉");
        
    } catch (err) {
        console.error("Error running database seed:", err);
        if (client) client.release();
        process.exit(1);
    }
}

runSeed();
