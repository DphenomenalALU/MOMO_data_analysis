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
	type transaction_type NOT NULL,
	amount BIGINT,
	counterparty TEXT,
	date TIMESTAMP NOT NULL,
	body TEXT NOT NULL,
	protocol TEXT,
	address TEXT,
	service_center TEXT,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	
	-- Add unique constraint to prevent duplicate messages
	UNIQUE(body, date)
);

-- Create indexes for common queries
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_amount ON transactions(amount);

-- Create view for transaction statistics
CREATE OR REPLACE VIEW transaction_stats AS
SELECT
	type,
	COUNT(*) as total_count,
	SUM(amount) as total_amount,
	AVG(amount)::BIGINT as avg_amount,
	MIN(date) as first_transaction,
	MAX(date) as last_transaction
FROM transactions
GROUP BY type;

-- Create view for monthly summaries
CREATE OR REPLACE VIEW monthly_summaries AS
SELECT
	DATE_TRUNC('month', date) as month,
	type,
	COUNT(*) as transaction_count,
	SUM(amount) as total_amount
FROM transactions
GROUP BY DATE_TRUNC('month', date), type
ORDER BY month DESC, type;

CREATE TABLE sms_info (
	id SERIAL PRIMARY KEY,
	protocol TEXT,
	address TEXT,
	typ TEXT,
	body TEXT,
	service_centre TEXT,
	Date TEXT
);
