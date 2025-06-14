# MTN MoMo Transaction Analysis Dashboard

## Environment Setup

1. Create a `.env` file in the root directory with the following content:
```
# API Configuration
API_URL=http://localhost:3000/api

# Environment
NODE_ENV=development
```

2. Update the `API_URL` to match your backend server URL
3. Set `NODE_ENV` to 'production' for production deployment

## API Integration

The dashboard integrates with the following API endpoints:

- `GET /api/transactions` - Fetch transactions with filtering and pagination
- `GET /api/stats` - Get transaction statistics
- `GET /api/trends/monthly` - Get monthly transaction trends
- `GET /api/transactions/export` - Export transactions to CSV

### API Parameters

#### Transactions Endpoint
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `startDate` - Start date filter (ISO format)
- `endDate` - End date filter (ISO format)
- `transactionType` - Filter by transaction type
- `sortBy` - Sort field (default: 'date')
- `sortOrder` - Sort order ('asc' or 'desc')

#### Stats Endpoint
- `startDate` - Start date filter
- `endDate` - End date filter
- `transactionType` - Filter by transaction type

#### Monthly Trends Endpoint
- `year` - Filter by year
- `transactionType` - Filter by transaction type

## Features

- Real-time data updates
- Advanced filtering options
- Pagination support
- CSV export functionality
- Error handling and loading states
- Responsive design
- Interactive charts with Chart.js

## Development

1. Clone the repository
2. Set up environment variables
3. Install dependencies
4. Start the development server

## Production Deployment

1. Update `.env` with production API URL
2. Set NODE_ENV to 'production'
3. Build and deploy to any hosting platform