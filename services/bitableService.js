const { client, config } = require('../config/lark');

/**
 * Get records from the last 2 weeks grouped by Senior Manager
 */
async function getWeeklyReportsByManager() {
    try {
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        const twoWeeksAgoTimestamp = twoWeeksAgo.getTime();

        // Fetch all records from the table
        const response = await client.bitable.appTableRecord.list({
            path: {
                app_token: config.baseToken,
                table_id: config.tableId,
            },
            params: {
                page_size: 500, // Adjust based on your needs
            },
        });

        if (!response.data || !response.data.items) {
            console.log('No records found in table');
            return {};
        }

        const records = response.data.items;
        console.log(`📊 Found ${records.length} total records in table`);

        // Debug: Log first record to see field structure
        if (records.length > 0) {
            console.log('📋 Sample record structure:', JSON.stringify(records[0], null, 2));
        }

        // Filter records from last 2 weeks and group by Senior Manager
        const groupedByManager = {};

        records.forEach(record => {
            const fields = record.fields;

            // Check if record is within 2 weeks (assuming there's a created_time or date field)
            const recordTime = fields.created_time || fields.date || record.created_time;
            if (recordTime && recordTime < twoWeeksAgoTimestamp) {
                return; // Skip old records
            }

            // Get Senior Manager field (assuming it's  Person field)
            const seniorManager = fields['SM test'];

            if (!seniorManager) {
                return; // Skip if no SM assigned
            }

            // Handle Person field format (usually an array with user info)
            let managerId, managerName;
            if (Array.isArray(seniorManager) && seniorManager.length > 0) {
                managerId = seniorManager[0].id;
                managerName = seniorManager[0].name || seniorManager[0].en_name;
            } else if (typeof seniorManager === 'object') {
                managerId = seniorManager.id;
                managerName = seniorManager.name || seniorManager.en_name;
            } else {
                return; // Skip if format is unexpected
            }

            // Initialize manager group if not exists
            if (!groupedByManager[managerId]) {
                groupedByManager[managerId] = {
                    managerId,
                    managerName,
                    records: [],
                };
            }

            // Add record to manager's group
            groupedByManager[managerId].records.push({
                recordId: record.record_id,
                fields: fields,
            });
        });

        return groupedByManager;
    } catch (error) {
        console.error('Error fetching bitable records:', error);
        throw error;
    }
}

/**
 * Get records for a specific Senior Manager
 */
async function getRecordsByManager(managerId) {
    console.log(`🔍 Looking for records with manager ID: ${managerId}`);
    const allGrouped = await getWeeklyReportsByManager();
    console.log('📊 Available manager IDs:', Object.keys(allGrouped));
    const result = allGrouped[managerId] || null;
    console.log(`📋 Found ${result ? result.records.length : 0} records for this manager`);
    return result;
}

/**
 * Update multiple records status (approve/reject)
 */
async function updateRecordsStatus(recordIds, status) {
    try {
        // Prepare records for batch update
        const records = recordIds.map(recordId => ({
            record_id: recordId,
            fields: {
                'Approver SM': status, // Updated to match new column name
                // 'Approved At': Date.now(), // Commented out as I don't see this column in your screenshot
            },
        }));

        // Lark batch update limit is 500, but safer to do chunks of 50
        const chunkSize = 50;
        const chunks = [];
        for (let i = 0; i < records.length; i += chunkSize) {
            chunks.push(records.slice(i, i + chunkSize));
        }

        for (const chunk of chunks) {
            await client.bitable.appTableRecord.batchUpdate({
                path: {
                    app_token: config.baseToken,
                    table_id: config.tableId,
                },
                data: {
                    records: chunk,
                },
            });
        }

        return { success: true, updatedCount: recordIds.length };
    } catch (error) {
        console.error('Error updating records:', error);
        throw error;
    }
}

/**
 * Get user info to find their manager role
 */
async function getUserInfo(userId) {
    try {
        const response = await client.contact.user.get({
            path: {
                user_id: userId,
            },
            params: {
                user_id_type: 'open_id',
            },
        });

        return response.data.user;
    } catch (error) {
        console.error('Error getting user info:', error);
        return null;
    }
}

module.exports = {
    getWeeklyReportsByManager,
    getRecordsByManager,
    updateRecordsStatus,
    getUserInfo,
};
