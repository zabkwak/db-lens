CREATE TABLE users (
	id VARCHAR(10) PRIMARY KEY,
	username VARCHAR(50) UNIQUE NOT NULL,
	email VARCHAR(255) UNIQUE NOT NULL,
	balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
	balance_cents INT NOT NULL DEFAULT 0,
	deleted BOOLEAN NOT NULL DEFAULT FALSE,
	created_timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO users (id, username, email)
VALUES ('user-1', 'krha', 'krha@example.com'),
	('user-2', 'sheep', 'sheep@example.com'),
	('user-3', 'painter', 'painter@example.com'),
	(
		'user-4',
		'sloth-with-weird-worldview',
		'sloth-with-weird-worldview@example.com'
	),
	(
		'user-5',
		'draculas-cousin',
		'draculas-cousin@example.com'
	);

CREATE TABLE commands (
	id VARCHAR(10) PRIMARY KEY,
	user_id VARCHAR(10) NOT NULL,
	command TEXT NOT NULL,
	created_timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);