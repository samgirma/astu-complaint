const cron = require('node-cron');
const { checkComplaintWarnings } = require('../services/warningService');

// Schedule warning checks
const scheduleWarningChecks = () => {
  // Check every hour for time-based warnings
  cron.schedule('0 * * * *', async () => {
    try {
      await checkComplaintWarnings();
    } catch (error) {
      console.error('Error in hourly warning check:', error);
    }
  });

  // Check every 6 hours for critical warnings
  cron.schedule('0 */6 * * *', async () => {
    try {
      await checkComplaintWarnings();
    } catch (error) {
      console.error('Error in critical warning check:', error);
    }
  });
};

module.exports = {
  scheduleWarningChecks
};
