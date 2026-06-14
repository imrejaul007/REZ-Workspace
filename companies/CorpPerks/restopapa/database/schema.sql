-- Restaurant Industry SaaS Platform Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Types Enum
CREATE TYPE user_role AS ENUM ('restaurant', 'employee', 'vendor', 'admin');
CREATE TYPE restaurant_category AS ENUM ('fine_dining', 'qsr', 'cafe', 'cloud_kitchen', 'casual_dining', 'fast_casual');
CREATE TYPE employee_tag AS ENUM ('thief', 'misbehavior', 'skill_issue', 'reliable', 'star_employee');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected', 'expired');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled', 'expired');
CREATE TYPE job_status AS ENUM ('open', 'closed', 'filled');
CREATE TYPE application_status AS ENUM ('pending', 'shortlisted', 'rejected', 'hired');

-- Core Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Restaurants Table
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    category restaurant_category NOT NULL,
    gst_number VARCHAR(15),
    fssai_license VARCHAR(20),
    revenue_range VARCHAR(50),
    total_employees INTEGER DEFAULT 0,
    website_url VARCHAR(255),
    description TEXT,
    logo_url VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    trust_score INTEGER DEFAULT 50, -- 0-100 scale
    subscription_plan VARCHAR(50) DEFAULT 'free',
    subscription_status subscription_status DEFAULT 'inactive',
    subscription_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Restaurant Addresses Table
CREATE TABLE restaurant_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    is_primary BOOLEAN DEFAULT FALSE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employees Table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    aadhaar_number VARCHAR(12) UNIQUE, -- Encrypted
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    marital_status VARCHAR(20),
    total_experience_months INTEGER DEFAULT 0,
    education TEXT,
    certifications TEXT,
    skills TEXT[],
    profile_picture_url VARCHAR(255),
    resume_url VARCHAR(255),
    aadhaar_verification_status verification_status DEFAULT 'pending',
    reliability_score INTEGER DEFAULT 50, -- 0-100 scale
    is_profile_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employee Addresses Table
CREATE TABLE employee_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    address_type VARCHAR(20) NOT NULL, -- 'permanent' or 'current'
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employment History Table
CREATE TABLE employment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    position VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    joining_date DATE NOT NULL,
    leaving_date DATE,
    salary_range VARCHAR(50),
    is_current BOOLEAN DEFAULT FALSE,
    leaving_reason VARCHAR(255),
    is_verified_by_employer BOOLEAN DEFAULT FALSE,
    is_verified_by_employee BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employee Tags & Reviews Table
CREATE TABLE employee_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    employment_history_id UUID REFERENCES employment_history(id) ON DELETE CASCADE,
    tag employee_tag NOT NULL,
    comment TEXT,
    is_disputed BOOLEAN DEFAULT FALSE,
    employee_reply TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendors Table
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'raw_materials', 'equipment', 'pos', 'delivery', etc.
    gst_number VARCHAR(15),
    description TEXT,
    website_url VARCHAR(255),
    logo_url VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    trust_score INTEGER DEFAULT 50, -- 0-100 scale
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendor Addresses Table
CREATE TABLE vendor_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendor Products/Services Table
CREATE TABLE vendor_offerings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    price_range VARCHAR(50),
    images TEXT[],
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendor Reviews Table
CREATE TABLE vendor_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Jobs Table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    position VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    employment_type VARCHAR(50) NOT NULL, -- 'full_time', 'part_time', 'contract'
    salary_min INTEGER,
    salary_max INTEGER,
    experience_min INTEGER DEFAULT 0,
    experience_max INTEGER,
    location VARCHAR(255) NOT NULL,
    requirements TEXT[],
    benefits TEXT[],
    status job_status DEFAULT 'open',
    is_premium BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Job Applications Table
CREATE TABLE job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    cover_letter TEXT,
    status application_status DEFAULT 'pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(job_id, employee_id)
);

-- Community Discussions Table
CREATE TABLE discussions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'staff_shortage', 'vendor_inquiry', 'business_offer', etc.
    is_premium BOOLEAN DEFAULT FALSE,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Discussion Comments Table
CREATE TABLE discussion_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES discussion_comments(id) ON DELETE CASCADE,
    likes_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Discussion Likes Table
CREATE TABLE discussion_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES discussion_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(discussion_id, user_id),
    UNIQUE(comment_id, user_id),
    CHECK ((discussion_id IS NOT NULL) != (comment_id IS NOT NULL)) -- XOR constraint
);

-- Direct Messages Table
CREATE TABLE direct_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents Table (for verification uploads)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- 'gst', 'fssai', 'aadhaar', 'resume', etc.
    file_url VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    verification_status verification_status DEFAULT 'pending',
    verified_at TIMESTAMP,
    verified_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fraud Reports Table
CREATE TABLE fraud_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL, -- 'fraud', 'fake_profile', 'misconduct'
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'investigating', 'resolved', 'dismissed'
    resolution TEXT,
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blacklist Table
CREATE TABLE blacklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blacklisted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscription Plans Table
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    price INTEGER NOT NULL, -- in paise (INR)
    duration_days INTEGER NOT NULL,
    features JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments Table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_plan_id UUID REFERENCES subscription_plans(id),
    amount INTEGER NOT NULL, -- in paise (INR)
    currency VARCHAR(3) DEFAULT 'INR',
    payment_gateway VARCHAR(50) NOT NULL, -- 'razorpay', 'stripe'
    gateway_payment_id VARCHAR(255),
    gateway_order_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    payment_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'job_application', 'verification', 'payment', etc.
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics Table
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_restaurants_user_id ON restaurants(user_id);
CREATE INDEX idx_restaurants_category ON restaurants(category);
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_aadhaar ON employees(aadhaar_number);
CREATE INDEX idx_employment_history_employee ON employment_history(employee_id);
CREATE INDEX idx_employment_history_restaurant ON employment_history(restaurant_id);
CREATE INDEX idx_jobs_restaurant_id ON jobs(restaurant_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX idx_job_applications_employee_id ON job_applications(employee_id);
CREATE INDEX idx_vendors_user_id ON vendors(user_id);
CREATE INDEX idx_vendor_offerings_vendor_id ON vendor_offerings(vendor_id);
CREATE INDEX idx_discussions_user_id ON discussions(user_id);
CREATE INDEX idx_discussions_created_at ON discussions(created_at DESC);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employment_history_updated_at BEFORE UPDATE ON employment_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON job_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample Data for Subscription Plans
INSERT INTO subscription_plans (name, price, duration_days, features) VALUES 
('Free', 0, 365, '{"job_posts": 1, "employee_verifications": 0, "analytics": false, "fraud_alerts": false}'),
('Basic', 99900, 30, '{"job_posts": 10, "employee_verifications": 5, "analytics": true, "fraud_alerts": true}'),
('Professional', 299900, 30, '{"job_posts": 50, "employee_verifications": 25, "analytics": true, "fraud_alerts": true, "premium_support": true}'),
('Enterprise', 499900, 30, '{"job_posts": -1, "employee_verifications": -1, "analytics": true, "fraud_alerts": true, "premium_support": true, "custom_features": true}');