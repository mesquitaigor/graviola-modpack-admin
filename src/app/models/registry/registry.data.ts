import type { ItemData } from '../item/item.data';
import type LangData from '../lang/lang.data';
import type ItemTagData from '../item-tag/item-tag.data';
import type ItemTextureData from '../item-texture/item-texture.data';

export default interface RegistryData {
  items?: ItemData[];
  itemTextures?: ItemTextureData[];
  itemTags?: ItemTagData[];

  id?: string;
  version?: string;
  namespace?: string;
  name?: string;
  langs?: LangData[];

  mcVersion?: string;
  createdAt?: string;
  updatedAt?: string;
  modId?: string;
  entries?: {
    items?: [
      {
        id: string;
        name: string;
      },
    ];
  };
}
