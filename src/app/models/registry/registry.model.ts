import ItemModel from '../item/item.model';
import LangFileModel from '../lang-file/lang-file.model';
import ItemTagModel from '../item-tag/item-tag.model';
import ItemTextureModel from '../item-texture/item-texture.model';

export default class RegistryModel {
  id?: number;
  version?: string;
  name?: string;
  namespace?: string;
  items?: ItemModel[];
  itemTextures?: ItemTextureModel[];
  itemTags?: ItemTagModel[];
  langsFiles?: LangFileModel[];
}
