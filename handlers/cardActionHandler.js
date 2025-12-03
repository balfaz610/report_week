const { updateRecordsStatus } = require('../services/bitableService');
const { createResultCard } = require('../services/messageService');

/**
 * Handle card button actions (approve/reject)
 */
async function handleCardAction(eventData) {
    const startTime = Date.now();
    console.log('🚀 Start processing card action');

    try {
        const { action } = eventData;
        const actionValue = JSON.parse(action.value);
        const { action: actionType, recordIds, count } = actionValue;

        console.log(`Processing ${actionType} action for ${count} records`);

        // Split comma-separated record IDs
        const recordIdArray = recordIds.split(',');

        // Update all records with the new status
        const status = actionType === 'approve' ? 'Approved' : 'Rejected';

        console.log('⏳ Updating records... (SKIPPED FOR DEBUGGING)');
        // const updateStart = Date.now();
        // const result = await updateRecordsStatus(recordIdArray, status);
        // console.log(`✅ Records updated in ${Date.now() - updateStart}ms`);

        // DUMMY RESULT
        const result = { success: true };

        // Create result card
        // const resultCard = createResultCard(actionType, count, result.success);

        console.log(`🏁 Total execution time: ${Date.now() - startTime}ms`);

        // DEBUG MODE: Return TOAST ONLY first to check if timeout issue is resolved
        return {
            toast: {
                type: result.success ? 'success' : 'error',
                content: result.success
                    ? `[DEBUG] Berhasil! ${count} laporan telah di-${status.toLowerCase()}. (Data belum diupdate)`
                    : 'Gagal memproses laporan',
            },
            // card: resultCard, // Disable card update temporarily
        };

    } catch (error) {
        console.error('❌ Error handling card action:', error);
        console.log(`🏁 Failed execution time: ${Date.now() - startTime}ms`);

        return {
            toast: {
                type: 'error',
                content: 'Terjadi kesalahan sistem',
            },
        };
    }
}

module.exports = {
    handleCardAction,
};
