-- Database optimization for production

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users("studentId");
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance("userId", date);
CREATE INDEX IF NOT EXISTS idx_attendance_semester ON attendance("semesterId");
CREATE INDEX IF NOT EXISTS idx_enrollments_user_semester ON enrollments("userId", "semesterId");
CREATE INDEX IF NOT EXISTS idx_semesters_year ON semesters(year);
CREATE INDEX IF NOT EXISTS idx_courses_semester ON courses("semesterId");

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_attendance_user_course_semester ON attendance("userId", "courseId", "semesterId");
CREATE INDEX IF NOT EXISTS idx_users_year_section ON users(year, section);

-- Partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_active_academic_years ON academic_years(year) WHERE "isActive" = true;

-- Performance settings
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Reload configuration
SELECT pg_reload_conf();