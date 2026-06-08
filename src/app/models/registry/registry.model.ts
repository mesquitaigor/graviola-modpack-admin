import ItemModel from '../item/item.model';
import LangModel from '../lang/lang.model';
import ItemTagModel from '../item-tag/item-tag.model';
import ItemTextureModel from '../item-texture/item-texture.model';
import type { VersionModel } from '../version/version.model';

export default class RegistryModel {
  items?: ItemModel[];
  itemTextures?: ItemTextureModel[];
  itemTags?: ItemTagModel[];

  id?: string;
  modId?: string;
  name?: string;
  namespace?: string;
  langs?: LangModel[];
  versions?: VersionModel[];
  updatedAt?: Date;
  createdAt?: Date;
}
