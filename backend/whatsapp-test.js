require('dotenv').config();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
const to = 'whatsapp:+917763993916';
const body = 'Test alert from CoastAlert at ' + new Date().toISOString();
const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
const params = new URLSearchParams({ To: to, From: from, Body: body });

(async () => {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    console.log('STATUS', res.status);
    const json = await res.text();
    console.log('BODY', json);
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
})();
