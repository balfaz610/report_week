const { updateRecordsStatus } = require('../services/bitableService');
const { createResultCard, updateMessageCard } = require('../services/messageService');

/**
 * Handle card button actions (approve/reject)
 */
async function handleCardAction(eventData) {
    const startTime = Date.now();
    console.log('🚀 [START] Processing card action');
    console.log('📦 Event Data:', JSON.stringify(eventData));

    try {
        const { action } = eventData;
        if (!action || !action.value) {
            throw new Error('No action value found in event data');
        }

        console.log('🔍 Parsing action value...');
        let actionValue = JSON.parse(action.value);

        // Handle double-encoded JSON (if value is still a string after first parse)
        if (typeof actionValue === 'string') {
            console.log('⚠️ Double-encoded JSON detected, parsing again...');
            actionValue = JSON.parse(actionValue);
        }

        console.log('✅ Action Value:', actionValue);

        const { action: actionType, recordIds, count } = actionValue;

        // Split comma-separated record IDs
        const recordIdArray = recordIds ? recordIds.split(',') : [];
        console.log(`📋 Records to update: ${recordIdArray.length} items`);

        if (recordIdArray.length === 0) {
            throw new Error('No record IDs to update');
        }

        // Determine status
        const status = (actionType === 'approve' || actionType === 'Approve') ? 'Approve' : 'Reject';
        console.log(`🎯 Target Status: ${status}`);

        // --- FIRE AND FORGET STRATEGY ---
        // Use setTimeout to push this task to the end of the event loop
        // This ensures the response is sent to Lark FIRST
        setTimeout(() => {
            console.log('⏳ [BACKGROUND] Starting database update...');
            updateRecordsStatus(recordIdArray, status)
                .then(res => console.log(`✅ [BACKGROUND] Update success: ${res.updatedCount} records`))
                .catch(err => console.error('❌ [BACKGROUND] Update failed:', err));
        }, 100); // Delay 100ms to let the response fly out

        // Create result card
        console.log('🎨 Creating result card...');
        const resultCard = createResultCard(actionType, count, true);

        // Explicitly update the card to ensure buttons are removed
        // We await this to ensure the UI updates before we return
        if (eventData.open_message_id) {
            console.log(`🔄 Updating message ${eventData.open_message_id}...`);
            await updateMessageCard(eventData.open_message_id, resultCard);
        }

        // MINIMAL RESPONSE
        const responsePayload = {
            toast: {
                type: 'success',
                content: `✅ ${count} laporan sedang diproses untuk ${status}...`,
            },
            // card: resultCard, // Removed to rely on explicit update
        };

        console.log('📤 Response Payload:', JSON.stringify(responsePayload));
        console.log(`🏁 [FINISH] Returning response in ${Date.now() - startTime}ms`);
        return responsePayload;

    } catch (error) {
        console.error('❌ [ERROR] Handle Card Action:', error);

        return {
            toast: {
                type: 'error',
                content: `Error: ${error.message}`,
            },
        };
    }
}

module.exports = {
    handleCardAction,
};
