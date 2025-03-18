import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';

const songs = [
  { id: 1, title: 'Aaaa', artist: 'Aaaaa' },
  { id: 2, title: 'Song Two', artist: 'Artist Two' },
  // ...other songs...
];

const SongList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();

  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TextInput
        style={styles.searchBar}
        placeholder="Search by song or author"
        placeholderTextColor="#888"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={filteredSongs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.song}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.artist}>{item.artist}</Text>
          </View>
        )}
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('RecordSong')}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  searchBar: {
    height: 40,
    borderColor: '#6a0dad',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    color: '#fff',
    marginBottom: 20,
  },
  song: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  artist: {
    fontSize: 16,
    color: 'gray',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#6a0dad',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
  },
});

export default SongList;
