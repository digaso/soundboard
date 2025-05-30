import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const SongList = () => {
  const [songs, setSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const soundRef = useRef(null);
  const navigation = useNavigation();

  useEffect(() => {
    loadSongs();
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const loadSongs = async () => {
    try {
      const files = await FileSystem.readDirectoryAsync(
        FileSystem.documentDirectory
      );
      const wavFiles = files.filter(
        (f) => f.endsWith(".wav") && f !== "temp.wav"
      );
      const formatted = wavFiles.map((file, idx) => ({
        id: idx.toString(),
        title: file.replace(".wav", ""),
        uri: FileSystem.documentDirectory + file,
      }));
      setSongs(formatted);
    } catch (e) {
      console.error("Erro ao carregar músicas:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSongs();
  };

  const playPauseSong = async (song) => {
    if (currentlyPlaying === song.id) {
      await soundRef.current?.pauseAsync();
      setCurrentlyPlaying(null);
    } else {
      if (soundRef.current) await soundRef.current.unloadAsync();

      const { sound } = await Audio.Sound.createAsync(
        { uri: song.uri },
        { shouldPlay: true }
      );

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) setCurrentlyPlaying(null);
      });

      soundRef.current = sound;
      setCurrentlyPlaying(song.id);
    }
  };

  const filteredSongs = songs.filter((song) =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
        backgroundColor: "#121212",
        padding: 20,
        paddingTop: 50,
      }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TextInput
        style={{
          height: 40,
          backgroundColor: "#222",
          color: "#fff",
          borderRadius: 8,
          paddingHorizontal: 12,
          marginBottom: 15,
          width: "100%",
        }}
        placeholder="Pesquisar música..."
        placeholderTextColor="#888"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        data={filteredSongs}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: "#333",
              padding: 15,
              marginVertical: 8,
              borderRadius: 5,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 18, color: "#fff" }}>{item.title}</Text>
            <TouchableOpacity onPress={() => playPauseSong(item)}>
              <Ionicons
                name={currentlyPlaying === item.id ? "pause" : "play"}
                size={24}
                color="#6a0dad"
              />
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity
        onPress={() => navigation.navigate("Song")}
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          backgroundColor: "#6a0dad",
          width: 56,
          height: 56,
          borderRadius: 28,
          justifyContent: "center",
          alignItems: "center",
          elevation: 5,
        }}
      >
        <Text style={{ fontSize: 30, color: "#fff" }}>+</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

export default SongList;
