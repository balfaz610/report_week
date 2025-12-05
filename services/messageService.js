const { client } = require('../config/lark');

/**
 * Create interactive card message with approve/reject actions
 */
function createReportCard(managerData) {
    const { managerName, records } = managerData;
    const recordCount = records.length;

    // Extract record IDs for the action callback
    const recordIds = records.map(r => r.recordId).join(',');

    // Create a summary of records
    const recordSummary = records.slice(0, 5).map((record, index) => {
        const fields = record.fields;
        const employeeName = fields['Employee Name'] || 'Unknown';
        const status = fields['status'] || 'Pending';
        return `${index + 1}. ${employeeName} - ${status}`;
    }).join('\n');

    const moreRecords = recordCount > 5 ? `\n... dan ${recordCount - 5} laporan lainnya` : '';

    const card = {
        config: {
            wide_screen_mode: true,
        },
        header: {
            template: 'blue',
            title: {
                tag: 'plain_text',
                content: '📊 Weekly Report - Perlu Review',
            },
        },
        elements: [
            {
                tag: 'div',
                text: {
                    tag: 'lark_md',
                    content: `**Senior Manager:** ${managerName}\n**Jumlah Laporan:** ${recordCount} laporan (2 minggu terakhir)`,
                },
            },
            {
                tag: 'hr',
            },
            {
                tag: 'div',
                text: {
                    tag: 'lark_md',
                    content: `**Ringkasan Laporan:**\n${recordSummary}${moreRecords}`,
                },
            },
            {
                tag: 'hr',
            },
            {
                tag: 'note',
                elements: [
                    {
                        tag: 'plain_text',
                        content: 'Klik tombol di bawah untuk menyetujui atau menolak semua laporan sekaligus.',
                    },
                ],
            },
            {
                tag: 'action',
                actions: [
                    {
                        tag: 'button',
                        text: {
                            tag: 'plain_text',
                            content: '✅ Approve All',
                        },
                        type: 'primary',
                        value: JSON.stringify({
                            action: 'Approve',
                            recordIds: recordIds,
                            count: recordCount,
                        }),
                    },
                    {
                        tag: 'button',
                        text: {
                            tag: 'plain_text',
                            content: '❌ Reject All',
                        },
                        type: 'danger',
                        value: JSON.stringify({
                            action: 'Reject',
                            recordIds: recordIds,
                            count: recordCount,
                        }),
                    },
                ],
            },
        ],
    };

    return card;
}

/**
 * Send interactive card to user
 */
async function sendReportCard(userId, managerData) {
    try {
        const card = createReportCard(managerData);

        const response = await client.im.message.create({
            params: {
                receive_id_type: 'open_id',
            },
            data: {
                receive_id: userId,
                msg_type: 'interactive',
                content: JSON.stringify(card),
            },
        });

        return response;
    } catch (error) {
        console.error('Error sending card message:', error);
        throw error;
    }
}

/**
 * Send text message
 */
async function sendTextMessage(userId, text) {
    try {
        const response = await client.im.message.create({
            params: {
                receive_id_type: 'open_id',
            },
            data: {
                receive_id: userId,
                msg_type: 'text',
                content: JSON.stringify({ text }),
            },
        });

        return response;
    } catch (error) {
        console.error('Error sending text message:', error);
        throw error;
    }
}

/**
 * Update card after action (show result)
 */
function createResultCard(action, count, success = true) {
    const isApprove = action && action.toLowerCase() === 'approve';
    const emoji = isApprove ? '✅' : '❌';
    const actionText = isApprove ? 'Disetujui' : 'Ditolak';
    const color = isApprove ? 'green' : 'red';

    return {
        config: {
            wide_screen_mode: true,
        },
        header: {
            template: color,
            title: {
                tag: 'plain_text',
                content: `${emoji} Laporan ${actionText}`,
            },
        },
        elements: [
            {
                tag: 'div',
                text: {
                    tag: 'lark_md',
                    content: success
                        ? `**${count} laporan** telah berhasil ${actionText.toLowerCase()}!`
                        : `Gagal memproses laporan. Silakan coba lagi.`,
                },
            },
            {
                tag: 'note',
                elements: [
                    {
                        tag: 'plain_text',
                        content: `Diproses pada: ${new Date().toLocaleString('id-ID')}`,
                    },
                ],
            },
        ],
    };
}

module.exports = {
    createReportCard,
    sendReportCard,
    sendTextMessage,
    createResultCard,
    updateMessageCard,
};

/**
 * Update a message card explicitly
 */
async function updateMessageCard(messageId, cardContent) {
    try {
        const response = await client.im.message.patch({
            path: {
                message_id: messageId,
            },
            data: {
                content: JSON.stringify(cardContent),
            },
        });
        return response;
    } catch (error) {
        console.error('Error updating message card:', error);
        // Don't throw, just log, so we don't break the flow
        return null;
    }
}
