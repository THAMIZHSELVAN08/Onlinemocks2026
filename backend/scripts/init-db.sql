-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core User Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) CHECK (role IN ('ADMIN', 'HR', 'STUDENT', 'VOLUNTEER')) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Profiles
CREATE TABLE IF NOT EXISTS hr_profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    company_name VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS volunteer_profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    assigned_hr_id UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    register_number VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100),
    section VARCHAR(10), -- Added section
    aptitude_score INT DEFAULT 0,
    gd_score INT DEFAULT 0,
    resume_url TEXT,
    current_hr_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Detailed Evaluations
CREATE TABLE IF NOT EXISTS evaluations (
    student_id UUID PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
    hr_id UUID REFERENCES users(id),
    appearance_attitude INT DEFAULT 0,
    managerial_aptitude INT DEFAULT 0,
    general_awareness INT DEFAULT 0,
    technical_knowledge INT DEFAULT 0,
    communication_skills INT DEFAULT 0,
    ambition INT DEFAULT 0,
    self_confidence INT DEFAULT 0,
    strengths TEXT,
    improvements TEXT,
    comments TEXT,
    overall_score DECIMAL(4,2),
    evaluation_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    check_in_time TIMESTAMP DEFAULT NOW(),
    ip_address VARCHAR(50),
    device_info TEXT,
    status VARCHAR(20) DEFAULT 'PRESENT'
);

-- Transfer Logs
CREATE TABLE IF NOT EXISTS student_transfers (
    id SERIAL PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    from_hr_id UUID REFERENCES users(id),
    to_hr_id UUID REFERENCES users(id),
    admin_id UUID REFERENCES users(id),
    transfer_reason TEXT,
    transferred_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_student_register_number ON students(register_number);
CREATE INDEX IF NOT EXISTS idx_student_hr ON students(current_hr_id);
