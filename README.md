# MTN MOMO Analysis Dashboard

A full-stack web application for analyzing MTN Mobile Money transactions, built with Express.js backend and vanilla JavaScript frontend.

## Project Structure

```
├── backend/
│   ├── server.mjs          # Main Express server
│   ├── schema.sql          # Database schema
│   ├── utils/              # Utility scripts
│   │   ├── setupDb.mjs     # Database setup
│   │   ├── importData.mjs  # Data import
│   │   ├── verifyData.mjs  # Data verification
│   │   └── testDb.mjs      # Database testing
│   └── package.json        # Backend dependencies
└── frontend/
    ├── index.html          # Main HTML
    ├── css/
    │   └── styles.css      # Styles with MTN MoMo theme
    └── js/
        ├── app.js          # Main application logic
        ├── api.js          # API integration
        ├── charts.js       # Chart.js visualizations
        └── transactions.js # Transaction management
```

## Setup Instructions

### 1. Database Setup

1. Create a free PostgreSQL database on [Neon.tech](https://neon.tech):
   - Sign up for a Neon account
   - Create a new project
   - Create a new database named `momo-analysis`
   - Get your database connection string from the dashboard

2. Note your connection string, it will look similar to:
   ```
   postgresql://user:password@ep-xxxxx-pooler.region.aws.neon.tech/dbname?sslmode=require
   ```

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following content:
   ```
   # Database Configuration
   DATABASE_URL='your-neon-database-connection-string'

   # Node Environment
   NODE_ENV=development
   ```
   Replace 'your-neon-database-connection-string' with your actual Neon.tech connection string.

4. Set up the database schema:
   ```bash
   npm run setup-db
   ```

5. Import initial data:
   ```bash
   npm run import-data
   ```

6. Verify data import:
   ```bash
   npm run verify-data
   ```

### 3. Start the Application

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

- INCOMING_MONEY
- PAYMENT_TO_CODE
- TRANSFER_TO_MOBILE
- BANK_DEPOSIT
- AIRTIME_PAYMENT
- CASH_POWER
- THIRD_PARTY
- WITHDRAWAL
- BANK_TRANSFER
- INTERNET_BUNDLE

## Styling

The application uses MTN MoMo's brand colors:
- Primary Blue: #004f71
- Secondary Yellow: #ffcc00

## Development

To run tests or utility scripts:
```bash
cd backend
npm run test-db        # Test database connection
npm run verify-data    # Verify data integrity
```
