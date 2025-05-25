// logger.js
const { exec } = require('child_process');
const noble = require('@abandonware/noble');

// === Arduino CLI Configuration ===
const ARDUINO_CLI    = '/opt/homebrew/bin/arduino-cli';
const ARDUINO_FQBN   = 'arduino:renesas_uno:unor4wifi';
const ARDUINO_PORT   = '/dev/cu.usbmodemDC5475C3D7D02';
const SKETCH_PATH    = '../mobile/ArduinoCoda/Blink/Blink.ino'; // Update if your path differs
const BUILD_DIR      = './build';

// === BLE Configuration ===
// If your speaker is named 'LE_SRS-XB21', use that here:
const TARGET_NAME    = 'LE_SRS-XB21';
const SERVICE_UUID   = null;    // null = scan for all devices

// === Logging Helpers ===
const log = {
  info:    msg => console.log(`ℹ️  ${msg}`),
  success: msg => console.log(`✅ ${msg}`),
  warn:    msg => console.warn(`⚠️  ${msg}`),
  error:   msg => console.error(`❌ ${msg}`),
};

// === Run shell commands ===
function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = exec([cmd, ...args].join(' '), { shell: true, stdio: 'inherit' });
    proc.on('error', reject);
    proc.on('exit', code => code === 0 ? resolve() : reject(new Error(`${cmd} exited with ${code}`)));
  });
}

// === Compile & Upload ===
async function compileAndUpload() {
  try {
    log.info('Compiling sketch...');
    await run(ARDUINO_CLI, [
      'compile',
      `--fqbn ${ARDUINO_FQBN}`,
      `--output-dir ${BUILD_DIR}`,
      SKETCH_PATH
    ]);
    log.success('Compilation succeeded');

    log.info('Uploading to board...');
    await run(ARDUINO_CLI, [
      'upload',
      `-p ${ARDUINO_PORT}`,
      `--fqbn ${ARDUINO_FQBN}`,
      SKETCH_PATH
    ]);
    log.success('Upload succeeded');
  } catch (err) {
    log.error(err.message);
    process.exit(1);
  }
}

// === BLE Scan & Connect ===
function startBLEScan() {
  noble.on('stateChange', async state => {
    log.info(`BLE adapter state: ${state}`);
    if (state === 'poweredOn') {
      const filter = SERVICE_UUID ? [SERVICE_UUID] : [];
      log.info('Scanning for BLE devices...');
      await noble.startScanningAsync(filter, false);
    } else {
      log.warn('BLE adapter not powered on — stopped scanning');
      await noble.stopScanningAsync();
    }
  });

  noble.on('discover', async peripheral => {
    const name = peripheral.advertisement.localName || '<no-name>';
    log.info(`Discovered: ${name} [${peripheral.address}]`);

    if (name === TARGET_NAME || peripheral.address === TARGET_NAME) {
      log.success(`Target '${TARGET_NAME}' found — connecting...`);
      await noble.stopScanningAsync();

      try {
        await peripheral.connectAsync();
        log.success('Connected');

        const { characteristics } = await peripheral.discoverSomeServicesAndCharacteristicsAsync(
          SERVICE_UUID ? [SERVICE_UUID] : [],
          []
        );

        if (characteristics.length) {
          const char = characteristics[0];
          await char.subscribeAsync();
          log.info('Subscribed to notifications');
          char.on('data', data => {
            const val = data.readUInt16LE(0);
            console.log(`📥 Notification: ${val}`);
          });
        } else {
          log.warn('No characteristics found — reading all services');
        }

        peripheral.on('disconnect', () => {
          log.warn('Peripheral disconnected');
          process.exit(0);
        });
      } catch (err) {
        log.error(`Connection error: ${err.message}`);
        process.exit(1);
      }
    }
  });
}

// === Main ===
(async () => {
  await compileAndUpload();
  startBLEScan();
})();
