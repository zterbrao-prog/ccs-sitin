===================================================
  PELISAN CCS Sit-In Monitoring System
===================================================

HOW TO RUN:
-----------
1. Start XAMPP → Start MySQL (Apache not needed)

2. Open CMD in this folder and run:
     node server/setup.js
     node server/index.js

3. Open browser: http://localhost:3000

DEFAULT ADMIN LOGIN:
--------------------
  ID:       admin
  Password: admin123

DATABASE PASSWORD:
------------------
By default, db.js uses an EMPTY password (standard XAMPP).
If your MySQL has a different password, open:
  server/db.js  and  server/setup.js
and change this line:
  password: process.env.MYSQLPASSWORD || '',
to your actual MySQL root password, e.g.:
  password: process.env.MYSQLPASSWORD || 'yourpassword',

===================================================
