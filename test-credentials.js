require('dotenv').config();

console.log('Checking credentials...\n');

const check = (name, value) => {
    if (!value || value.includes('your_') || value.includes('xxx')) {
        console.log(`❌ ${name}: NOT SET or still placeholder`);
        return false;
    }
    console.log(`✅ ${name}: ${value.substring(0, 15)}... (${value.length} chars)`);
    return true;
};

let ok = true;
ok = check('LARK_APP_ID', process.env.LARK_APP_ID) && ok;
ok = check('LARK_APP_SECRET', process.env.LARK_APP_SECRET) && ok;
ok = check('LARK_VERIFICATION_TOKEN', process.env.LARK_VERIFICATION_TOKEN) && ok;
ok = check('LARK_BASE_TOKEN', process.env.LARK_BASE_TOKEN) && ok;
ok = check('LARK_TABLE_ID', process.env.LARK_TABLE_ID) && ok;

if (!ok) {
    console.log('\n❌ Please update .env file with correct credentials!');
    process.exit(1);
}

console.log('\n✅ All credentials are set! Testing API...\n');

const lark = require('@larksuiteoapi/node-sdk');
const client = new lark.Client({
    appId: process.env.LARK_APP_ID,
    appSecret: process.env.LARK_APP_SECRET,
    appType: lark.AppType.SelfBuild,
    domain: lark.Domain.Lark,
});

client.auth.tenantAccessToken.internal({})
    .then(r => {
        console.log('✅ SUCCESS! Token obtained!');
        console.log('Your credentials are working correctly! 🎉');
    })
    .catch(e => {
        console.log('❌ FAILED! App ID or Secret is wrong!');
        console.log('Error:', e.message);
    });
