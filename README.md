# MTN MOMO Transaction Analysis Dashboard

## A demo Could be found here https://docs.google.com/document/d/1HulsndytyGFYcnQb3DB3Z9KHJNaDmE6Bujju2D4Ux3Y/edit?usp=sharing

A web application for analyzing MTN Mobile Money (MOMO) transactions. Built with Express.js backend and vanilla JavaScript frontend.

## Features

- Transaction filtering by type, date range, and amount
- Interactive charts showing monthly trends and transaction type distribution
- Detailed transaction view with counterparty information
- PDF export functionality for every reports
- Responsive design with MTN MoMo brand colors
- Real-time data updates

## Project Structure

```
MOMO_data_analysis/
├── backend/
│   ├── data/               # Data files (XML transaction data)
│   ├── logs/              # Application logs
│   ├── src/               # Source files
│   │   └── dataProcessor.mjs
│   ├── utils/             # Utility scripts
│   │   ├── importData.mjs
│   │   └── verifyData.mjs
│   ├── server.mjs         # Main server file
│   ├── schema.sql         # Database schema
│   └── package.json
│
└── frontend/
    ├── assets/            # Images and static assets
    │   ├── mtn-momo-logo.webp
    │   └── momo-favicon.png
    ├── css/
    │   └── styles.css
    ├── js/
    │   ├── api.js         # API client
    │   ├── app.js         # Main application logic
    │   ├── charts.js      # Chart configurations
    │   └── transactions.js # Transaction management
    └── index.html
```

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher) or a Neon.tech account
- Git

## Setup Instructions

### 1. Database Setup

You can either use a local PostgreSQL database or set up a free cloud database with Neon.tech:

#### Option A: Neon.tech Cloud Database (Recommended)

1. Create a free PostgreSQL database on [Neon.tech](https://neon.tech):
   - Sign up for a Neon account
   - Create a new project
   - Create a new database named `momo-analysis`
   - Get your database connection string from the dashboard

2. Your connection string will look similar to:
   ```
   postgresql://user:password@ep-xxxxx-pooler.region.aws.neon.tech/dbname?sslmode=require
   ```

#### Option B: Local PostgreSQL Database

1. Install PostgreSQL on your machine
2. Create a new database:
   ```bash
   createdb momo_db
   ```
3. Your connection string will be:
   ```
   postgresql://username:password@localhost:5432/momo_db
   ```

### 2. Application Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/DphenomenalALU/MOMO_data_analysis.git
   cd MOMO_data_analysis
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Create a `.env` file in the backend directory:
   ```env
   # Database Configuration
   DATABASE_URL='your-database-connection-string'
   
   # Node Environment
   NODE_ENV=development
   ```
   Replace 'your-database-connection-string' with either your Neon.tech connection string or local PostgreSQL connection string.

4. Set Up Schema : manually using Schema.sql or run the script

 ```
   cd backend/utils
   node setupDp.mjs 
 ```   

6. Import initial data:
   ```bash
   npm run import-data
   ```

7. Verify data import:
   ```bash
   npm run verify-data
   ```

### 3. Starting the Application

1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

2. Access the application:
   - Open `http://localhost:3000` in your browser
   - The frontend will be served automatically by the backend

## API Endpoints

- `GET /api/transactions` - List transactions with filters
  - Query params: type, date_from, date_to, min_amount, max_amount

- `GET /api/transactions/:id` - Get transaction details

- `GET /api/stats/summary` - Get transaction statistics
  - Returns: total_transactions, total_volume, avg_amount, min_amount, max_amount

- `GET /api/stats/monthly` - Get monthly statistics
  - Returns: transaction_count, total_amount, avg_amount by month

- `GET /api/transactions/types` - Get available transaction types

## Data Range

The application contains transaction data from May 10, 2024, to January 16, 2025. The date filters in the UI are automatically restricted to this range.

## Transaction Types

- INCOMING_MONEY - Received money transfers
- PAYMENT_TO_CODE - Payments to code holders
- TRANSFER_TO_MOBILE - Transfers to mobile numbers
- BANK_DEPOSIT - Bank deposits
- AIRTIME_PAYMENT - Airtime purchases
- CASH_POWER - Electricity bill payments
- THIRD_PARTY - Third-party initiated transactions
- WITHDRAWAL - Cash withdrawals from agents
- BANK_TRANSFER - Bank transfers
- INTERNET_BUNDLE - Internet and voice bundle purchases

## Styling

The application uses MTN MoMo's brand colors:
- Primary Blue: #004f71
- Secondary Yellow: #ffcc00

## Error Handling

The application includes:
- Retry mechanism for loading transaction types
- User-friendly error messages
- Loading states for all operations
- Proper error logging

## Development

To verify data integrity:
```bash
cd backend
npm run verify-data    # Verify data integrity
```

## Logs

Application logs are stored in:
- `backend/logs/unprocessed.log` - Transaction processing logs
- `backend/logs/processing-stats.json` - Data import statistics
