export interface ModpackModel {
  id: number;
  name: string;
  version: string;
  icon: string;
  directoryName?: string;
  directoryHandle?: FileSystemDirectoryHandle;
}
