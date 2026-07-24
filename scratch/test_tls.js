import smpp from 'smpp';

const host = '185.135.128.117';
const port = 7500;
const systemId = 'BZTItms';
const password = 'TheBztel@#1';

console.log('Testing TLS Connection to ' + host + ':' + port);

const session = smpp.connect({
  host,
  port,
  tls: true,
  rejectUnauthorized: false // bypass cert validation if self-signed
}, () => {
  console.log('TLS connected! Sending bind command...');
  session.bind_transceiver({
    system_id: systemId,
    password: password,
    system_type: 'SMPP'
  }, (pdu) => {
    console.log('Received PDU:', pdu.command, 'Status:', pdu.command_status);
    session.close();
  });
});

session.on('close', () => {
  console.log('Connection closed');
});

session.on('error', (err) => {
  console.error('Connection error:', err.message);
});

setTimeout(() => {
  console.log('Timeout reached. Closing session.');
  session.close();
}, 8000);
