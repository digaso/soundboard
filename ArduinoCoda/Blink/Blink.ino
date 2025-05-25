#include <ArduinoBLE.h>

const int   LED_PIN        = LED_BUILTIN;      // usually pin 13 on Uno R4 Wi-Fi
const char  TARGET_NAME[]  = "LE_SRS-XB21";

BLEDevice  targetPeripheral;
bool       connected      = false;
unsigned long lastBlink   = 0;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
  while (!Serial);

  if (!BLE.begin()) {
    Serial.println("💥 BLE init failed!");
    while (1);
  }

  Serial.println("🔎 Scanning for speaker...");
  BLE.scan();
}

void loop() {
  // Let the BLE library do its background work
  BLE.poll();

  // If not connected, blink LED
  if (!connected) {
    if (millis() - lastBlink >= 500) {
      lastBlink = millis();
      digitalWrite(LED_PIN, lastBlink & 0x200 ? HIGH : LOW);
    }
    // Look for the target peripheral
    BLEDevice peripheral = BLE.available();
    if (peripheral) {
      Serial.print("📶 Found ");
      Serial.print(peripheral.localName());
      Serial.print(" [");
      Serial.print(peripheral.address());
      Serial.println("]");
      if (peripheral.localName() == TARGET_NAME) {
        BLE.stopScan();
        Serial.println("⏳ Connecting...");
        if (peripheral.connect()) {
          targetPeripheral = peripheral;
          connected = true;
          digitalWrite(LED_PIN, HIGH);       // LED solid ON
          Serial.println("✅ Connected!");
        } else {
          Serial.println("❌ Connection failed");
          BLE.scan();  // try again
        }
      }
    }
  }
  // If connected, periodically report status and keep LED on
  else {
    static unsigned long lastReport = 0;
    if (millis() - lastReport >= 1000) {
      lastReport = millis();
      bool stillUp = targetPeripheral.connected();
      Serial.print("🔄 Still connected? ");
      Serial.println(stillUp ? "YES" : "NO");
      if (!stillUp) {
        Serial.println("⚠️  Lost connection—restarting scan");
        connected = false;
        BLE.scan();
      }
    }
    digitalWrite(LED_PIN, HIGH);  // keep LED solid on
  }
}
