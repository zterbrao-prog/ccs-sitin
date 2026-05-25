const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function setup() {
  // Connect WITHOUT database first so we can create it if needed
  const conn = await mysql.createConnection({
    host:     process.env.MYSQLHOST     || 'localhost',
    user:     process.env.MYSQLUSER     || 'root',
    password: process.env.MYSQLPASSWORD || '112002',
    port:     process.env.MYSQLPORT     || 3306,
  });

  console.log('✅ Connected to MySQL...');

  // Create database if it doesn't exist
  await conn.query(`CREATE DATABASE IF NOT EXISTS ccs_sitin`);
  await conn.query(`USE ccs_sitin`);
  console.log('✅ Database ccs_sitin ready.');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      idNumber VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      firstName VARCHAR(100) NOT NULL,
      lastName VARCHAR(100) NOT NULL,
      middleName VARCHAR(100) DEFAULT '',
      email VARCHAR(150) DEFAULT '',
      address VARCHAR(255) DEFAULT '',
      role ENUM('student', 'admin') DEFAULT 'student',
      course VARCHAR(100) DEFAULT 'N/A',
      courseLevel INT DEFAULT 0,
      remainingSessions INT DEFAULT 30,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS sitins (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      studentId VARCHAR(50) NOT NULL,
      studentName VARCHAR(255) NOT NULL,
      purpose VARCHAR(255) NOT NULL,
      lab VARCHAR(100) NOT NULL,
      pcNumber INT DEFAULT NULL,
      timeIn DATETIME NOT NULL,
      timeOut DATETIME DEFAULT NULL,
      status ENUM('active', 'done') DEFAULT 'active',
      date VARCHAR(50) NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS sitin_requests (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      studentId VARCHAR(50) NOT NULL,
      studentName VARCHAR(255) NOT NULL,
      purpose VARCHAR(255) NOT NULL,
      lab VARCHAR(100) NOT NULL,
      pcNumber INT DEFAULT NULL,
      status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS announcements (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      date VARCHAR(50) NOT NULL,
      time VARCHAR(50) NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS feedback (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      studentId VARCHAR(50) NOT NULL,
      studentName VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      date VARCHAR(50) NOT NULL,
      time VARCHAR(50) NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS rewards (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      studentId VARCHAR(50) NOT NULL,
      points INT NOT NULL,
      reason VARCHAR(255) NOT NULL,
      date VARCHAR(50) NOT NULL,
      time VARCHAR(50) NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS pc_reservations (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      lab VARCHAR(100) NOT NULL,
      pcNumber INT NOT NULL,
      studentId VARCHAR(50) NOT NULL,
      reservedAt BIGINT NOT NULL,
      expiresAt BIGINT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ All tables created.');

  // Create admin account if not exists
  const [existing] = await conn.query(`SELECT id FROM users WHERE idNumber = 'admin'`);
  if (existing.length === 0) {
    const hashed = await bcrypt.hash('admin123', 10);
    await conn.query(`
      INSERT INTO users (idNumber, password, firstName, lastName, role, remainingSessions)
      VALUES ('admin', ?, 'Admin', 'CCS', 'admin', 9999)
    `, [hashed]);
    console.log('✅ Admin account created: ID=admin, Password=admin123');
  } else {
    console.log('ℹ️  Admin account already exists.');
  }

  await conn.end();
  console.log('\n✅ Setup complete! Now run: node server/index.js\n');
}

setup().catch(err => {
  console.error('\n❌ Setup failed:', err.message);
  console.error('   Make sure MySQL is running and the password in setup.js is correct.\n');
  process.exit(1);
});
