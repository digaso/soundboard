import express, { Request, Response } from 'express';
import { convertTxtToMp3 } from './txtToMp3';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const app = express();
const PORT = 8080;
const ARDUINO_URL = 'http://192.168.4.1/musica'; // Arduino's AP IP
const SYNC_INTERVAL = 5000; // Check every 5 seconds

app.use(cors());
app.use('/upload', express.text({ type: '*/*' }));

async function fetchArduinoSongs(): Promise<string | null> {
  try {
    const response = await fetch(ARDUINO_URL);
    const txtData = await response.text();
    return txtData.trim().length > 0 ? txtData : null;
  } catch (error) {
    console.error('Failed to fetch from Arduino:', error);
    return null;
  }
}

async function syncArduinoSongs() {
  const txtData = await fetchArduinoSongs();
  if (!txtData) return;

  const filename = `arduino-song-${Date.now()}`;
  const outputPath = path.join(__dirname, '../songs', `${filename}.mp3`);

  try {
    await convertTxtToMp3(txtData, outputPath);
    console.log(`✅ Successfully synced and converted Arduino song: ${filename}`);
  } catch (error) {
    console.error('❌ Failed to convert Arduino song:', error);
  }
}

// Start periodic sync
setInterval(syncArduinoSongs, SYNC_INTERVAL);

app.get('/songs', (req: Request, res: Response) => {
  const songsDir = path.join(__dirname, '../songs');
  try {
    const files = fs.readdirSync(songsDir);
    const songs = files
      .filter(file => file.endsWith('.mp3'))
      .map((file, index) => ({
        id: index + 1,
        title: file.replace('.mp3', ''),
        artist: file.startsWith('arduino-song-') ? 'Arduino Recording' : 'Local Recording',
        uri: `/songs/${file}`
      }));
    res.json(songs);
  } catch (error) {
    console.error('Error reading songs directory:', error);
    res.status(500).send({ error: 'Failed to retrieve songs' });
  }
});

app.post('/upload', async (req, res) => {
  const txtData = req.body; // This will now be a string
  const filename = `song-${Date.now()}`;
  const outputPath = `./src/songs/${filename}.mp3`; // Changed to .mp3

  try {
    await convertTxtToMp3(txtData, outputPath); // Updated function name
    console.log(`✅ Converted and saved to ${outputPath}`);
    res.status(200).send({ message: 'Song converted successfully', filename });
  } catch (error) {
    console.error('❌ Error converting song:', error);
    res.status(500).send({ error: 'Failed to convert song' });
  }
});

app.listen(PORT, () => {
  console.log(`🎧 Server listening on port ${PORT}`);
});