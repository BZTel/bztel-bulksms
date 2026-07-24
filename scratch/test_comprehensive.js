import smpp from 'smpp';

const host = '185.135.128.117';
const port = 7500;
const systemId = 'BZTItms';
const password = 'TheBztel@#1';

const testCases = [
  // Test interface versions
  { name: 'v3.4 TRX', method: 'bind_transceiver', params: { system_id: systemId, password, system_type: 'SMPP', interface_version: 0x34 } },
  { name: 'v3.3 TRX', method: 'bind_transceiver', params: { system_id: systemId, password, system_type: 'SMPP', interface_version: 0x33 } },
  { name: 'v3.4 TX', method: 'bind_transmitter', params: { system_id: systemId, password, system_type: 'SMPP', interface_version: 0x34 } },
  { name: 'v3.3 TX', method: 'bind_transmitter', params: { system_id: systemId, password, system_type: 'SMPP', interface_version: 0x33 } },
  { name: 'v3.4 RX', method: 'bind_receiver', params: { system_id: systemId, password, system_type: 'SMPP', interface_version: 0x34 } },
  { name: 'v3.3 RX', method: 'bind_receiver', params: { system_id: systemId, password, system_type: 'SMPP', interface_version: 0x33 } },
  
  // Test empty system_type
  { name: 'No SysType TRX', method: 'bind_transceiver', params: { system_id: systemId, password, system_type: '', interface_version: 0x34 } },
  { name: 'No SysType TX', method: 'bind_transmitter', params: { system_id: systemId, password, system_type: '', interface_version: 0x34 } },
  
  // Test password truncation (8 chars max for v3.4 standard)
  { name: 'Truncated Pwd TRX', method: 'bind_transceiver', params: { system_id: systemId, password: 'TheBztel', system_type: 'SMPP', interface_version: 0x34 } },
  { name: 'Truncated Pwd TX', method: 'bind_transmitter', params: { system_id: systemId, password: 'TheBztel', system_type: 'SMPP', interface_version: 0x34 } }
];

async function runTestCase(tc) {
  return new Promise((resolve) => {
    console.log(`\nRunning test: ${tc.name}...`);
    let resolved = false;
    
    const session = smpp.connect({ host, port }, () => {
      console.log('  Socket connected. Sending bind...');
      
      session[tc.method](tc.params, (pdu) => {
        console.log(`  PDU Response command: ${pdu.command}, status: ${pdu.command_status}`);
        resolved = true;
        session.close();
        resolve(`SUCCESS (status ${pdu.command_status})`);
      });
    });

    session.on('close', () => {
      if (!resolved) {
        resolved = true;
        console.log('  Connection closed by host.');
        resolve('CLOSED');
      }
    });

    session.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        console.log(`  Error: ${err.message}`);
        resolve(`ERROR: ${err.message}`);
      }
    });

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.log('  Timeout reached.');
        session.close();
        resolve('TIMEOUT');
      }
    }, 6000);
  });
}

async function main() {
  for (const tc of testCases) {
    const result = await runTestCase(tc);
    console.log(`Result: ${result}`);
    await new Promise(r => setTimeout(r, 2000));
  }
}

main();
