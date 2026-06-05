import { LocalImageToDataUrl } from '../../shared/helpers/ImageToDataUrl';
import { firstValueFrom } from 'rxjs';

export default class ItemModel {
  public id?: string;
  public iconId?: string;
  public name?: string;
  public icon?: string;
  public iconDataUrl?: string;
  public async loadEmbeddedIcon(): Promise<void> {
    if (this.icon) {
      this.iconDataUrl = await firstValueFrom(
        LocalImageToDataUrl(`/assets/textures/item/${this.icon}`),
      );
    }
  }
}
