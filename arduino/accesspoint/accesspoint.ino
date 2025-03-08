#include <WiFi.h>
#include <WebSocketsServer.h>

// Configuração do Access Point (AP)
const char *ssid = "Arduino_AP";   // Nome da rede WiFi criada pelo Arduino
const char *password = "12345678"; // Senha da rede WiFi (mínimo 8 caracteres)

// Criar servidor WebSocket na porta 81
WebSocketsServer webSocket(81);

void onWebSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  if (type == WStype_TEXT) {
    Serial.print("Recebido:");
    webSocket.sendTXT(num, "Arduino recebeu a mensagem!");
  }
}

void setup() {
  Serial.begin(115200);

  // Criar o Access Point
  WiFi.beginAP(ssid, password);
  Serial.println("Access Point Criado!");
  Serial.print("IP do AP: ");
  Serial.println(WiFi.softAPIP());

  // Iniciar WebSockets
  webSocket.begin();
  webSocket.onEvent(onWebSocketEvent);
}

void loop() {
  webSocket.loop();
}
