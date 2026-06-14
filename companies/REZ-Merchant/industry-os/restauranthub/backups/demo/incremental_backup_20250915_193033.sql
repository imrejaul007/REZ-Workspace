PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE demo_restaurants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO demo_restaurants VALUES('rest-001','Demo Pizza Palace','pizza@demo.com','555-0101','123 Main St','Demo City','DC','2025-09-15 14:00:33');
INSERT INTO demo_restaurants VALUES('rest-002','Demo Burger Joint','burger@demo.com','555-0102','456 Oak Ave','Demo City','DC','2025-09-15 14:00:33');
INSERT INTO demo_restaurants VALUES('rest-003','Demo Sushi Bar','sushi@demo.com','555-0103','789 Pine Rd','Demo City','DC','2025-09-15 14:00:33');
INSERT INTO demo_restaurants VALUES('rest-004','Demo Cafe','cafe@demo.com','555-0104','321 Elm St','Demo City','DC','2025-09-15 14:00:33');
CREATE TABLE demo_users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT DEFAULT 'CUSTOMER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO demo_users VALUES('user-001','admin@demo.com','Demo','Admin','ADMIN','2025-09-15 14:00:33');
INSERT INTO demo_users VALUES('user-002','manager@demo.com','Demo','Manager','RESTAURANT_OWNER','2025-09-15 14:00:33');
INSERT INTO demo_users VALUES('user-003','customer@demo.com','Demo','Customer','CUSTOMER','2025-09-15 14:00:33');
CREATE TABLE demo_jobs (
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
INSERT INTO demo_jobs VALUES('job-001','Pizza Chef','Experienced pizza chef needed','rest-001',35000,45000,1,'2025-09-15 14:00:33');
INSERT INTO demo_jobs VALUES('job-002','Server','Friendly server for busy restaurant','rest-001',25000,30000,1,'2025-09-15 14:00:33');
INSERT INTO demo_jobs VALUES('job-003','Kitchen Manager','Lead our kitchen team','rest-002',40000,50000,1,'2025-09-15 14:00:33');
INSERT INTO demo_jobs VALUES('job-004','Sushi Chef','Master sushi chef position','rest-003',50000,65000,1,'2025-09-15 14:00:33');
INSERT INTO demo_jobs VALUES('job-005','Barista','Coffee specialist needed','rest-004',28000,35000,1,'2025-09-15 14:00:33');
COMMIT;
