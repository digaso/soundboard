import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";

const LandingPage = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Soundboard</Text>
        <Text style={styles.subtitle}>Create and play your music</Text>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Song")}
        >
          <Text style={styles.buttonText}>Get Song from Arduino</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#a64ac9" }]}
          onPress={() => navigation.navigate("SongList")}
        >
          <Text style={styles.buttonText}>My Songs</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: "#121212",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  header: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#a64ac9",
    marginBottom: 10,
    textShadowColor: "rgba(106, 13, 173, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    marginBottom: 40,
  },
  buttonsContainer: {
    width: "100%",
    marginBottom: 40,
    gap: 20,
    alignItems: "center",
  },
  button: {
    backgroundColor: "#6a0dad",
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 15,
    width: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
};

export default LandingPage;
