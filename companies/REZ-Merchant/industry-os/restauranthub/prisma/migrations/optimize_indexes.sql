-- Database optimization and indexing for RestaurantHub

-- Users table optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_verified ON users("isVerified");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users("createdAt");

-- User profiles optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_user_id ON user_profiles("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_name ON user_profiles("firstName", "lastName");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);

-- Restaurants table optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurants_owner_id ON restaurants("ownerId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurants_name ON restaurants(name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurants_status ON restaurants(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurants_location ON restaurants(city, state);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurants_cuisine ON restaurants USING GIN(cuisine);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurants_rating ON restaurants(rating);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurants_created_at ON restaurants("createdAt");

-- Menu items optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_items_restaurant_id ON menu_items("restaurantId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_items_status ON menu_items(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_items_price ON menu_items(price);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_items_available ON menu_items("isAvailable");

-- Orders optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_id ON orders("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_restaurant_id ON orders("restaurantId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_created_at ON orders("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_updated_at ON orders("updatedAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_total ON orders(total);

-- Order items optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_order_id ON order_items("orderId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_menu_item_id ON order_items("menuItemId");

-- Reviews optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_restaurant_id ON reviews("restaurantId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_user_id ON reviews("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_created_at ON reviews("createdAt");

-- Jobs optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_restaurant_id ON jobs("restaurantId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_salary_range ON jobs("minSalary", "maxSalary");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_created_at ON jobs("createdAt");

-- Job applications optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_applications_job_id ON job_applications("jobId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_applications_user_id ON job_applications("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_applications_created_at ON job_applications("createdAt");

-- Sessions optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_id ON sessions("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_expires_at ON sessions("expiresAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_created_at ON sessions("createdAt");

-- Notifications optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id ON notifications("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_read ON notifications("isRead");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created_at ON notifications("createdAt");

-- Payments optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_order_id ON payments("orderId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_user_id ON payments("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_method ON payments(method);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_created_at ON payments("createdAt");

-- Vendor products optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_products_vendor_id ON vendor_products("vendorId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_products_category ON vendor_products(category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_products_status ON vendor_products(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_products_price ON vendor_products(price);

-- Inventory optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_restaurant_id ON inventory("restaurantId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_product_id ON inventory("productId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_quantity ON inventory(quantity);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_updated_at ON inventory("updatedAt");

-- Full-text search indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurants_search 
ON restaurants USING GIN(to_tsvector('english', name || ' ' || description || ' ' || COALESCE(cuisine::text, '')));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_items_search 
ON menu_items USING GIN(to_tsvector('english', name || ' ' || description));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_search 
ON jobs USING GIN(to_tsvector('english', title || ' ' || description || ' ' || requirements));

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_status_created 
ON orders("userId", status, "createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_items_restaurant_category_available 
ON menu_items("restaurantId", category, "isAvailable");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_restaurant_rating_created 
ON reviews("restaurantId", rating, "createdAt");

-- Partial indexes for efficiency
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_active 
ON orders("restaurantId", "createdAt") 
WHERE status IN ('pending', 'confirmed', 'preparing', 'ready');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_unread 
ON notifications("userId", "createdAt") 
WHERE "isRead" = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_active 
ON jobs("restaurantId", "createdAt") 
WHERE status = 'active';

-- ANALYZE tables to update statistics
ANALYZE users;
ANALYZE user_profiles;
ANALYZE restaurants;
ANALYZE menu_items;
ANALYZE orders;
ANALYZE order_items;
ANALYZE reviews;
ANALYZE jobs;
ANALYZE job_applications;
ANALYZE sessions;
ANALYZE notifications;
ANALYZE payments;
ANALYZE vendor_products;
ANALYZE inventory;

-- Add constraints and triggers for data integrity
-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updatedAt column
DO $$
DECLARE
    table_name TEXT;
    tables TEXT[] := ARRAY['users', 'user_profiles', 'restaurants', 'menu_items', 'orders', 'reviews', 'jobs', 'job_applications', 'payments', 'vendor_products', 'inventory'];
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%s_updated_at ON %s;
            CREATE TRIGGER update_%s_updated_at 
                BEFORE UPDATE ON %s 
                FOR EACH ROW 
                EXECUTE FUNCTION update_updated_at_column();
        ', table_name, table_name, table_name, table_name);
    END LOOP;
END
$$;