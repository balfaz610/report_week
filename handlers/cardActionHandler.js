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
        // Options must match exact Single Select options in table: "Approve", "Reject"
        const status = actionType === 'approve' ? 'Approve' : 'Reject';

        console.log('⏳ Updating records...');
        const updateStart = Date.now();

        // REAL UPDATE (using batch update for speed)
        const result = await updateRecordsStatus(recordIdArray, status);
        console.log(`✅ Records updated in ${Date.now() - updateStart}ms`);

        // Create result card
        const resultCard = createResultCard(actionType, count, result.success);

        console.log(`🏁 Total execution time: ${Date.now() - startTime}ms`);

        // Return updated card
        return {
            toast: {
                type: result.success ? 'success' : 'error',
                content: result.success
                    ? `${count} laporan berhasil ${status.toLowerCase()}!`
                    : 'Gagal memproses laporan',
            },
            card: resultCard,
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
