export function getFileRelativePath(file: File): string {
  const candidate = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  return (candidate || file.name).replace(/\\/g, '/');
}

export function fileBaseName(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, '');
}

export async function fileToBlob(file: File): Promise<Blob> {
  const content = await file.arrayBuffer();
  return new Blob([content], { type: file.type });
}

export function isImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) {
    return true;
  }

  const name = file.name.toLowerCase();
  return /(\.png|\.jpg|\.jpeg|\.webp|\.gif|\.bmp|\.tga)$/.test(name);
}

export function isJsonFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith('.json') || file.type === 'application/json';
}
