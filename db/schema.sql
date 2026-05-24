-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  user_id TEXT, -- NULL for system-wide categories
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
  category_id TEXT NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD format
  description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(category_id) REFERENCES categories(id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Insert Default Categories
INSERT OR IGNORE INTO categories (id, user_id, name, icon, color, type) VALUES
('c-1', NULL, 'Groceries', 'local_grocery_store', '#ff9100', 'expense'),
('c-2', NULL, 'Rent & Living', 'home', '#2979ff', 'expense'),
('c-3', NULL, 'Transport', 'directions_car', '#00e5ff', 'expense'),
('c-4', NULL, 'Salary', 'payments', '#00e676', 'income'),
('c-5', NULL, 'Freelance & Business', 'corporate_fare', '#d500f9', 'income'),
('c-6', NULL, 'Leisure & Fun', 'sports_esports', '#ff1744', 'expense');
