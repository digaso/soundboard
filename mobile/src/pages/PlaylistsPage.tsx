import React from 'react';
import { View, Text } from 'react-native';
import SongList from '../components/SongList';
import styles from '../styles/PlaylistsPageStyles';

const PlaylistsPage = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Playlists</Text>
      <SongList />
    </View>
  );
};

export default PlaylistsPage;
