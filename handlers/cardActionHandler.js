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

        // Update database synchronously (await) to ensure consistency
        // This prevents "revert" issues if the user refreshes or if a message event follows
        console.log('⏳ Starting database update...');
        try {
            const dbResult = await updateRecordsStatus(recordIdArray, status);
            console.log(`✅ Update success: ${dbResult.updatedCount} records`);
        } catch (dbError) {
            console.error('❌ Update failed:', dbError);
            // We continue to show success card to user, but log the error
        }

        // Create result card
        console.log('🎨 Creating result card...');
        const resultCard = createResultCard(actionType, count, true);

        // Explicitly update the card to ensure buttons are removed immediately
        // Check for open_message_id in various places
        const messageId = eventData.open_message_id || eventData.context?.open_message_id;

        if (messageId) {
            console.log(`🔄 Updating message ${messageId}...`);
            // We await this to ensure the UI updates
            await updateMessageCard(messageId, resultCard);
        } else {
            console.warn('⚠️ Could not find open_message_id to update card');
        }

        // Return BOTH card content AND toast for maximum compatibility
        // Some Lark configurations need the card in response to update properly
        const responsePayload = {
            card: resultCard,
            toast: {
                type: 'success',
                content: `✅ ${count} laporan berhasil ${status}`,
            },
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
