const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Firestore adapter to replace Prisma
class FirestoreAdapter {
  constructor() {
    this.db = db;
  }

  // User operations
  async createUser(userData) {
    const userRef = this.db.collection('users').doc();
    await userRef.set({
      ...userData,
      id: userRef.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { id: userRef.id, ...userData };
  }

  async findUserByEmail(email) {
    const snapshot = await this.db.collection('users').where('email', '==', email).get();
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  }

  async findUserById(id) {
    const doc = await this.db.collection('users').doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  // Course operations
  async createCourse(courseData) {
    const courseRef = this.db.collection('courses').doc();
    await courseRef.set({
      ...courseData,
      id: courseRef.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { id: courseRef.id, ...courseData };
  }

  async getAllCourses() {
    const snapshot = await this.db.collection('courses').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Attendance operations
  async createAttendance(attendanceData) {
    const attendanceRef = this.db.collection('attendance').doc();
    await attendanceRef.set({
      ...attendanceData,
      id: attendanceRef.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { id: attendanceRef.id, ...attendanceData };
  }

  async getAttendanceByStudent(studentId) {
    const snapshot = await this.db.collection('attendance')
      .where('userId', '==', studentId)
      .orderBy('date', 'desc')
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}

module.exports = new FirestoreAdapter();