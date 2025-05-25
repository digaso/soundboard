import { launch } from 'puppeteer';
import { writeFileSync, mkdirSync, unlinkSync } from 'fs';
import { dirname } from 'path';
import { execSync } from 'child_process';

export async function convertTxtToMp3(txtData: string, outputPath: string): Promise<void> {
  // Create the directory if it doesn't exist
  const dir = dirname(outputPath);
  mkdirSync(dir, { recursive: true });

  // Create a temporary WebM file path
  const tempWebmPath = outputPath.replace('.mp3', '.temp.webm');

  const escapedTxt = txtData.replace(/\\/g, '\\\\').replace(/`/g, '\\`');

  const htmlContent = `
    <html>
    <body>
      <script>
        const txt = \`${escapedTxt}\`;

        async function runConversion() {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const dest = audioCtx.createMediaStreamDestination();
          const recorder = new MediaRecorder(dest.stream);
          const chunks = [];

          recorder.ondataavailable = e => chunks.push(e.data);

          const lines = txt.split('\\n').map(l => l.trim()).filter(Boolean);
          let currentTime = audioCtx.currentTime;

          const parsed = [];

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (typeof line !== 'string') {
              throw new Error(\`Invalid line type at index \${i}: \${String(line)}\`);
            }

            const [f, d] = line.split(',');

            const frequency = parseFloat(f);
            const duration = parseInt(d);

            if (!Number.isFinite(frequency) || isNaN(duration)) {
              throw new Error(\`Invalid frequency (\${frequency}) or duration (\${duration}) in line: "\${line}"\`);
            }

            parsed.push({ frequency, duration });
          }

          recorder.start();

          for (const { frequency, duration } of parsed) {
            const osc = audioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(frequency, currentTime);
            osc.connect(dest);
            osc.start(currentTime);
            osc.stop(currentTime + duration / 1000);
            currentTime += duration / 1000;
          }

          const totalDuration = parsed.reduce((sum, n) => sum + n.duration, 0);
          await new Promise(resolve => setTimeout(resolve, totalDuration + 100));
          recorder.stop();

          const result = await new Promise(resolve => {
            recorder.onstop = () => {
              const blob = new Blob(chunks, { type: 'audio/webm' });
              blob.arrayBuffer().then(resolve);
            };
          });

          return result;
        }

        window.resolveConversion = runConversion;
      </script>
    </body>
    </html>
  `;

  const browser = await launch({
    headless: true,
    args: ['--use-fake-ui-for-media-stream']
  });

  try {
    const [page] = await browser.pages();
    await page.setContent(htmlContent);

    const audioBuffer = await page.evaluate(() => {
      // @ts-ignore
      return window.resolveConversion().then((arrBuf: ArrayBuffer) => Array.from(new Uint8Array(arrBuf)));
    });

    // Write temporary WebM file
    const webmBuffer = Buffer.from(audioBuffer);
    writeFileSync(tempWebmPath, webmBuffer);

    // Convert WebM to MP3 using FFmpeg
    try {
      execSync(`ffmpeg -i "${tempWebmPath}" -codec:a libmp3lame -b:a 128k -y "${outputPath}"`, {
        stdio: 'pipe' // Suppress FFmpeg output
      });
    } catch (ffmpegError) {
      throw new Error(`FFmpeg conversion failed: ${ffmpegError}`);
    }

    // Clean up temporary WebM file
    try {
      unlinkSync(tempWebmPath);
    } catch (cleanupError) {
      console.warn(`Warning: Could not delete temporary file ${tempWebmPath}`);
    }

  } finally {
    await browser.close();
  }
}