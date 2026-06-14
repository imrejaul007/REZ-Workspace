import { logger } from '../../shared/logger';
/**
 * Health Memory Platform - Database Schema
 *
 * PostgreSQL schema for health memory storage
 * Following RTNM Doctrine: Identity → Memory → Knowledge → Twin → Agent → Intelligence
 */

import { Pool } from 'pg';
import { config } from '../config.js';

// Database connection pool
export const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Schema initialization
export const initializeDatabase = async (): Promise<void> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Enable UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // ============================================
    // CORE TABLES
    // ============================================

    // Persons (Users)
    await client.query(`
      CREATE TABLE IF NOT EXISTS persons (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        corp_id VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        date_of_birth DATE,
        gender VARCHAR(20),
        blood_type VARCHAR(10),
        height_cm DECIMAL(5,2),
        weight_kg DECIMAL(5,2),
        allergies JSONB DEFAULT '[]',
        emergency_contact JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(corp_id)
      )
    `);

    // Family Members
    await client.query(`
      CREATE TABLE IF NOT EXISTS family_members (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100),
        relationship VARCHAR(50) NOT NULL,
        date_of_birth DATE,
        gender VARCHAR(20),
        health_context VARCHAR(20) DEFAULT 'general',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Medical Reports
    await client.query(`
      CREATE TABLE IF NOT EXISTS medical_reports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        report_date DATE NOT NULL,
        facility VARCHAR(255),
        doctor_name VARCHAR(255),
        specialty VARCHAR(100),
        summary TEXT,
        findings JSONB DEFAULT '[]',
        attachments JSONB DEFAULT '[]',
        extracted_text TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Medications
    await client.query(`
      CREATE TABLE IF NOT EXISTS medications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        generic_name VARCHAR(255),
        dosage VARCHAR(100),
        frequency VARCHAR(100),
        route VARCHAR(50) DEFAULT 'oral',
        start_date DATE NOT NULL,
        end_date DATE,
        prescribed_by VARCHAR(255),
        purpose TEXT,
        side_effects JSONB DEFAULT '[]',
        interactions JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT TRUE,
        reminders JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Symptoms
    await client.query(`
      CREATE TABLE IF NOT EXISTS symptoms (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        severity VARCHAR(20) DEFAULT 'mild',
        body_area VARCHAR(100),
        description TEXT,
        started_at TIMESTAMPTZ NOT NULL,
        ended_at TIMESTAMPTZ,
        duration INTEGER,
        triggers JSONB DEFAULT '[]',
        remedies JSONB DEFAULT '[]',
        related_conditions JSONB DEFAULT '[]',
        notes TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Conditions/Diagnoses
    await client.query(`
      CREATE TABLE IF NOT EXISTS conditions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        icd_code VARCHAR(20),
        category VARCHAR(100),
        severity VARCHAR(20) DEFAULT 'mild',
        diagnosed_date DATE NOT NULL,
        resolved_date DATE,
        status VARCHAR(30) DEFAULT 'active',
        diagnosed_by VARCHAR(255),
        facility VARCHAR(255),
        notes TEXT,
        medications JSONB DEFAULT '[]',
        related_symptoms JSONB DEFAULT '[]',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Appointments
    await client.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
        doctor_name VARCHAR(255) NOT NULL,
        specialty VARCHAR(100),
        facility VARCHAR(255),
        address TEXT,
        appointment_date TIMESTAMPTZ NOT NULL,
        duration INTEGER,
        type VARCHAR(50) DEFAULT 'checkup',
        status VARCHAR(30) DEFAULT 'scheduled',
        notes TEXT,
        follow_up JSONB,
        cost DECIMAL(10,2),
        insurance_claimed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Doctors/Healthcare Providers
    await client.query(`
      CREATE TABLE IF NOT EXISTS doctors (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        specialty VARCHAR(100) NOT NULL,
        qualifications JSONB DEFAULT '[]',
        facility VARCHAR(255),
        address TEXT,
        phone VARCHAR(50),
        email VARCHAR(255),
        languages JSONB DEFAULT '[]',
        rating DECIMAL(3,2),
        availability VARCHAR(30) DEFAULT 'available',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Facilities
    await client.query(`
      CREATE TABLE IF NOT EXISTS facilities (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        address TEXT NOT NULL,
        phone VARCHAR(50),
        emergency_services BOOLEAN DEFAULT FALSE,
        specialties JSONB DEFAULT '[]',
        hours JSONB,
        rating DECIMAL(3,2),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Allergies
    await client.query(`
      CREATE TABLE IF NOT EXISTS allergies (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
        allergen VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        severity VARCHAR(30) NOT NULL,
        reactions JSONB DEFAULT '[]',
        diagnosed_date DATE,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Vaccinations
    await client.query(`
      CREATE TABLE IF NOT EXISTS vaccinations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
        vaccine VARCHAR(255) NOT NULL,
        vaccine_code VARCHAR(50),
        dose_number INTEGER NOT NULL,
        total_doses INTEGER NOT NULL,
        date_administered DATE NOT NULL,
        facility VARCHAR(255),
        administered_by VARCHAR(255),
        next_dose_date DATE,
        side_effects JSONB DEFAULT '[]',
        batch_number VARCHAR(100),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Procedures/Surgeries
    await client.query(`
      CREATE TABLE IF NOT EXISTS procedures (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        procedure_code VARCHAR(20),
        type VARCHAR(50) DEFAULT 'surgery',
        scheduled_date TIMESTAMPTZ NOT NULL,
        performed_date TIMESTAMPTZ,
        facility VARCHAR(255) NOT NULL,
        surgeon VARCHAR(255),
        anesthesiologist VARCHAR(255),
        outcome VARCHAR(50),
        notes TEXT,
        recovery_notes TEXT,
        follow_up_required BOOLEAN DEFAULT FALSE,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ============================================
    // WOMEN'S HEALTH TABLES
    // ============================================

    // Menstrual Cycles
    await client.query(`
      CREATE TABLE IF NOT EXISTS menstrual_cycles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
        start_date DATE NOT NULL,
        end_date DATE,
        duration INTEGER,
        flow_intensity VARCHAR(20),
        symptoms JSONB DEFAULT '[]',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Pregnancies
    await client.query(`
      CREATE TABLE IF NOT EXISTS pregnancies (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
        conception_date DATE,
        due_date DATE NOT NULL,
        status VARCHAR(50) NOT NULL,
        trimester INTEGER,
        outcomes JSONB,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Fertility Windows
    await client.query(`
      CREATE TABLE IF NOT EXISTS fertility_windows (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
        cycle_start_date DATE NOT NULL,
        fertile_window_start DATE NOT NULL,
        fertile_window_end DATE NOT NULL,
        ovulation_date DATE,
        conception_probability DECIMAL(5,2),
        method VARCHAR(50) DEFAULT 'calendar',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ============================================
    // LIFE EVENTS
    // ============================================

    await client.query(`
      CREATE TABLE IF NOT EXISTS life_events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
        event_type VARCHAR(50) NOT NULL,
        event_date DATE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        impact JSONB,
        related_entities JSONB DEFAULT '{}',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ============================================
    // CARE NETWORK
    // ============================================

    // Care Relationships (separate table since caregivers may not be users)
    await client.query(`
      CREATE TABLE IF NOT EXISTS caregivers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        relationship VARCHAR(100),
        availability VARCHAR(50) DEFAULT 'available',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS care_relationships (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
        caregiver_id UUID NOT NULL REFERENCES caregivers(id) ON DELETE CASCADE,
        relationship_type VARCHAR(50) NOT NULL,
        access_level VARCHAR(30) DEFAULT 'partial',
        permissions JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT TRUE,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ============================================
    // HEALTH INSURANCE
    // ============================================

    await client.query(`
      CREATE TABLE IF NOT EXISTS health_insurance (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
        provider VARCHAR(255) NOT NULL,
        policy_number VARCHAR(100) NOT NULL,
        plan_type VARCHAR(50) NOT NULL,
        coverage_start DATE NOT NULL,
        coverage_end DATE,
        monthly_premium DECIMAL(10,2),
        deductible DECIMAL(10,2),
        copay DECIMAL(10,2),
        covered_services JSONB DEFAULT '[]',
        exclusions JSONB DEFAULT '[]',
        status VARCHAR(30) DEFAULT 'active',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ============================================
    // INDEXES
    // ============================================

    // Person indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_persons_corp_id ON persons(corp_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_persons_created_at ON persons(created_at)');

    // Medical reports indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_reports_person_id ON medical_reports(person_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_reports_type ON medical_reports(type)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_reports_date ON medical_reports(report_date DESC)');

    // Medications indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_medications_person_id ON medications(person_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_medications_active ON medications(person_id, is_active)');

    // Symptoms indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_symptoms_person_id ON symptoms(person_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_symptoms_started_at ON symptoms(started_at DESC)');

    // Conditions indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_conditions_person_id ON conditions(person_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_conditions_status ON conditions(person_id, status)');

    // Appointments indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_appointments_person_id ON appointments(person_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date DESC)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_appointments_upcoming ON appointments(person_id, appointment_date) WHERE status = \'scheduled\'');

    // Women's health indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_menstrual_person_id ON menstrual_cycles(person_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_menstrual_start_date ON menstrual_cycles(start_date DESC)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_pregnancies_person_id ON pregnancies(person_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_fertility_person_id ON fertility_windows(person_id)');

    // Life events indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_life_events_person_id ON life_events(person_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_life_events_type ON life_events(event_type)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_life_events_date ON life_events(event_date DESC)');

    // ============================================
    // UPDATED_AT TRIGGER
    // ============================================

    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    // Apply trigger to all tables
    const tables = [
      'persons', 'family_members', 'medical_reports', 'medications',
      'symptoms', 'conditions', 'appointments', 'doctors', 'facilities',
      'allergies', 'vaccinations', 'procedures', 'menstrual_cycles',
      'pregnancies', 'fertility_windows', 'life_events', 'caregivers',
      'care_relationships', 'health_insurance'
    ];

    for (const table of tables) {
      await client.query(`
        DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};
        CREATE TRIGGER update_${table}_updated_at
        BEFORE UPDATE ON ${table}
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
      `);
    }

    await client.query('COMMIT');
    logger.info('✅ Health Memory Database initialized successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('❌ Failed to initialize database:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Export pool query helper
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (config.database.logQueries) {
    logger.info('Query executed', { text: text.substring(0, 100), duration, rows: result.rowCount });
  }
  return result;
};