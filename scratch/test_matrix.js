import smpp from 'smpp';

const host = '185.135.128.117';
const port = 7500;
const systemId = 'BZTItms';
const password = 'TheBztel@#1';

const configurations = [
  { system_type: 'SMPP', bind_method: 'bind_transceiver' },
  { system_type: '', bind_method: 'bind_transceiver' },
  { system_type: 'SMPP', bind_method: 'bind_transmitter' },
  { system_type: '', bind_method: 'bind_transmitter' },
  { system_type: 'smpp', bind_method: 'bind_transceiver' },
  { system_type: 'smpp', bind_method: 'bind_transmitter' },
];

async function runTest(config) {
  return new Promise((resolve) => {
    console.log(`\nTesting Config: Bind Method = ${config.bind_method}, system_type = "${config.system_type}"`);
    
    let resolved = false;
    const session = smpp.connect({ host, port }, () => {
      console.log('  Socket connected. Sending bind command...');
      
      const pduParams = {
        system_id: systemId,
        password: password,
        system_type: config.system_type
      };

      session[config.bind_method](pduParams, (pdu) => {
        console.log('  Received PDU:', pdu.command, 'Status:', pdu.command_status);
        resolved = true;
        session.close();
        resolve(pdu.command_status);
      });
    });

    session.on('close', () => {
      console.log('  Connection closed by host.');
      if (!resolved) {
        resolved = true;
        resolve('CLOSED');
      }
    });

    session.on('error', (err) => {
      console.error('  Socket error:', err.message);
      if (!resolved) {
        resolved = true;
        resolve('ERROR: ' + err.message);
      }
    });

    // Timeout after 8 seconds
    setTimeout(() => {
      if (!resolved) {
        console.log('  Timeout reached.');
        resolved = true;
        session.close();
        resolve('TIMEOUT');
      }
    }, 8000);
  });
}

async function main() {
  for (const config of configurations) {
    const status = await runTest(config);
    console.log(`Result: ${status}`);
    // Wait 2 seconds between tests to be clean
    await new Promise(r => setTimeout(r, 2000));
  }
}

main();
