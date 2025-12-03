require('dotenv').config();
const express = require('express');
const { config } = require('./config/lark');
const messageHandler = require('./handlers/messageHandler');
const { handleCardAction } = require('./handlers/cardActionHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Lark Weekly Report Bot is running',
        timestamp: new Date().toISOString(),
    });
});

// Webhook endpoint for Lark events
app.post('/webhook/event', async (req, res) => {
    try {
        let body = req.body;

        console.log('📨 Received webhook:', body.type || body.header?.event_type || (body.encrypt ? 'encrypted' : 'unknown'));
        console.log('📦 Full Body:', JSON.stringify(body, null, 2));

        // Handle encrypted payload
        if (body.encrypt) {
            console.log('🔐 Encrypted payload detected');

            if (!config.encryptKey) {
                console.error('❌ Encrypt key not configured but received encrypted payload');
                console.log('💡 Solution: Either set LARK_ENCRYPT_KEY in .env or disable encryption in Lark Console');
                return res.status(400).json({ error: 'Encryption not configured' });
            }

            try {
                // Decrypt using Lark SDK
                const crypto = require('crypto');
                const encryptKey = config.encryptKey;
                const encrypt = body.encrypt;

                // Lark uses AES-256-CBC encryption
                const decipher = crypto.createDecipheriv(
                    'aes-256-cbc',
                    Buffer.from(encryptKey),
                    Buffer.alloc(16, 0) // IV is all zeros for Lark
                );

                let decrypted = decipher.update(encrypt, 'base64', 'utf8');
                decrypted += decipher.final('utf8');

                body = JSON.parse(decrypted);
                console.log('✅ Payload decrypted successfully');
            } catch (decryptError) {
                console.error('❌ Decryption failed:', decryptError.message);
                console.log('💡 Check if LARK_ENCRYPT_KEY matches the one in Lark Console');
                return res.status(400).json({ error: 'Decryption failed' });
            }
        }

        // Handle URL verification challenge (no token check needed for this)
        if (body.type === 'url_verification') {
            console.log('✅ URL verification challenge received');
            return res.json({
                challenge: body.challenge,
            });
        }

        // Verify token for actual events (SKIP for card actions - they use dynamic tokens)
        const isCardAction = body.action && body.action.tag === 'button';

        if (!isCardAction && body.token && body.token !== config.verificationToken) {
            console.warn('❌ Invalid verification token');
            console.warn('Expected:', config.verificationToken);
            console.warn('Received:', body.token);
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Handle LEGACY card action format (without header/event structure)
        if (isCardAction) {
            console.log('🔘 Card action event received (legacy format)');
            const result = await handleCardAction(body);
            return res.json(result);
        }

        // Handle different event types (Schema 2.0)
        const { header, event } = body;

        // Safety check
        if (!header || !event) {
            console.warn('⚠️ Missing header or event in webhook payload');
            console.log('Body:', JSON.stringify(body, null, 2));
            return res.json({ ok: true });
        }

        // Handle message events
        if (header.event_type === 'im.message.receive_v1') {
            console.log('💬 Message event received');

            // Ignore bot's own messages
            if (event.sender && event.sender.sender_type === 'app') {
                console.log('⏭️ Skipping bot\'s own message');
                return res.json({ ok: true });
            }

            // IMPORTANT: In serverless environment (Vercel), we MUST await the handler
            // otherwise the execution might be frozen/terminated before completion.
            await messageHandler.handleMessage(event);

            return res.json({ ok: true });
        }

        // Handle card action events
        if (header.event_type === 'card.action.trigger') {
            console.log('🔘 Card action event received');
            const result = await handleCardAction(event);
            return res.json(result);
        }

        // Unknown event type
        console.log('❓ Unknown event type:', header.event_type);
        return res.json({ ok: true });

    } catch (error) {
        console.error('Error processing webhook:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server (for local development)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Lark Bot server running on port ${PORT}`);
        console.log(`📝 Webhook URL: http://localhost:${PORT}/webhook/event`);
    });
}

// Export for Vercel
module.exports = app;
