# Course-Semester Management API

## Overview
This document describes the API endpoints for managing courses under semesters in the Smart Campus Portal.

## Endpoints

### Create Course with Semester
**POST** `/api/courses`

Creates a new course and optionally assigns it to a semester.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Data Structures and Algorithms",
  "code": "CS201",
  "description": "Introduction to fundamental data structures and algorithms",
  "credits": 3,
  "semesterId": "semester_id_here" // Optional
}
```

**Response:**
```json
{
  "id": "course_id",
  "name": "Data Structures and Algorithms",
  "code": "CS201",
  "description": "Introduction to fundamental data structures and algorithms",
  "credits": 3,
  "semesterId": "semester_id_here",
  "semester": {
    "id": "semester_id_here",
    "name": "Fall 2025",
    "code": "FALL2025"
  },
  "createdAt": "2025-01-27T...",
  "updatedAt": "2025-01-27T..."
}
```

### Get Courses (with Semester Filter)
**GET** `/api/courses?semesterId=<semester_id>`

Retrieves courses, optionally filtered by semester.

**Query Parameters:**
- `semesterId` (optional): Filter courses by semester

**Response:**
```json
[
  {
    "id": "course_id",
    "name": "Data Structures and Algorithms",
    "code": "CS201",
    "credits": 3,
    "semester": {
      "id": "semester_id",
      "name": "Fall 2025"
    },
    "_count": {
      "enrollments": 25
    }
  }
]
```

### Get Courses by Semester
**GET** `/api/courses/semester/<semester_id>`

Retrieves all courses for a specific semester.

**Response:**
```json
[
  {
    "id": "course_id",
    "name": "Data Structures and Algorithms",
    "code": "CS201",
    "credits": 3,
    "semester": {
      "id": "semester_id",
      "name": "Fall 2025"
    },
    "_count": {
      "enrollments": 25
    }
  }
]
```

### Update Course
**PUT** `/api/courses/<course_id>`

Updates a course, including semester assignment.

**Body:**
```json
{
  "name": "Advanced Data Structures",
  "code": "CS201",
  "description": "Updated description",
  "credits": 4,
  "semesterId": "new_semester_id" // Can be changed
}
```

## Frontend Integration

### Course Management Component
The `Courses.jsx` component now includes:

1. **Semester Filter Dropdown**: Filter courses by semester
2. **Semester Selection in Form**: Assign courses to semesters during creation/editing
3. **Semester Display**: Shows semester name on course cards

### Key Features
- Admins can create courses and assign them to specific semesters
- Semester filter allows viewing courses by academic period
- Course cards display the associated semester
- Form validation ensures valid semester selection

## Database Schema
The relationship is established through the `semesterId` foreign key in the `Course` model:

```prisma
model Course {
  id          String   @id @default(cuid())
  name        String
  code        String   @unique
  description String?
  credits     Int
  semesterId  String?  // Foreign key to Semester
  
  semester    Semester? @relation(fields: [semesterId], references: [id])
  // ... other relations
}
```

## Usage Examples

### Creating a Course for Fall 2025
```javascript
const courseData = {
  name: "Machine Learning",
  code: "CS401",
  description: "Introduction to ML algorithms",
  credits: 3,
  semesterId: "fall2025_semester_id"
}

const response = await axios.post('/api/courses', courseData)
```

### Filtering Courses by Semester
```javascript
const fallCourses = await axios.get('/api/courses?semesterId=fall2025_semester_id')
```

## Error Handling
- **400**: Invalid semester ID or course code already exists
- **401**: Unauthorized (missing or invalid token)
- **403**: Forbidden (insufficient permissions)
- **500**: Server error