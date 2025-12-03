const { updateRecordsStatus } = require('../services/bitableService');
const { createResultCard } = require('../services/messageService');

/**
 * Handle card button actions (approve/reject)
 */
async function handleCardAction(eventData) {
    try {
        const { action } = eventData;
        const actionValue = JSON.parse(action.value);
        const { action: actionType, recordIds, count } = actionValue;

        console.log(`Processing ${actionType} action for ${count} records`);

        // Split comma-separated record IDs
        const recordIdArray = recordIds.split(',');

        // Update all records with the new status
        const status = actionType === 'approve' ? 'Approved' : 'Rejected';
        const result = await updateRecordsStatus(recordIdArray, status);

        // Create result card
        const resultCard = createResultCard(actionType, count, result.success);

        // Return the updated card to replace the original
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
        console.error('Error handling card action:', error);

        return {
            toast: {
                type: 'error',
                content: 'Terjadi kesalahan saat memproses aksi',
            },
        };
    }
}

module.exports = {
    handleCardAction,
};
