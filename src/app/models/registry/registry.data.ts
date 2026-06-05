import { ItemData } from '../item/item.data';
import LangFileData from '../lang-file/lang-file.data';
import ItemTagData from '../item-tag/item-tag.data';
import ItemTextureData from '../item-texture/item-texture.data';

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
