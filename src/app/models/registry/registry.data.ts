import type { ItemData } from '../item/item.data';
import type LangFileData from '../lang-file/lang-file.data';
import type ItemTagData from '../item-tag/item-tag.data';
import type ItemTextureData from '../item-texture/item-texture.data';

export default interface RegistryData {
  id?: number;
  version?: string;
  namespace?: string;
  name?: string;
  items?: ItemData[];
  itemTextures?: ItemTextureData[];
  itemTags?: ItemTagData[];
  langFiles?: LangFileData[];
}
