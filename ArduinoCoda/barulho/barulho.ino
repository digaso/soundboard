#include <EEPROM.h>
#include <WiFiS3.h>
#include <WiFiServer.h>

char ssid[] = "ArduinoPiano";
char pass[] = "12345678";

WiFiServer server(80);

int buzzerPin = 9;
int botoes[ 5 ] = { 2, 3, 4, 5, 6 };
int frequencias[ 5 ] = { 262, 294, 330, 349, 392 };

String musicaGravada = "";
bool modoGravar = false;

const int ledGravar = 10;
const int ledToque = 11;

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("A criar Access Point...");
  int status = WiFi.beginAP(ssid, pass);
  if (status != WL_AP_LISTENING) {
    Serial.println("Erro ao iniciar AP");
    while (true);
  }

  delay(1000);
  IPAddress ip = WiFi.localIP();
  Serial.print("AP criado com IP: ");
  Serial.println(ip);

  server.begin();

  pinMode(buzzerPin, OUTPUT);
  for (int i = 0; i < 5; i++) {
    pinMode(botoes[ i ], INPUT_PULLUP);
  }

  pinMode(7, INPUT_PULLUP);
  pinMode(8, INPUT_PULLUP);

  pinMode(ledGravar, OUTPUT);
  pinMode(ledToque, OUTPUT);
  digitalWrite(ledGravar, LOW);
  digitalWrite(ledToque, LOW);

  Serial.println("Modo atual: FREESTYLE");
}

void loop() {
  static int lastNote = -1;
  static unsigned long tempoInicio = 0;
  static bool lastEstadoBotao7 = LOW;

  bool estadoAtualBotao7 = digitalRead(7);
  if (lastEstadoBotao7 == HIGH && estadoAtualBotao7 == LOW) {
    modoGravar = !modoGravar;

    if (!modoGravar) {
      Serial.println("A guardar música na EEPROM...");

      // Piscar LED enquanto guarda
      for (int i = 0; i < 6; i++) {
        digitalWrite(ledGravar, i % 2 == 0 ? HIGH : LOW);
        delay(100);
      }
      salvarMusicaNaEEPROM(musicaGravada);
      digitalWrite(ledGravar, LOW);
      Serial.println("Guardado com sucesso.");
      Serial.println("FreeStyle ativado");
    }
    else {
      musicaGravada = "";
      Serial.println("Modo GRAVAR ativado");
      digitalWrite(ledGravar, HIGH);  // Ligar LED em modo gravar
    }
    delay(300);
  }
  lastEstadoBotao7 = estadoAtualBotao7;

  for (int i = 0; i < 5; i++) {
    if (digitalRead(botoes[ i ]) == LOW) {
      if (lastNote != i) {
        tone(buzzerPin, frequencias[ i ]);
        tempoInicio = millis();
        lastNote = i;
        digitalWrite(ledToque, HIGH);  // LED toca
        delay(10);
      }
      return;
    }
  }

  if (lastNote != -1) {
    noTone(buzzerPin);
    digitalWrite(ledToque, LOW);  // Desligar LED ao soltar
    unsigned long duracao = millis() - tempoInicio;

    if (modoGravar) {
      String linha = String(frequencias[ lastNote ]) + "," + String(duracao) + "\n";
      musicaGravada += linha;
      Serial.print("Gravado: "); Serial.print(linha);
    }

    lastNote = -1;
  }

  if (digitalRead(8) == LOW) {
    Serial.println("Música gravada:");
    String lida = lerMusicaDaEEPROM();
    Serial.println(lida);
    delay(2000);
  }

  // Servidor HTTP
  WiFiClient client = server.available();
  if (client) {
    Serial.println("Novo cliente conectado");
    while (client.connected()) {
      if (client.available()) {
        String req = client.readStringUntil('\r');
        client.read();

        if (req.indexOf("GET /musica") != -1) {
          String resposta = lerMusicaDaEEPROM();
          client.println("HTTP/1.1 200 OK");
          client.println("Content-Type: text/plain");
          client.println("Access-Control-Allow-Origin: *");
          client.print("Content-Length: ");
          client.println(resposta.length());
          client.println();
          client.print(resposta);
        }
        else {
          client.println("HTTP/1.1 200 OK");
          client.println("Content-Type: text/plain");
          client.println();
          client.println("Arduino Piano Web API\nUse /musica para obter a música gravada.");
        }
        break;
      }
    }
    delay(1);
    client.stop();
    Serial.println("Cliente desconectado");
  }
}

void salvarMusicaNaEEPROM(String musica) {
  int len = musica.length();
  bool estadoLed = false;

  Serial.println(EEPROM.length());
  int tempoInicial = millis();
  for (int i = 0; i < len && i < EEPROM.length(); i++) {
    EEPROM.write(i, musica[ i ]);

    // Piscar LED durante escrita
    estadoLed = !estadoLed;
    digitalWrite(ledGravar, estadoLed);
    delay(50);  // Piscar rápido mas visível
  }
  
  EEPROM.write(len, '\0');  // Terminador nulo
  Serial.println(millis() - tempoInicial);

  digitalWrite(ledGravar, LOW); // Apaga LED no final
}
String lerMusicaDaEEPROM() {
  String lida = "";
  char c;
  for (int i = 0; i < EEPROM.length(); i++) {
    c = EEPROM.read(i);
    if (c == '\0') break;
    lida += c;
  }
  return lida;
}
