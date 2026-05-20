# CCS Sit-In Monitoring System
## Setup Instructions (Node.js + MySQL)

---

## STEP 1 — Open the project folder
Extract this zip and open the `ccs-sitin` folder.

---

## STEP 2 — Open Command Prompt in the folder
1. Inside the `ccs-sitin` folder, click on the address bar at the top
2. Type `cmd` and press Enter
3. A Command Prompt window will open inside that folder

---

## STEP 3 — Install dependencies
In the Command Prompt, type:
```
npm install
```
Wait for it to finish.

---

## STEP 4 — Setup the database
In the same Command Prompt, type:
```
node server/setup.js
```
This will create the MySQL database and all tables automatically.

You should see:
```
Connected to MySQL...
Admin account created: ID=admin, Password=admin123
Database setup complete!
```

---

## STEP 5 — Start the server
```
npm start
```

You should see:
```
✅ CCS Sit-In System running at: http://localhost:3000
```

---

## STEP 6 — Open in browser
Go to: **http://localhost:3000**

### Default admin account:
- **ID:** admin
- **Password:** admin123

---

## Notes
- Keep the Command Prompt open while using the system (that's the server running)
- To stop the server: press `Ctrl + C` in the Command Prompt
- Data is now saved in MySQL — it won't disappear when you close the browser!
