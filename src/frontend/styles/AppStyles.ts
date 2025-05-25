import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#FFFFFF',
  },
  button: {
    backgroundColor: '#1DB954',
    padding: 15,
    borderRadius: 50,
    marginBottom: 10,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disconnect: {
    backgroundColor: '#E0245E',
  },
  disabled: {
    backgroundColor: '#555555',
  },
  messages: {
    marginTop: 20,
    width: '100%',
    maxHeight: 200,
    backgroundColor: '#1E1E1E',
    padding: 10,
    borderRadius: 5,
  },
  message: {
    fontSize: 14,
    marginBottom: 5,
    color: '#FFFFFF',
  },
});

export default styles;
