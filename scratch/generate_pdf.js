import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const PDFDocument = require('pdfkit');

const doc = new PDFDocument({ margin: 50 });
const pdfPath = 'c:\\Users\\asnah\\Desktop\\Bztel\\SMPP_Troubleshooting_Guide.pdf';
doc.pipe(fs.createWriteStream(pdfPath));

const fontRegular = 'Helvetica';
const fontBold = 'Helvetica-Bold';
const fontMono = 'Courier';

// Helper function to draw a section header
function sectionHeader(title) {
  doc.moveDown(1.5);
  doc.font(fontBold).fontSize(14).fillColor('#000000').text(title);
  doc.moveDown(0.4);
  doc.moveTo(50, doc.y).lineTo(562, doc.y).strokeColor('#cccccc').lineWidth(1).stroke();
  doc.moveDown(0.8);
}

// Helper function for subheadings
function subHeader(title) {
  doc.moveDown(0.8);
  doc.font(fontBold).fontSize(11).fillColor('#222222').text(title);
  doc.moveDown(0.4);
}

// Helper function for bullet points
function bulletPoint(label, value, indent = 0) {
  doc.font(fontBold).fontSize(9.5).fillColor('#333333').text('  • ' + label + ': ', { continued: true });
  doc.font(fontRegular).fillColor('#555555').text(value);
}

// Helper function for commands
function commandBlock(command) {
  doc.moveDown(0.3);
  doc.font(fontMono).fontSize(8.5).fillColor('#111111').text('    ' + command);
  doc.moveDown(0.3);
}

// Document Title
doc.font(fontBold).fontSize(18).fillColor('#000000').text('BZTel - Monty Mobile SMPP Integration Guide', { align: 'center' });
doc.moveDown(0.3);
doc.font(fontRegular).fontSize(9.5).fillColor('#555555').text('Technical Reference & Troubleshooting Guide for IT Support Call', { align: 'center' });
doc.text('Date: July 23, 2026', { align: 'center' });
doc.moveDown(0.5);
doc.moveTo(50, doc.y).lineTo(562, doc.y).strokeColor('#888888').lineWidth(1.5).stroke();

// Section 1: Executive Connection Summary
sectionHeader('1. Executive Connection Summary');

doc.font(fontRegular).fontSize(9.5).fillColor('#333333').text(
  'A diagnostic audit was conducted from the active BZTel AWS EC2 server to troubleshoot the ' +
  'SMPP connection issues with the Monty Mobile SMSC gateway. The investigation reveals two distinct issues:',
  { align: 'justify' }
);
doc.moveDown(0.8);

bulletPoint('AWS EC2 Server Public IP', '52.51.186.75 (Confirmed static outbound IP)');
doc.moveDown(0.4);
bulletPoint('Documented IP Discrepancy', 'The initial meeting brief listed BZTel AWS IP as 176.34.210.141. It is highly likely Monty Mobile IT whitelisted the old IP instead of the active IP 52.51.186.75.');
doc.moveDown(0.8);

subHeader('Gateway Status Breakdown:');

bulletPoint('Nigeria Gateway (154.113.5.24:9013)', 'BLOCKED (Network-Level Timeout)');
doc.font(fontRegular).fontSize(9).fillColor('#666666').text(
  '    All TCP handshakes from the AWS server to port 9013 fail immediately. The network-level firewall on Monty Mobile\'s side has not yet whitelisted our IP 52.51.186.75.'
);
doc.moveDown(0.6);

bulletPoint('Global/Test Gateway (185.135.128.117:7500)', 'REJECTED (Application-Level Drop)');
doc.font(fontRegular).fontSize(9).fillColor('#666666').text(
  '    TCP connection completes, but the Monty Mobile SMSC immediately closes the socket when we send an SMPP bind_transceiver or bind_transmitter command. This occurs because the SMSC daemon rejects the credentials from our source IP 52.51.186.75.'
);

// Section 2: Step-by-Step Connection Testing
sectionHeader('2. Step-by-Step Connection & Troubleshooting Tests');

doc.font(fontRegular).fontSize(9.5).fillColor('#333333').text(
  'To verify status updates with the Monty Mobile IT team during the call, perform the following steps in sequence. ' +
  'All tests must be initiated from the BZTel AWS EC2 server.',
  { align: 'justify' }
);
doc.moveDown(0.5);

