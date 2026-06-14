-- Demo Database Schema for Backup Testing
CREATE TABLE IF NOT EXISTS demo_restaurants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS demo_users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT DEFAULT 'CUSTOMER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS demo_jobs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    restaurant_id TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES demo_restaurants(id)
);

-- Insert sample data
INSERT OR IGNORE INTO demo_restaurants (id, name, email, phone, address, city, state) VALUES
('rest-001', 'Demo Pizza Palace', 'pizza@demo.com', '555-0101', '123 Main St', 'Demo City', 'DC'),
('rest-002', 'Demo Burger Joint', 'burger@demo.com', '555-0102', '456 Oak Ave', 'Demo City', 'DC'),
('rest-003', 'Demo Sushi Bar', 'sushi@demo.com', '555-0103', '789 Pine Rd', 'Demo City', 'DC');

INSERT OR IGNORE INTO demo_users (id, email, first_name, last_name, role) VALUES
('user-001', 'admin@demo.com', 'Demo', 'Admin', 'ADMIN'),
('user-002', 'manager@demo.com', 'Demo', 'Manager', 'RESTAURANT_OWNER'),
('user-003', 'customer@demo.com', 'Demo', 'Customer', 'CUSTOMER');

INSERT OR IGNORE INTO demo_jobs (id, title, description, restaurant_id, salary_min, salary_max) VALUES
('job-001', 'Pizza Chef', 'Experienced pizza chef needed', 'rest-001', 35000, 45000),
('job-002', 'Server', 'Friendly server for busy restaurant', 'rest-001', 25000, 30000),
('job-003', 'Kitchen Manager', 'Lead our kitchen team', 'rest-002', 40000, 50000),
('job-004', 'Sushi Chef', 'Master sushi chef position', 'rest-003', 50000, 65000);
