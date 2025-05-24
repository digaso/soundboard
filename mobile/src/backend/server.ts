import express from 'express';
import { Request, Response } from 'express-serve-static-core';

const app = express();
const PORT = 8000; // Change from 4000 to 8000

// POST endpoint to receive notes
app.post('/play-note', (req: Request, res: Response) => {
  const { note } = req.body;

  if (!note) {
    return res.status(400).json({ error: 'Note is required' });
  }

  console.log(`🎵 Note received: ${note}`);
  res.status(200).json({ message: `Note ${note} received` });
});

// Basic health check or welcome route
app.get('/', (req: Request, res: Response) => {
  res.send('🎶 Server is running and ready to receive notes!');
});

app.listen(PORT, () => {
  console.log(`🎶 Server is running on http://localhost:${PORT}`);
});
