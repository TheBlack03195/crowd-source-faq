export interface VttCue {
  start: string;
  end: string;
  speaker: string | null;
  text: string;
}

const TIMESTAMP_LINE = /(\d{2}:\d{2}:\d{2}[.,]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[.,]\d{3})/;
const SPEAKER_PREFIX = /^([\w .'-]{1,40}):\s*(.*)$/;

export function parseVTTWithSpeakers(raw: string): VttCue[] {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const cues: VttCue[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    if (line === 'WEBVTT' || line === '' || /^\d+$/.test(line)) {
      i++;
      continue;
    }

    const tsMatch = line.match(TIMESTAMP_LINE);
    if (tsMatch) {
      const [, start, end] = tsMatch;
      i++;
      const textLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== '' && !TIMESTAMP_LINE.test(lines[i])) {
        textLines.push(lines[i].trim());
        i++;
      }
      const fullText = textLines.join(' ').trim();
      const speakerMatch = fullText.match(SPEAKER_PREFIX);
      if (speakerMatch) {
        cues.push({ start, end, speaker: speakerMatch[1], text: speakerMatch[2] });
      } else {
        cues.push({ start, end, speaker: null, text: fullText });
      }
      continue;
    }

    i++;
  }

  return cues;
}


export function parseVTT(raw: string): string {
  return parseVTTWithSpeakers(raw)
    .map((c) => (c.speaker ? `${c.speaker}: ${c.text}` : c.text))
    .filter(Boolean)
    .join('\n');
}

export function isEmptyTranscript(raw: string): boolean {
  const plain = parseVTT(raw).trim();
  return plain.length < 20; 
}
