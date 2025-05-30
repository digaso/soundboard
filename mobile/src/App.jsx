import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import LandingPage from "./frontend/LandingPage";
import PlaylistsPage from "./frontend/PlaylistsPage";
import Song from "./frontend/Song";

const Stack = createStackNavigator();

export default function App() {
  console.log(Song);
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Landing">
        <Stack.Screen
          name="Landing"
          component={LandingPage}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Playlists" component={PlaylistsPage} />
        <Stack.Screen
          name="Song"
          component={Song}
          options={{ title: "Song Details" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  button: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    width: "80%",
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  disconnect: { backgroundColor: "red" },
  disabled: { backgroundColor: "#ccc" },
  messages: {
    marginTop: 20,
    width: "100%",
    maxHeight: 200,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
  },
  message: { fontSize: 14, marginBottom: 5 },
});
