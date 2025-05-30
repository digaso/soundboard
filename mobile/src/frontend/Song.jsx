import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

function gerarTom(freq, durMs, sampleRate = 44100) {
  const nSamples = Math.floor((durMs / 1000) * sampleRate);
  const buffer = new Int16Array(nSamples);
  for (let i = 0; i < nSamples; i++) {
    const t = i / sampleRate;
    buffer[i] = Math.floor(Math.sin(2 * Math.PI * freq * t) * 32767);
  }
  return buffer;
}

function gerarWAV(data, sampleRate = 44100) {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  const byteRate = sampleRate * 2;
  const blockAlign = 2;
  const subchunk2Size = data.length * 2;
  const chunkSize = 36 + subchunk2Size;

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++)
      view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, chunkSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, subchunk2Size, true);

  const wav = new Uint8Array(44 + subchunk2Size);
  wav.set(new Uint8Array(header), 0);

  for (let i = 0; i < data.length; i++) {
    wav[44 + i * 2] = data[i] & 0xff;
    wav[44 + i * 2 + 1] = (data[i] >> 8) & 0xff;
  }

  return wav;
}

const Song = () => {
  const [status, setStatus] = useState("Parado");
  const [loading, setLoading] = useState(false);
  const [nomeMusica, setNomeMusica] = useState("");
  const [wavTempPath, setWavTempPath] = useState(null);
  const [mostraGuardar, setMostraGuardar] = useState(false);
  const soundRef = useRef(null);
  const navigation = useNavigation();

  async function receberMusica() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        interruptionModeIOS: 1,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: 1,
        playThroughEarpieceAndroid: false,
      });

      setLoading(true);
      setStatus("A buscar música...");

      const response = await axios.get("http://192.168.4.1/musica", {
        timeout: 3000,
        responseType: "text",
        transformResponse: [(data) => data],
      });

      const texto = response.data;
      console.log("Texto recebido:", texto);

      if (!texto) {
        Alert.alert("Erro", "Nenhum dado recebido do Arduino.");
        setStatus("Erro");
        return;
      }

      const linhas = texto.trim().split("\n");
      const samples = [];
      const sampleRate = 44100;

      for (const linha of linhas) {
        const [freqStr, durStr] = linha.split(",");
        const freq = parseFloat(freqStr);
        const dur = parseInt(durStr);
        if (!isNaN(freq) && !isNaN(dur)) {
          const tom = gerarTom(freq, dur, sampleRate);
          samples.push(...tom);
        }
      }

      const pcm = new Int16Array(samples);
      const wav = gerarWAV(pcm, sampleRate);

      const base64Wav = Buffer.from(wav.buffer).toString("base64");
      const caminhoTemp = FileSystem.documentDirectory + "temp.wav";

      await FileSystem.writeAsStringAsync(caminhoTemp, base64Wav, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: caminhoTemp },
        { shouldPlay: true }
      );

      soundRef.current = sound;
      setWavTempPath(caminhoTemp);
      setMostraGuardar(true);
      setStatus("Música recebida 🎵");
    } catch (error) {
      console.error("Erro ao buscar música:", error.message);
      Alert.alert("Erro", "Não foi possível obter a música do Arduino.");
      setStatus("Erro");
    } finally {
      setLoading(false);
    }
  }

  async function guardarMusica() {
    if (!nomeMusica.trim()) {
      Alert.alert("Erro", "Escolhe um nome válido para guardar.");
      return;
    }

    const caminhoFinal =
      FileSystem.documentDirectory + nomeMusica.trim() + ".wav";

    try {
      await FileSystem.copyAsync({
        from: wavTempPath,
        to: caminhoFinal,
      });

      Alert.alert("Guardado", `Música guardada como ${nomeMusica}.wav`);
      setStatus("Guardada");
      setNomeMusica("");
      setMostraGuardar(false);
    } catch (error) {
      console.error("Erro ao guardar:", error.message);
      Alert.alert("Erro", "Não foi possível guardar a música.");
    }
  }

  async function pausarOuRetomar() {
    if (soundRef.current) {
      const status = await soundRef.current.getStatusAsync();
      if (status.isPlaying) {
        await soundRef.current.pauseAsync();
        setStatus("Pausado");
      } else {
        await soundRef.current.playAsync();
        setStatus("A tocar...");
      }
    }
  }

  async function pararSom() {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      setStatus("Parado");
    }
  }

  return (
    <View style={styles.container}>
      {/* Botão voltar */}
      <TouchableOpacity
        style={styles.botaoVoltar}
        onPress={() => navigation.goBack()}
        hitSlop={{
          top: 10,
          bottom: 10,
          left: 10,
          right: 10,
        }}
      >
        <Ionicons name="arrow-back" size={28} color="#6a0dad" />
      </TouchableOpacity>

      <Text style={styles.estado}>Estado: {status}</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#1DB954" />
      ) : (
        <>
          <TouchableOpacity style={styles.botao} onPress={receberMusica}>
            <Ionicons name="download-outline" size={24} color="#fff" />
            <Text style={styles.textoBotao}> Receber Música</Text>
          </TouchableOpacity>

          {mostraGuardar && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Nome da música"
                placeholderTextColor="#888"
                value={nomeMusica}
                onChangeText={setNomeMusica}
              />
              <TouchableOpacity style={styles.botao} onPress={guardarMusica}>
                <Ionicons name="save-outline" size={24} color="#fff" />
                <Text style={styles.textoBotao}> Guardar Música</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.botao} onPress={pausarOuRetomar}>
            <Ionicons name="play-skip-forward-outline" size={24} color="#fff" />
            <Text style={styles.textoBotao}> Pausar/Retomar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.botao, { backgroundColor: "#E0245E" }]}
            onPress={pararSom}
          >
            <Ionicons name="stop-outline" size={24} color="#fff" />
            <Text style={styles.textoBotao}> Parar</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    padding: 20,
  },
  botaoVoltar: {
    position: "absolute",
    top: 60,
    left: 10,
    padding: 10,

    marginBottom: 15,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1DB954",
    marginBottom: 12,
    textAlign: "center",
  },
  estado: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  botao: {
    flexDirection: "row",
    backgroundColor: "#6a0dad",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  textoBotao: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 8,
  },
  input: {
    backgroundColor: "#333",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === "ios" ? 15 : 10,
    fontSize: 16,
    marginVertical: 10,
  },
});

export default Song;
