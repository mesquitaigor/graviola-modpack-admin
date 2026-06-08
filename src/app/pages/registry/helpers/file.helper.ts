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

export async function collectFilesFromEntry(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) {
    return new Promise<File[]>((resolve) => {
      (entry as FileSystemFileEntry).file(
        (file) => resolve([file]),
        () => resolve([]),
      );
    });
  }

  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const allEntries: FileSystemEntry[] = [];
    let batch: FileSystemEntry[];
    do {
      batch = await new Promise<FileSystemEntry[]>((resolve, reject) =>
        reader.readEntries(resolve, reject),
      );
      allEntries.push(...batch);
    } while (batch.length > 0);
    const nested = await Promise.all(allEntries.map(collectFilesFromEntry));
    return nested.flat();
  }

  return [];
}
