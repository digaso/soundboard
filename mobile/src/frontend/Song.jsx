// App.jsx
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";
import axios from "axios";

// Gerar tom senoidal
function gerarTom(freq, durMs, sampleRate = 44100) {
  const nSamples = Math.floor((durMs / 1000) * sampleRate);
  const buffer = new Int16Array(nSamples);
  for (let i = 0; i < nSamples; i++) {
    const t = i / sampleRate;
    buffer[i] = Math.floor(Math.sin(2 * Math.PI * freq * t) * 32767);
  }
  return buffer;
}

// Construir WAV
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
  const soundRef = useRef(null);

  async function tocarMusicaDoArduino() {
    console.log("A tocar música do Arduino...");
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
        responseType: "text", // Força a resposta como texto
        transformResponse: [(data) => data], // Evita que axios tente converter JSON
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
      const caminho = FileSystem.documentDirectory + "musica.wav";
      await FileSystem.writeAsStringAsync(caminho, base64Wav, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Se já houver som carregado, descarrega
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: caminho },
        { shouldPlay: true }
      );

      soundRef.current = sound;
      setStatus("A tocar...");
    } catch (error) {
      console.error("Erro ao buscar música:", error.message);
      Alert.alert("Erro", "Não foi possível obter a música do Arduino.");
      setStatus("Erro");
    } finally {
      setLoading(false);
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
      <Text style={styles.titulo}>🎹 Arduino Piano</Text>
      <Text style={styles.estado}>Estado: {status}</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007aff" />
      ) : (
        <>
          <Button title="🎵 Tocar Música" onPress={tocarMusicaDoArduino} />
          <View style={styles.espaco} />
          <Button title="⏯️ Pausar/Retomar" onPress={pausarOuRetomar} />
          <View style={styles.espaco} />
          <Button title="⏹️ Parar" onPress={pararSom} color="red" />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
  },
  estado: {
    fontSize: 18,
    marginBottom: 20,
    color: "#555",
  },
  espaco: {
    height: 15,
  },
});

export default Song;
