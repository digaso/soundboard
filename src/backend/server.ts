import express, { Request, Response } from 'express';
import { convertTxtToMp3 } from './txtToMp3';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 8080;

app.use(cors());
app.use('/upload', express.text({ type: '*/*' }));

app.get('/songs', (req: Request, res: Response) => {
  const songsDir = path.join(__dirname, '../songs');
  try {
    const files = fs.readdirSync(songsDir);
    const songs = files
      .filter(file => file.endsWith('.mp3'))
      .map((file, index) => ({
        id: index + 1,
        title: file.replace('.mp3', ''),
        artist: 'Local Recording',
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