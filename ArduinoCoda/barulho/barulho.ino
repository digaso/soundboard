#include <EEPROM.h>
#include <WiFiS3.h>
#include <WiFiServer.h>

char ssid[] = "ArduinoPiano";
char pass[] = "12345678";  // Tem de ter no mínimo 8 caracteres

WiFiServer server(80);

int buzzerPin = 9;
int botoes[5] = {2, 3, 4, 5, 6};
int frequencias[5] = {262, 294, 330, 349, 392};

String musicaGravada = "";
bool modoGravar = false;

void setup() {
  Serial.begin(115200);
  delay(1000);

  // Criar Access Point
  Serial.println("A criar Access Point...");
  int status = WiFi.beginAP(ssid, pass);
  if (status != WL_AP_LISTENING) {
    Serial.println("Erro ao iniciar AP");
    while (true); // trava aqui se falhar
  }

  delay(1000);  // Esperar o AP ficar ativo
  IPAddress ip = WiFi.localIP();
  Serial.print("AP criado com IP: ");
  Serial.println(ip);

  server.begin();

  pinMode(buzzerPin, OUTPUT);
  for (int i = 0; i < 5; i++) {
    pinMode(botoes[i], INPUT_PULLUP);
  }

  pinMode(7, INPUT_PULLUP);
  pinMode(8, INPUT_PULLUP);

  Serial.println("Modo atual: FREESTYLE");
}

void loop() {
  static int lastNote = -1;
  static unsigned long tempoInicio = 0;
  static bool lastEstadoBotao7 = HIGH;

  bool estadoAtualBotao7 = digitalRead(7);
  if (lastEstadoBotao7 == HIGH && estadoAtualBotao7 == LOW) {
    modoGravar = !modoGravar;

    if (!modoGravar) {
      Serial.println("A guardar música na EEPROM...");
      salvarMusicaNaEEPROM(musicaGravada);
      Serial.println("Guardado com sucesso.");
      Serial.println("FreeStyle ativado");
    } else {
      musicaGravada = "";
      Serial.println("Modo GRAVAR ativado");
    }
    delay(300);
  }
  lastEstadoBotao7 = estadoAtualBotao7;

  for (int i = 0; i < 5; i++) {
    if (digitalRead(botoes[i]) == LOW) {
      if (lastNote != i) {
        tone(buzzerPin, frequencias[i]);
        tempoInicio = millis();
        lastNote = i;
        delay(10);
      }
      return;
    }
  }

  if (lastNote != -1) {
    noTone(buzzerPin);
    unsigned long duracao = millis() - tempoInicio;

    if (modoGravar) {
      String linha = String(frequencias[lastNote]) + "," + String(duracao) + "\n";
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
        client.read(); // lê o '\n'

        if (req.indexOf("GET /musica") != -1) {
          String resposta = lerMusicaDaEEPROM();
          client.println("HTTP/1.1 200 OK");
          client.println("Content-Type: text/plain");
          client.println("Access-Control-Allow-Origin: *");
          client.print("Content-Length: ");
          client.println(resposta.length());
          client.println();
          client.print(resposta);
        } else {
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
  for (int i = 0; i < len && i < EEPROM.length(); i++) {
    EEPROM.write(i, musica[i]);
  }
  EEPROM.write(len, '\0');
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
