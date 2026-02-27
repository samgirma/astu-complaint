const cron = require('node-cron');
const { checkComplaintWarnings } = require('../services/warningService');

// Schedule warning checks
const scheduleWarningChecks = () => {
  console.log('Setting up automated warning checks...');
  
  // Check every hour for time-based warnings
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('Running hourly warning check...');
      await checkComplaintWarnings();
    } catch (error) {
      console.error('Error in hourly warning check:', error);
    }
  });

  // Check every 6 hours for critical warnings
  cron.schedule('0 */6 * * *', async () => {
    try {
      console.log('Running critical warning check...');
      await checkComplaintWarnings();
    } catch (error) {
      console.error('Error in critical warning check:', error);
    }
  });

  console.log('Warning checks scheduled successfully');
  console.log('- Hourly checks: 0 * * * * (every hour at minute 0)');
  console.log('- Critical checks: 0 */6 * * * (every 6 hours at minute 0)');
};

module.exports = {
  scheduleWarningChecks
};
