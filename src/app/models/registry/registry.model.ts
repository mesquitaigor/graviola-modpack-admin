import ItemModel from '../item/item.model';
import LangModel from '../lang/lang.model';
import ItemTagModel from '../item-tag/item-tag.model';
import ItemTextureModel from '../item-texture/item-texture.model';

export default class RegistryModel {
  items?: ItemModel[];
  itemTextures?: ItemTextureModel[];
  itemTags?: ItemTagModel[];

  id?: string;
  modId?: string;
  mcVersion?: string;
  version?: string;
  name?: string;
  namespace?: string;
  langs?: LangModel[];
  updatedAt?: Date;
  createdAt?: Date;
  entries?: {
    items: [
      {
        id: string;
        name: string;
      },
    ];
  };
}
