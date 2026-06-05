type FileSystemPermissionMode = 'read' | 'readwrite';

interface FileSystemPermissionDescriptor {
  mode?: FileSystemPermissionMode;
}

interface FileSystemHandlePermissionDescriptor {
  mode?: FileSystemPermissionMode;
}

interface FileSystemHandle {
  queryPermission(
    descriptor?: FileSystemHandlePermissionDescriptor,
  ): Promise<PermissionState>;
  requestPermission(
    descriptor?: FileSystemHandlePermissionDescriptor,
  ): Promise<PermissionState>;
}

interface ShowDirectoryPickerOptions {
  id?: string;
  mode?: FileSystemPermissionMode;
  startIn?:
    | FileSystemHandle
    | 'desktop'
    | 'documents'
    | 'downloads'
    | 'music'
    | 'pictures'
    | 'videos';
}

interface Window {
  showDirectoryPicker(
    options?: ShowDirectoryPickerOptions,
  ): Promise<FileSystemDirectoryHandle>;
}
