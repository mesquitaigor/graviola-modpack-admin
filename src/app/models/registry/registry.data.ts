import type { ItemData } from '../item/item.data';
import type LangData from '../lang/lang.data';
import type ItemTagData from '../item-tag/item-tag.data';
import type ItemTextureData from '../item-texture/item-texture.data';
import type { VersionData } from '../version/version.data';

export default interface RegistryData {
  items?: ItemData[];
  itemTextures?: ItemTextureData[];
  itemTags?: ItemTagData[];

  id?: string;
  namespace?: string;
  name?: string;
  langs?: LangData[];
  versions?: VersionData[];
  createdAt?: string;
  updatedAt?: string;
  modId?: string;
}
