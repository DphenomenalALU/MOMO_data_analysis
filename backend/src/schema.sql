-- Drop existing tables if they exist
DROP TABLE IF EXISTS transactions CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;

-- Create transaction type enum
CREATE TYPE transaction_type AS ENUM (
  'INCOMING_MONEY',
  'PAYMENT_TO_CODE',
  'TRANSFER_TO_MOBILE',
  'BANK_DEPOSIT',
  'AIRTIME_PAYMENT',
  'CASH_POWER',
  'THIRD_PARTY',
  'WITHDRAWAL',
  'BANK_TRANSFER',
  'INTERNET_BUNDLE',
  'UNKNOWN'
);

-- Create transactions table
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  type transaction_type NOT NULL DEFAULT 'UNKNOWN',
  amount BIGINT NOT NULL,
  date TIMESTAMP NOT NULL,
  body TEXT NOT NULL,
  address TEXT,
  protocol TEXT,
  service_center TEXT,
  counterparty_number TEXT,
  counterparty_name TEXT,
  transaction_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_amount ON transactions(amount);
CREATE INDEX idx_transactions_counterparty_number ON transactions(counterparty_number);

-- Create view for transaction statistics
CREATE OR REPLACE VIEW transaction_stats AS
SELECT 
  type,
  COUNT(*) as total_count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount,
  MIN(amount) as min_amount,
  MAX(amount) as max_amount,
  MIN(date) as first_transaction,
  MAX(date) as last_transaction
FROM transactions
GROUP BY type
ORDER BY total_count DESC; 