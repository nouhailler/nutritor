import { Platform } from 'react-native';

/** Déclenche un téléchargement fichier sur web via Blob + ancre. */
export function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Lit le texte d'un URI (blob: sur web, file: sur native via FileSystem). */
export async function readFileAsText(
  uri: string,
  _encoding?: string,
): Promise<string> {
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    return res.text();
  }
  const FS = await import('expo-file-system/legacy');
  return FS.readAsStringAsync(uri, { encoding: FS.EncodingType.UTF8 });
}
