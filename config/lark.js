require('dotenv').config();
const lark = require('@larksuiteoapi/node-sdk');

// Initialize Lark Client
const client = new lark.Client({
  appId: process.env.LARK_APP_ID,
  appSecret: process.env.LARK_APP_SECRET,
  appType: lark.AppType.SelfBuild,
  domain: lark.Domain.Lark, // Use Lark for international, or Feishu for China
});

module.exports = {
  client,
  config: {
    appId: process.env.LARK_APP_ID,
    appSecret: process.env.LARK_APP_SECRET,
    verificationToken: process.env.LARK_VERIFICATION_TOKEN,
    encryptKey: process.env.LARK_ENCRYPT_KEY,
    baseToken: process.env.LARK_BASE_TOKEN,
    tableId: process.env.LARK_TABLE_ID,
  }
};
