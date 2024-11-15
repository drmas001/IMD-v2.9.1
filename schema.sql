-- Drop existing types if they exist
DROP TYPE IF EXISTS shift_type CASCADE;
DROP TYPE IF EXISTS safety_type CASCADE;
DROP TYPE IF EXISTS note_type CASCADE;

-- Create enum types
DO $$ 
BEGIN
    -- Create shift_type enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shift_type') THEN
        CREATE TYPE shift_type AS ENUM (
            'morning',
            'evening',
            'night',
            'weekend_morning',
            'weekend_night'
        );
    END IF;

    -- Create safety_type enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'safety_type') THEN
        CREATE TYPE safety_type AS ENUM (
            'emergency',
            'observation',
            'short-stay'
        );
    END IF;

    -- Create note_type enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'note_type') THEN
        CREATE TYPE note_type AS ENUM (
            'Progress Note',
            'Follow-up Note',
            'Consultation Note',
            'Discharge Note',
            'Discharge Summary'
        );
    END IF;
END $$;

-- Drop tables if they exist to start fresh
DROP TABLE IF EXISTS medical_notes CASCADE;
DROP TABLE IF EXISTS long_stay_notes CASCADE;
DROP TABLE IF EXISTS consultations CASCADE;
DROP TABLE IF EXISTS admissions CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table first since other tables reference it
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    medical_code VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('doctor', 'nurse', 'administrator')) NOT NULL,
    department VARCHAR(255) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive')) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create patients table
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    mrn VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create admissions table with explicit foreign key references
CREATE TABLE admissions (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL,
    admission_date TIMESTAMP WITH TIME ZONE NOT NULL,
    discharge_date TIMESTAMP WITH TIME ZONE,
    department VARCHAR(255) NOT NULL,
    admitting_doctor_id INTEGER,
    discharge_doctor_id INTEGER,
    diagnosis TEXT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('active', 'discharged', 'transferred')) NOT NULL,
    safety_type safety_type,
    shift_type shift_type NOT NULL DEFAULT 'morning',
    is_weekend BOOLEAN DEFAULT false,
    visit_number INTEGER NOT NULL DEFAULT 1,
    discharge_type VARCHAR(50) CHECK (discharge_type IN ('regular', 'against-medical-advice', 'transfer')),
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    discharge_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT admissions_patient_id_fkey FOREIGN KEY (patient_id) 
        REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT admissions_admitting_doctor_id_fkey FOREIGN KEY (admitting_doctor_id) 
        REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT admissions_discharge_doctor_id_fkey FOREIGN KEY (discharge_doctor_id) 
        REFERENCES users(id) ON DELETE SET NULL
);

-- Create medical_notes table with explicit foreign key references
CREATE TABLE medical_notes (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    note_type note_type NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT medical_notes_patient_id_fkey FOREIGN KEY (patient_id) 
        REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT medical_notes_doctor_id_fkey FOREIGN KEY (doctor_id) 
        REFERENCES users(id)
);

-- Create long_stay_notes table with explicit foreign key references
CREATE TABLE long_stay_notes (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT long_stay_notes_patient_id_fkey FOREIGN KEY (patient_id) 
        REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT long_stay_notes_created_by_fkey FOREIGN KEY (created_by) 
        REFERENCES users(id)
);

-- Create consultations table with explicit foreign key references
CREATE TABLE consultations (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL,
    mrn VARCHAR(255) NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    age INTEGER NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
    requesting_department VARCHAR(255) NOT NULL,
    patient_location VARCHAR(255) NOT NULL,
    consultation_specialty VARCHAR(255) NOT NULL,
    shift_type VARCHAR(10) CHECK (shift_type IN ('morning', 'evening', 'night')),
    urgency VARCHAR(10) CHECK (urgency IN ('routine', 'urgent', 'emergency')),
    reason TEXT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('active', 'completed', 'cancelled')),
    doctor_id INTEGER,
    doctor_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by INTEGER,
    completion_note TEXT,
    CONSTRAINT consultations_patient_id_fkey FOREIGN KEY (patient_id) 
        REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT consultations_doctor_id_fkey FOREIGN KEY (doctor_id) 
        REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT consultations_completed_by_fkey FOREIGN KEY (completed_by) 
        REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX idx_patients_mrn ON patients(mrn);
CREATE INDEX idx_admissions_patient_id ON admissions(patient_id);
CREATE INDEX idx_admissions_admitting_doctor ON admissions(admitting_doctor_id);
CREATE INDEX idx_admissions_discharge_doctor ON admissions(discharge_doctor_id);
CREATE INDEX idx_admissions_status ON admissions(status);
CREATE INDEX idx_admissions_safety_type ON admissions(safety_type) WHERE safety_type IS NOT NULL;
CREATE INDEX idx_admissions_shift_type ON admissions(shift_type);
CREATE INDEX idx_admissions_discharge ON admissions(discharge_date) WHERE discharge_date IS NOT NULL;
CREATE INDEX idx_medical_notes_patient ON medical_notes(patient_id);
CREATE INDEX idx_medical_notes_doctor ON medical_notes(doctor_id);
CREATE INDEX idx_consultations_patient ON consultations(patient_id);
CREATE INDEX idx_consultations_doctor ON consultations(doctor_id);
CREATE INDEX idx_consultations_status ON consultations(status);
CREATE INDEX idx_long_stay_notes_patient ON long_stay_notes(patient_id);
CREATE INDEX idx_long_stay_notes_created_by ON long_stay_notes(created_by);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Create triggers for all tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admissions_updated_at
    BEFORE UPDATE ON admissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_notes_updated_at
    BEFORE UPDATE ON medical_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_long_stay_notes_updated_at
    BEFORE UPDATE ON long_stay_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at
    BEFORE UPDATE ON consultations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create views for active admissions and discharged patients
CREATE OR REPLACE VIEW active_admissions AS
SELECT 
    a.id,
    a.patient_id,
    p.mrn,
    p.name AS patient_name,
    a.admission_date,
    a.department,
    a.safety_type::text AS safety_type,
    a.shift_type::text AS shift_type,
    a.is_weekend,
    ad.name AS admitting_doctor_name,
    dd.name AS discharge_doctor_name,
    a.diagnosis,
    a.status,
    a.visit_number
FROM 
    admissions a
    JOIN patients p ON a.patient_id = p.id
    LEFT JOIN users ad ON a.admitting_doctor_id = ad.id
    LEFT JOIN users dd ON a.discharge_doctor_id = dd.id
WHERE 
    a.status = 'active';

CREATE OR REPLACE VIEW discharged_patients AS
SELECT 
    a.id,
    a.patient_id,
    p.mrn,
    p.name AS patient_name,
    a.admission_date,
    a.discharge_date,
    a.department,
    a.discharge_type,
    a.follow_up_required,
    a.follow_up_date,
    a.discharge_note,
    ad.name AS admitting_doctor_name,
    dd.name AS discharge_doctor_name
FROM 
    admissions a
    JOIN patients p ON a.patient_id = p.id
    LEFT JOIN users ad ON a.admitting_doctor_id = ad.id
    LEFT JOIN users dd ON a.discharge_doctor_id = dd.id
WHERE 
    a.status = 'discharged';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;