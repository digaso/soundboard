import React from 'react';
import { View, Text } from 'react-native';
import SongList from './SongList';
import styles from './styles/SongsPageStyles';

const SongsPage = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Songs</Text>
      <SongList />
    </View>
  );
};

export default SongsPage;
