Final Project for ECO 416 / FIN 516 (Fintech) at Princeton. 


# Setup overview
Set up database (mongod) + backend server (backend/server.js) + frontend server (app.js). Open three terminals and use the following commands:

# Database setup (Local machine)
```
mkdir -p ./mongodb_data (if ./mongodb_data not present)
mongod --dbpath ./mongodb_data
```

# Backend server setup
```
cd backend
node server.js
```

# Frontend setup
```
npm start
```
