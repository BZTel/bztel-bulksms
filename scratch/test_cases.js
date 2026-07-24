import smpp from 'smpp';

const host = '185.135.128.117';
const port = 7500;
const password = 'TheBztel@#1';

const accounts = [
  'BZTItms',
  'bztitms',
  'BZTITMS',
  'BZTIPrmo',
  'bztiprmo',
  'BZTIPRMO',
];

async function testAccount(systemId) {
  return new Promise((resolve) => {
    console.log(`\nTesting Account: "${systemId}"`);
    let resolved = false;
    const session = smpp.connect({ host, port }, () => {
      console.log('  Connected. Sending bind...');
      session.bind_transceiver({
        system_id: systemId,
        password: password,
        system_type: 'SMPP'
      }, (pdu) => {
        console.log('  PDU Response:', pdu.command, 'Status:', pdu.command_status);
        resolved = true;
        session.close();
        resolve(pdu.command_status);
      });
    });

    session.on('close', () => {
      console.log('  Connection closed');
      if (!resolved) {
        resolved = true;
        resolve('CLOSED');
      }
    });

    session.on('error', (err) => {
      console.error('  Error:', err.message);
      if (!resolved) {
        resolved = true;
        resolve('ERROR');
      }
    });

    setTimeout(() => {
      if (!resolved) {
        console.log('  Timeout');
        resolved = true;
        session.close();
        resolve('TIMEOUT');
      }
    }, 5000);
  });
}

async function main() {
  for (const acc of accounts) {
    const res = await testAccount(acc);
    console.log(`Result for "${acc}": ${res}`);
    await new Promise(r => setTimeout(r, 2000));
  }
}

main();
