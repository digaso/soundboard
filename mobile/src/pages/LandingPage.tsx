import React from 'react';
import { View, Text, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import styles from '../styles/LandingPageStyles';

const LandingPage = () => {
  const navigation = useNavigation();

/*   const logo = '../assets/logo.png';
 */  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Soundboard</Text>
      <Button
        title="Record a New Song"
        onPress={() => navigation.navigate('RecordSong')}
        color="#6a0dad"
      />
      <View style={styles.bottomButton}>
        <Button
          title="Playlists"
          onPress={() => navigation.navigate('Playlists')}
          color="#6a0dad"
        />
        
      </View>
    </View>
  );
};

export default LandingPage;
