const cron = require('node-cron');
const Session = require('../../models/Session');

// Run session cleanup every hour
const startSessionCleanup = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      const result = await Session.cleanup();
      console.log(`Session cleanup completed. Removed ${result.count} expired sessions.`);
    } catch (error) {
      console.error('Session cleanup error:', error);
    }
  });
  
  console.log('Session cleanup job started - runs every hour');
};

module.exports = { startSessionCleanup };