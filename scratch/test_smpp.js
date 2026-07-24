import smpp from 'smpp';
import 'dotenv/config';

console.log('--- SMPP Debug Test ---');
console.log('SMPP_HOST:', process.env.SMPP_HOST);
console.log('SMPP_PORT:', process.env.SMPP_PORT);
console.log('TX System ID:', process.env.SMPP_TX_SYSTEM_ID);
console.log('TX Password:', process.env.SMPP_TX_PASSWORD);
console.log('PROMO System ID:', process.env.SMPP_PROMO_SYSTEM_ID);
console.log('PROMO Password:', process.env.SMPP_PROMO_PASSWORD);

const host = process.env.SMPP_HOST || '185.135.128.117';
const port = parseInt(process.env.SMPP_PORT || '7500');

function testBind(systemId, password) {
  console.log(`[${systemId}] Initiating connection...`);
  const session = smpp.connect({ host, port }, () => {
    console.log(`[${systemId}] Connected! Binding transceiver...`);
    
    session.bind_transceiver({
      system_id: systemId,
      password: password,
      system_type: 'SMPP'
    }, (pdu) => {
      console.log(`[${systemId}] Bind Response:`, pdu);
      if (pdu.command_status === 0) {
        console.log(`[${systemId}] SUCCESS! Bound.`);
      } else {
        console.error(`[${systemId}] FAILED: Status code ${pdu.command_status}`);
      }
      session.close();
    });
  });

  session.on('close', () => {
    console.log(`[${systemId}] Connection closed`);
  });

  session.on('error', (err) => {
    console.error(`[${systemId}] Connection error:`, err);
  });
}

testBind(process.env.SMPP_TX_SYSTEM_ID || 'BZTItms', process.env.SMPP_TX_PASSWORD || 'TheBztel@#1');
setTimeout(() => {
  testBind(process.env.SMPP_PROMO_SYSTEM_ID || 'BZTIPrmo', process.env.SMPP_PROMO_PASSWORD || 'TheBztel@#1');
}, 5000);
