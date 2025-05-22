Backend: express.js
Frontend: Vite + React
# How to Run

## Server
```bash
cd server
npm i
npm run dev
```
## Client
```bash
cd client
npm i
npm run dev
```
## Technology Stack
- Backend: express.js
- Frontend: Vite + React

## How to Run

### Server Setup
```bash
cd server
npm i
npm run dev
```
### Client Setup
```
cd client
npm i
npm run dev
```
## Features
- User registration and authentication
- Account balance management
- Deposit and withdrawal functionality
- Contact support system
- Responsive web interface

## Development Environment
- Node.js
- SQLite database
- React with Ant Design UI components
- JWT for authentication


## Project Structure
266_Bank/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── server/
    ├── index.js
    └── package.json

## Security Features
### Input Validation
- Username and password format validation
- Amount format and range validation
- Transaction validation

### Authentication and Authorization
- JWT-based token authentication
- Password encryption storage
- API endpoint protection

## System Architecture
### Frontend Architecture
- Component-based React architecture
- State management using React Hooks
- Responsive design supporting multiple devices

### Backend Architecture
- RESTful API design
- Middleware authentication
- SQLite data persistence

## API Endpoints
### Authentication
- POST /register - User registration
- POST /login - User login

### Account Operations
- GET /balance - Balance inquiry
- POST /deposit - Deposit operation
- POST /withdraw - Withdrawal operation