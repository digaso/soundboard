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
  Animated,
  Alert,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const SongList = () => {
  const [songs, setSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const soundRef = useRef(null);
  const navigation = useNavigation();

  const animations = useRef({}).current;
  const animationLoops = useRef({}).current;

  // Aqui: refs dos Swipeables ativos, chave é id da música
  const swipeableRefs = useRef({});

  useEffect(() => {
    loadSongs();
    return () => {
      if (soundRef.current) soundRef.current.unloadAsync();
    };
  }, []);

  const loadSongs = async () => {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      interruptionModeIOS: 1,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: 1,
      playThroughEarpieceAndroid: false,
    });
    try {
      const files = await FileSystem.readDirectoryAsync(
        FileSystem.documentDirectory
      );
      const wavFiles = files.filter(
        (f) => f.endsWith(".wav") && f !== "temp.wav"
      );
      const formatted = await Promise.all(
        wavFiles.map(async (file, idx) => {
          const uri = FileSystem.documentDirectory + file;

          const { sound, status } = await Audio.Sound.createAsync(
            { uri },
            {},
            null,
            false
          );
          const durationMillis = status.durationMillis ?? 0;
          await sound.unloadAsync();

          const minutes = Math.floor(durationMillis / 60000);
          const seconds = Math.floor((durationMillis % 60000) / 1000)
            .toString()
            .padStart(2, "0");

          return {
            id: idx.toString(),
            title: file.replace(".wav", ""),
            uri,
            duration: `${minutes}:${seconds}`,
            fileName: file,
          };
        })
      );
      setSongs(formatted);
    } catch (e) {
      console.error("Erro ao carregar músicas:", e);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSongs();
  };

  const startWaveAnimation = (id) => {
    if (!animations[id]) animations[id] = new Animated.Value(1);

    animationLoops[id] = Animated.loop(
      Animated.sequence([
        Animated.timing(animations[id], {
          toValue: 1.5,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(animations[id], {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    );

    animationLoops[id].start();
  };

  const stopWaveAnimation = (id) => {
    if (animationLoops[id]) {
      animationLoops[id].stop();
      animations[id].setValue(1);
    }
  };

  const playPauseSong = async (song) => {
    if (currentlyPlaying === song.id) {
      await soundRef.current?.pauseAsync();
      setCurrentlyPlaying(null);
      stopWaveAnimation(song.id);
    } else {
      if (soundRef.current) await soundRef.current.unloadAsync();
      Object.keys(animationLoops).forEach(stopWaveAnimation);

      const { sound } = await Audio.Sound.createAsync(
        { uri: song.uri },
        { shouldPlay: true }
      );

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setCurrentlyPlaying(null);
          stopWaveAnimation(song.id);
        }
      });

      soundRef.current = sound;
      setCurrentlyPlaying(song.id);
      startWaveAnimation(song.id);
    }
  };

  const deleteSong = async (song) => {
    Alert.alert("Apagar música", `Deseja apagar "${song.title}"?`, [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Apagar",
        style: "destructive",
        onPress: async () => {
          try {
            // Fecha swipe aberto para esse item antes de apagar
            if (swipeableRefs.current[song.id]) {
              swipeableRefs.current[song.id].close();
            }
            await FileSystem.deleteAsync(
              FileSystem.documentDirectory + song.fileName
            );
            loadSongs();
          } catch (e) {
            console.error("Erro ao apagar música:", e);
          }
        },
      },
    ]);
  };

  const renderWaveform = (songId) => {
    if (!animations[songId]) return null;
    if (currentlyPlaying !== songId) return null;

    return (
      <View style={{ flexDirection: "row", marginTop: 8 }}>
        {[...Array(35)].map((_, i) => (
          <Animated.View
            key={i}
            style={{
              width: 4,
              height: 20,
              backgroundColor: "#6a0dad",
              marginHorizontal: 2,
              transform: [{ scaleY: animations[songId] }],
              borderRadius: 2,
            }}
          />
        ))}
      </View>
    );
  };

  const filteredSongs = songs.filter((song) =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderRightActions = (song) => (
    <TouchableOpacity
      style={{
        backgroundColor: "#E0245E",
        justifyContent: "center",
        alignItems: "flex-end",
        padding: 20,
        borderRadius: 5,
        marginVertical: 8,
      }}
      onPress={() => deleteSong(song)}
    >
      <Text style={{ color: "white", fontWeight: "bold" }}>Apagar</Text>
    </TouchableOpacity>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{
          flex: 1,
          backgroundColor: "#121212",
          padding: 20,
          paddingTop: 50,
        }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: "#fff",
            marginBottom: 10,
          }}
        >
          Your Songs
        </Text>
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
            <Swipeable
              ref={(ref) => (swipeableRefs.current[item.id] = ref)}
              renderRightActions={() => renderRightActions(item)}
            >
              <View
                style={{
                  backgroundColor: "#333",
                  padding: 15,
                  marginVertical: 8,
                  borderRadius: 5,
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View>
                    <Text style={{ fontSize: 18, color: "#fff" }}>
                      {item.title}
                    </Text>
                    <Text style={{ fontSize: 14, color: "#bbb", marginTop: 4 }}>
                      {item.duration}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => playPauseSong(item)}>
                    <Ionicons
                      name={currentlyPlaying === item.id ? "pause" : "play"}
                      size={24}
                      color="#6a0dad"
                    />
                  </TouchableOpacity>
                </View>
                {renderWaveform(item.id)}
              </View>
            </Swipeable>
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
    </GestureHandlerRootView>
  );
};

export default SongList;
