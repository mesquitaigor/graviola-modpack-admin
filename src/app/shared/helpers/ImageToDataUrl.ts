import { catchError, from, map, Observable, of, switchMap } from 'rxjs';

const blobToDataUrl = (blob: Blob): Observable<string | undefined> =>
  new Observable<string | undefined>((subscriber) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      subscriber.next(String(reader.result));
      subscriber.complete();
    };

    reader.onerror = () => {
      subscriber.next(undefined);
      subscriber.complete();
    };

    reader.readAsDataURL(blob);
  });

export const LocalImageToDataUrl = (
  imagePath: string,
): Observable<string | undefined> =>
  from(fetch(imagePath)).pipe(
    switchMap((response) => {
      if (!response.ok) {
        return of(undefined);
      }

      return from(response.blob()).pipe(
        switchMap((blob) => blobToDataUrl(blob)),
      );
    }),
    map((dataUrl) => dataUrl ?? undefined),
    catchError(() => of(undefined)),
  );
