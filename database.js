const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');
const fs = require('fs'); // Import the 'fs' module

// Determine the database file path
const dbPath = app.isPackaged
  ? path.join(app.getPath('userData'), 'library.db') // For packaged app
  : path.resolve(__dirname, 'library.db'); // For development

// Check if the database file exists
if (!fs.existsSync(dbPath)) {
  console.log('Database file not found. Creating a new empty database...');
  fs.writeFileSync(dbPath, ''); // Create an empty file
}

// Open the database (it will create the database file if it doesn't exist)
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// SQL script to create tables and add necessary schema changes
const createTablesSQL = `
-- USER TABLE
CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    hint TEXT,
    security_question TEXT,
    security_answer TEXT
);

-- Insert sample user into the 'user' table
INSERT OR IGNORE INTO user (username, password) VALUES ('admin', 'password');

-- BOOKS TABLE
CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number INTEGER,
    date_received DATE,
    class VARCHAR(255),
    author VARCHAR(255),
    title_of_book VARCHAR(255),
    edition VARCHAR(50),
    source_of_fund VARCHAR(255),
    cost_price DECIMAL(10,2),
    publisher VARCHAR(255),
    year INTEGER,
    remarks TEXT,
    createdAt DATETIME,
    volume INTEGER,
    pages INTEGER,
    condition TEXT,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Trigger to auto-increment the 'number' field sequentially
CREATE TRIGGER IF NOT EXISTS increment_number_trigger
AFTER INSERT ON books
BEGIN
    UPDATE books
    SET number = (SELECT COALESCE(MAX(number), 0) + 1 FROM books)
    WHERE id = NEW.id;
END;

-- Trigger to reorder 'number' sequentially after a row is deleted
CREATE TRIGGER IF NOT EXISTS reorder_increment_number_trigger
AFTER DELETE ON books
BEGIN
    UPDATE books
    SET number = (
        SELECT COUNT(*) FROM books u WHERE u.id <= books.id
    )
    WHERE id IN (SELECT id FROM books);
END;

-- BORROW TABLE
CREATE TABLE IF NOT EXISTS borrow (
    id INTEGER PRIMARY KEY,
    borrower_id INTEGER,
    book_id INTEGER,
    borrowDate TEXT,
    borrowStatus TEXT,
    createdAt TEXT,
    returnDate DATE,
    dueDate DATE,
    FOREIGN KEY (borrower_id) REFERENCES Profiles(borrower_id),
    FOREIGN KEY (book_id) REFERENCES books(id)
);

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS Profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    borrower_id INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    phone_number TEXT,
    email TEXT,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- If the database is already populated, it can be used as intended without any issues.
`;

// Execute the SQL script to create tables and triggers
db.exec(createTablesSQL, (err) => {
  if (err) {
    console.error('Error executing SQL script:', err.message);
  } else {
    console.log('Tables created and schema altered successfully.');
  }
});

module.exports = db;
