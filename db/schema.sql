-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
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
  amount REAL NOT NULL,
  type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
  category_id TEXT NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD format
  description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(category_id) REFERENCES categories(id)
);

-- Insert Default Categories
INSERT OR IGNORE INTO categories (id, name, icon, color, type) VALUES
('c-1', 'Groceries', 'local_grocery_store', '#ff9100', 'expense'),
('c-2', 'Rent & Living', 'home', '#2979ff', 'expense'),
('c-3', 'Transport', 'directions_car', '#00e5ff', 'expense'),
('c-4', 'Salary', 'payments', '#00e676', 'income'),
('c-5', 'Freelance & Business', 'corporate_fare', '#d500f9', 'income'),
('c-6', 'Leisure & Fun', 'sports_esports', '#ff1744', 'expense');
