CREATE TABLE sms_info (
	id SERIAL PRIMARY KEY,
	protocol TEXT,
	address TEXT,
	typ TEXT,
	body TEXT,
	service_centre TEXT,
	Date TEXT
);
