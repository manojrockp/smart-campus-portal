# Semester-Wise Management Structure

## Overview
The Smart Campus Portal now follows a semester-based hierarchy for better academic management:

```
Academic Year
├── Fall Semester
│   ├── Courses
│   ├── Attendance Records
│   └── Leave Applications
└── Spring Semester
    ├── Courses
    ├── Attendance Records
    └── Leave Applications
```

## Admin Panel Changes

### Sidebar Structure
- **Removed**: Direct "Courses" link from admin sidebar
- **Enhanced**: Semester Management now includes course management within each semester

### New Navigation Flow
1. **Semesters** → View all semesters
2. **Expand Semester** → View courses within that semester
3. **Add Course** → Create courses directly under a semester
4. **Manage Data** → All attendance and leaves are semester-specific

## Database Schema Updates

### New Relationships
```sql
-- Attendance now linked to semester
Attendance {
  semesterId String? // Links to Semester
}

-- Leave Applications now linked to semester  
LeaveApplication {
  semesterId String? // Links to Semester
}

-- Courses already had semester relationship
Course {
  semesterId String? // Links to Semester
}
```

## API Changes

### Attendance Endpoints
- `GET /api/attendance/student/:id?semesterId=xxx` - Filter by semester
- `POST /api/attendance/mark` - Automatically assigns semester from course

### Leave Endpoints  
- `GET /api/leaves?semesterId=xxx` - Filter by semester
- `POST /api/leaves` - Auto-assigns active semester if not specified

### Course Endpoints
- `GET /api/courses/semester/:semesterId` - Get courses by semester
- `POST /api/courses` - Create course with semester assignment

## Migration Process

### Automatic Data Migration
Run the migration script to update existing data:

```bash
cd backend
npm run migrate-semester
```

This will:
1. Create a default active semester if none exists
2. Assign all existing attendance records to the active semester
3. Assign all existing leave applications to the active semester
4. Assign all existing courses to the active semester
5. Update all enrollments with semester information

### Manual Steps After Migration
1. **Update Database Schema**: Run `npm run build` to apply schema changes
2. **Run Migration**: Execute `npm run migrate-semester`
3. **Verify Data**: Check that all records have proper semester assignments

## Frontend Changes

### Semester Management Page
- **Expandable Semesters**: Click to view courses within each semester
- **Inline Course Management**: Add/delete courses directly from semester view
- **Course Statistics**: View enrollment counts per course

### Course Management
- **Removed**: Standalone courses page from admin panel
- **Integrated**: Course management within semester context
- **Filtering**: All course views now support semester filtering

## Usage Examples

### Creating a New Academic Year
1. Go to **Semesters** page
2. Create "Fall 2025" semester (Aug 1 - Dec 31)
3. Create "Spring 2026" semester (Jan 1 - Jun 30)
4. Set one as active

### Adding Courses to Semester
1. Expand the desired semester
2. Click "Add Course" 
3. Fill course details (automatically assigned to semester)

### Viewing Semester-Specific Data
- **Attendance**: Filter by semester in attendance reports
- **Leaves**: View leave applications by semester
- **Analytics**: Generate semester-wise performance reports

## Benefits

1. **Better Organization**: Clear separation of academic periods
2. **Accurate Reporting**: Semester-specific attendance and leave tracking
3. **Historical Data**: Maintain records across multiple semesters
4. **Simplified Management**: Courses managed within their academic context
5. **Scalability**: Easy to add new semesters and manage multi-year data

## Migration Notes

- **Backward Compatibility**: Existing data is preserved and migrated
- **Default Semester**: System creates appropriate default semester
- **Data Integrity**: All relationships are maintained during migration
- **Zero Downtime**: Migration can be run on live system