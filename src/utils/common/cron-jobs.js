const cron = require('node-cron');
const { BookingService } = require('../../services');

function scheduleCrons() {
    cron.schedule('*/5 * * * *', async () => {
        console.log('stated the cron jobs',BookingService);
        await BookingService.cancelOldBookings();
    });
}

module.exports = scheduleCrons;
