import smpp from 'smpp';

const host = '154.113.5.24';
const port = 9013;

const systemIds = ['BZTItms', 'BZTIPrmo'];
const passwords = [
  'TheBztel@#1',
  '$%TheBztel@#1',
  'TheBztel@',
  'TheBztel',
  'TheBztel@#',
];

const systemTypes = ['SMPP', '', 'smpp'];
const interfaceVersions = [0x34, 0x33, null];

async function runBind(sysId, pwd, method, sysType, version) {
  return new Promise((resolve) => {
    const desc = `${sysId} | pwd:${pwd} | ${method} | sysType:"${sysType}" | ver:${version ?? 'default'}`;
    console.log(`[Testing] ${desc}`);
    let resolved = false;

    const session = smpp.connect({ host, port }, () => {
      console.log(`  -> TCP connected. Sending bind...`);
      
      const pduParams = {
        system_id: sysId,
        password: pwd,
        system_type: sysType,
      };
      if (version !== null) {
        pduParams.interface_version = version;
      }

      session[method](pduParams, (pdu) => {
        console.log(`  <- PDU Response: ${pdu.command} | Status: 0x${pdu.command_status.toString(16)} (${pdu.command_status})`);
        resolved = true;
        session.close();
        resolve(pdu.command_status);
      });
    });

    session.on('close', () => {
      if (!resolved) {
        console.log(`  <- Connection closed by remote host BEFORE bind response.`);
        resolved = true;
        resolve('CLOSED');
      }
    });

    session.on('error', (err) => {
      if (!resolved) {
        console.error(`  <- Connection error: ${err.message}`);
        resolved = true;
        resolve('ERROR');
      }
    });

    setTimeout(() => {
      if (!resolved) {
        console.log(`  <- Timeout (no response).`);
        resolved = true;
        try { session.close(); } catch (e) {}
        resolve('TIMEOUT');
      }
    }, 4000);
  });
}

async function main() {
  console.log(`Starting Nigeria Gateway SMPP Bind Tests on ${host}:${port}`);
  
  // We'll test standard combinations first
  console.log('\n=== STEP 1: Test Standard Combinations ===');
  for (const sysId of systemIds) {
    for (const pwd of passwords) {
      for (const method of ['bind_transceiver', 'bind_transmitter']) {
        const res = await runBind(sysId, pwd, method, 'SMPP', 0x34);
        if (res === 0) {
          console.log(`🎉 SUCCESS WITH CONFIG: ${sysId}, ${pwd}, ${method}`);
          return;
        }
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  // If standard fails, try system types and versions
  console.log('\n=== STEP 2: Test alternative System Types and Versions (with standard passwords) ===');
  for (const sysId of systemIds) {
    for (const pwd of ['TheBztel@#1']) {
      for (const sysType of systemTypes) {
        for (const ver of interfaceVersions) {
          for (const method of ['bind_transceiver', 'bind_transmitter']) {
            const res = await runBind(sysId, pwd, method, sysType, ver);
            if (res === 0) {
              console.log(`🎉 SUCCESS WITH CONFIG: ${sysId}, ${pwd}, ${method}, sysType:${sysType}, ver:${ver}`);
              return;
            }
            await new Promise(r => setTimeout(r, 1000));
          }
        }
      }
    }
  }
  
  console.log('\nAll tested combinations failed.');
}

main();
