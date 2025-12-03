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
        const status = (actionType === 'approve' || actionType === 'Approve') ? 'Approve' : 'Reject';

        console.log('⏳ Updating records (Background Process)...');

        // FIRE AND FORGET: Do not await this!
        // This prevents Vercel timeout (3s limit from Lark)
        updateRecordsStatus(recordIdArray, status)
            .then(res => console.log(`✅ Background update success: ${res.updatedCount} records`))
            .catch(err => console.error('❌ Background update failed:', err));

        // Create result card immediately (optimistic update)
        const resultCard = createResultCard(actionType, count, true);

        console.log(`🏁 Handler finished in ${Date.now() - startTime}ms (Update continues in background)`);

        // Return updated card IMMEDIATELY
        return {
            toast: {
                type: 'success',
                content: `${count} laporan sedang diproses untuk di-${status.toLowerCase()}...`,
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
