# EvaExchange Trading API

A RESTful API for a simulated stock trading application built with Node.js, Express, Sequelize, and PostgreSQL.

## Features

- 🔐 JWT Authentication
- 👤 Role-based access control (user/admin)
- 📊 Buy/Sell Trading Operations
- 💼 Portfolio Management
- 🗄️ PostgreSQL Database
- 🔄 Sequelize ORM
- 🧪 Unit Testing with Jest
- 📬 Postman Collection

## Prerequisites

- Node.js (v14+)
- PostgreSQL
- npm or yarn

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/evaexchange.git
cd evaexchange
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:

```
# Database Configuration
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=evaexchange
DB_HOST=localhost
DB_PORT=5432
DB_DIALECT=postgres

# JWT Configuration
JWT_SECRET=evaexchange_super_secret_key
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3000
NODE_ENV=development
```

4. Create PostgreSQL database:

```bash
createdb evaexchange
```

## Running the Application

1. Seed the database with initial data:

```bash
npm run seed
```

2. Start the server:

```bash
npm start
```

3. For development with hot reloading:

```bash
npm run dev
```

## API Endpoints

### Authentication Routes

- **POST** `/auth/register` - Register a new user
- **POST** `/auth/login` - Login and get JWT token
- **DELETE** `/auth/unregister` - Delete user account and associated data

### Trade Routes (Protected)

- **POST** `/trade/portfolio` - Create a new portfolio with optional initial shares
- **PUT** `/trade/portfolio` - Update an existing portfolio (name and/or balance)
- **DELETE** `/trade/portfolio` - Delete user's portfolio with all shares and trade history
- **POST** `/trade/buy` - Buy shares
- **POST** `/trade/sell` - Sell shares
- **GET** `/trade/portfolio` - Get current user's portfolio shares
- **POST** `/trade/update-prices` - Update share prices (admin only)

## Testing

Run the automated tests:

```bash
npm test
```

## Postman Collection

Import the Postman collection from the `postman/evaexchange.postman_collection.json` file into your Postman application to test the API endpoints.

## Database Schema

### Models

- **User**: User accounts with authentication details and role (user/admin)
- **Portfolio**: User trading portfolios with balance
- **Share**: Available shares with current prices
- **PortfolioShare**: Tracks quantities of shares owned by portfolios
- **Trade**: Records of buy/sell transactions

## Trade Rules

### Portfolio:
- Each user must create a portfolio before trading
- Portfolios track the user's balance and owned shares
- Users can create portfolios with initial shares
- Users can update their portfolio name and adjust balance
- Users can delete their portfolio along with all shares and trade history

### BUY:
- Share must be registered
- Portfolio must exist
- Use latest share price from DB
- Updates portfolio balance and portfolio shares

### SELL:
- Portfolio must exist
- Enough shares must be available in portfolio
- Use latest share price from DB
- Updates portfolio balance and portfolio shares

### Price Update:
- Only admin users can update share prices
- Updates are processed in a transaction

### Account Management:
- Users can delete their account, which will also delete their portfolio data
- Account deletion is performed in a transaction to ensure data consistency
