const { getRecordsByManager, getUserInfo } = require('../services/bitableService');
const { sendReportCard, sendTextMessage } = require('../services/messageService');

/**
 * Handle incoming messages from users
 */
async function handleMessage(eventData) {
    try {
        const { sender, message } = eventData;
        const userId = sender.sender_id.open_id;
        const messageText = JSON.parse(message.content).text;

        console.log(`Received message from ${userId}: ${messageText}`);

        // For testing: when user sends any message, send their reports
        // In production, you might want to check specific commands

        // Get user info (optional, just for logging or validation)
        // We can proceed without it because we have the userId from the message
        const userInfo = await getUserInfo(userId);

        if (userInfo) {
            console.log(`User identified: ${userInfo.name}`);
        } else {
            console.warn('Could not get user info (permission missing?), proceeding with ID only.');
        }

        // Get reports for this manager
        // Note: You need to match userId with the Senior Manager field in your table
        // This assumes the Person field uses the same user ID format
        const managerData = await getRecordsByManager(userId);

        if (!managerData || managerData.records.length === 0) {
            await sendTextMessage(
                userId,
                '📭 Tidak ada laporan yang perlu direview dalam 2 minggu terakhir.\n\nAnda mungkin bukan Senior Manager atau belum ada laporan yang ditugaskan kepada Anda.'
            );
            return;
        }

        // Send interactive card with all reports
        await sendReportCard(userId, managerData);

        console.log(`Sent ${managerData.records.length} reports to ${managerData.managerName}`);

    } catch (error) {
        console.error('Error handling message:', error);
        // Optionally send error message to user
        try {
            await sendTextMessage(
                eventData.sender.sender_id.open_id,
                '❌ Terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi.'
            );
        } catch (e) {
            console.error('Error sending error message:', e);
        }
    }
}

module.exports = {
    handleMessage,
};