subHeader('Step 1: SSH into the AWS EC2 Instance');
doc.font(fontRegular).fontSize(9).fillColor('#444444').text(
  'From your local machine (inside the project root folder containing the bztel-key.pem file), execute:'
);
commandBlock('ssh -i .\\bztel-key.pem -o StrictHostKeyChecking=no ubuntu@52.51.186.75');

subHeader('Step 2: Run Network-Level Reachability Tests (Netcat)');
doc.font(fontRegular).fontSize(9).fillColor('#444444').text(
  'Verify if the network-level firewall has been updated by Monty Mobile to allow TCP traffic.'
);
doc.moveDown(0.3);
doc.font(fontBold).fontSize(9).fillColor('#333333').text('  • Test connection to the Nigeria Gateway:');
commandBlock('nc -zv -w 5 154.113.5.24 9013');
doc.font(fontRegular).fontSize(8.5).fillColor('#666666').text(
  '    - Expected failure: nc: connect to 154.113.5.24 port 9013 (tcp) timed out\n' +
  '    - Expected success: Connection to 154.113.5.24 9013 port [tcp/*] succeeded!'
);

doc.addPage(); // Move to the next page for the rest of the steps to keep it clean

subHeader('Step 3: Run SMPP Protocol Bind Tests');
doc.font(fontRegular).fontSize(9).fillColor('#444444').text(
  'Once Step 2 succeeds, run the automated test scripts on the server to verify the SMPP handshake.'
);
doc.moveDown(0.5);

doc.font(fontBold).fontSize(9).fillColor('#333333').text('  • Basic Dual-Account Connection Test:');
doc.font(fontRegular).fontSize(9).fillColor('#555555').text(
  '    Attempts to bind BZTItms (Transactional) and BZTIPrmo (Promotional) using transceiver mode.'
);
commandBlock('node test_smpp.js');

doc.font(fontBold).fontSize(9).fillColor('#333333').text('  • Password Variant Testing:');
doc.font(fontRegular).fontSize(9).fillColor('#555555').text(
  '    Tests 5 password variants (including URL-decoded, truncated, and raw formats) to rule out format mismatches.'
);
commandBlock('node test_pwds.js');

doc.font(fontBold).fontSize(9).fillColor('#333333').text('  • Comprehensive Parameter Matrix Testing:');
doc.font(fontRegular).fontSize(9).fillColor('#555555').text(
  '    Tests 10 combinations of bind modes (transceiver, transmitter, receiver), SMPP versions (3.3, 3.4), and system types.'
);
commandBlock('node test_comprehensive.js');

subHeader('Step 4: Update Gateway Environment Configuration');
doc.font(fontRegular).fontSize(9).fillColor('#444444').text(
  'Once Monty Mobile whitelists the IP and the tests succeed, update the server configuration file.'
);
doc.moveDown(0.3);
bulletPoint('Open .env file', 'nano .env');
doc.moveDown(0.3);
bulletPoint('Update Host and Port', 'Set SMPP_HOST=154.113.5.24 and SMPP_PORT=9013');
doc.moveDown(0.3);
bulletPoint('Save changes', 'Press Ctrl + O, then Enter, then Ctrl + X');

subHeader('Step 5: Restart and Monitor the Production Worker');
doc.font(fontRegular).fontSize(9).fillColor('#444444').text(
  'Restart the background worker process using PM2 to apply the configuration and start dispatching the queue.'
);
commandBlock('pm2 restart bztel-worker --update-env');
doc.font(fontRegular).fontSize(9).fillColor('#444444').text('Monitor logs in real-time:');
commandBlock('pm2 logs bztel-worker');

// Section 3: Action Items
sectionHeader('3. Troubleshooting Request & Action Items');

doc.font(fontRegular).fontSize(9.5).fillColor('#333333').text(
  'Present the following instructions to Monty Mobile IT Support during the call:',
  { align: 'justify' }
);
doc.moveDown(0.6);

bulletPoint('Update Whitelist IP', 'Replace old whitelisted IP 176.34.210.141 with current active server IP 52.51.186.75.');
doc.moveDown(0.5);
bulletPoint('Nigeria Gateway Firewall', 'Permit inbound TCP traffic from 52.51.186.75 to port 9013 on gateway 154.113.5.24.');
doc.moveDown(0.5);
bulletPoint('SMSC Client Mapping', 'Verify that BZTItms and BZTIPrmo accounts are associated with IP 52.51.186.75 in the SMSC configuration.');

// End document
doc.end();

console.log('PDF Generated Successfully at:', pdfPath);
