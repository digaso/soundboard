import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LandingPage from './pages/LandingPage';
import PlaylistsPage from './pages/PlaylistsPage';

const Stack = createStackNavigator();

function WebSocketComponent() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);

  const connectWebSocket = () => {
    const newSocket = new WebSocket("ws://192.168.4.1:81/");

    newSocket.onopen = () => {
      console.log("✅ Connected to Arduino!");
      setMessages((prev) => ["✅ Connected to Arduino!", ...prev]);
    };

    newSocket.onmessage = (event) => {
      console.log("📩 Received:", event.data);
      setMessages((prev) => [event.data, ...prev]);
    };

    newSocket.onerror = (error) => {
      console.log("❌ Error:", error);
    };

    newSocket.onclose = () => {
      console.log("🔌 Disconnected!");
      setMessages((prev) => ["🔌 Disconnected!", ...prev]);
    };

    setSocket(newSocket);
  };

  const disconnectWebSocket = () => {
    if (socket) {
      socket.close();
      setSocket(null);
    }
  };

  const sendMessage = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send("PINGs");
      console.log("📤 Sent: PING");
      setMessages((prev) => ["📤 Sent: PING", ...prev]);
    }
  };

  useEffect(() => {
    return () => {
      if (socket) socket.close();
    };
  }, [socket]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>WebSocket with Arduino</Text>

      <TouchableOpacity style={styles.button} onPress={connectWebSocket}>
        <Text style={styles.buttonText}>Connect</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, socket ? {} : styles.disabled]}
        onPress={sendMessage}
        disabled={!socket}
      >
        <Text style={styles.buttonText}>Send "PING"</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          styles.disconnect,
          socket ? {} : styles.disabled,
        ]}
        onPress={disconnectWebSocket}
        disabled={!socket}
      >
        <Text style={styles.buttonText}>Disconnect</Text>
      </TouchableOpacity>

      <ScrollView style={styles.messages}>
        {messages.map((msg, index) => (
          <Text key={index} style={styles.message}>
            {msg}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Landing">
        <Stack.Screen name="Landing" component={LandingPage} options={{ headerShown: false }} />
        <Stack.Screen name="Playlists" component={PlaylistsPage} />
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
