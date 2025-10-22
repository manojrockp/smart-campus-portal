const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class Session {
  static async create(userId, token, expiresAt) {
    return await prisma.session.create({
      data: {
        userId,
        token,
        expiresAt,
        isActive: true
      }
    });
  }

  static async findByToken(token) {
    return await prisma.session.findUnique({
      where: { token },
      include: { user: true }
    });
  }

  static async invalidate(token) {
    return await prisma.session.update({
      where: { token },
      data: { isActive: false }
    });
  }

  static async invalidateAllUserSessions(userId) {
    return await prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false }
    });
  }

  static async cleanup() {
    return await prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isActive: false }
        ]
      }
    });
  }
}

module.exports = Session;