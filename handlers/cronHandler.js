const { getWeeklyReportsByManager } = require('../services/bitableService');
const { sendReportCard } = require('../services/messageService');

/**
 * Handle cron job to send weekly reports
 */
async function handleCronJob() {
    console.log('⏰ [CRON] Starting weekly report distribution...');
    const startTime = Date.now();

    try {
        // Get all reports grouped by manager
        const allReports = await getWeeklyReportsByManager();
        const managers = Object.values(allReports);

        console.log(`📊 Found reports for ${managers.length} managers`);

        if (managers.length === 0) {
            console.log('📭 No reports to send.');
            return {
                status: 'success',
                message: 'No reports to send',
                count: 0
            };
        }

        let successCount = 0;
        let failCount = 0;

        // Send report to each manager
        for (const managerData of managers) {
            try {
                if (managerData.records.length === 0) continue;

                console.log(`📤 Sending report to ${managerData.managerName} (${managerData.records.length} items)...`);
                await sendReportCard(managerData.managerId, managerData);
                successCount++;
            } catch (error) {
                console.error(`❌ Failed to send report to ${managerData.managerName}:`, error);
                failCount++;
            }
        }

        const duration = Date.now() - startTime;
        console.log(`🏁 [CRON] Finished in ${duration}ms. Success: ${successCount}, Failed: ${failCount}`);

        return {
            status: 'success',
            processed: managers.length,
            sent: successCount,
            failed: failCount,
            duration
        };

    } catch (error) {
        console.error('❌ [CRON] Error executing cron job:', error);
        throw error;
    }
}

module.exports = {
    handleCronJob,
};
