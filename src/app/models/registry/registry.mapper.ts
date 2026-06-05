import ItemMapper from '../item/item.mapper';
import type RegistryData from './registry.data';
import LangFileMapper from '../lang-file/lang-file.mapper';
import ItemTagMapper from '../item-tag/item-tag.mapper';
import ItemTextureMapper from '../item-texture/item-texture.mapper';
import RegistryModel from './registry.model';

export default class RegistryMapper {
  static toData(registry: RegistryModel): RegistryData {
    const data: RegistryData = {};

    if (registry.id !== undefined) {
      data.id = registry.id;
    }

    if (registry.namespace !== undefined) {
      data.namespace = registry.namespace;
    }

    if (registry.name !== undefined) {
      data.name = registry.name;
    }

    if (registry.version !== undefined) {
      data.version = registry.version;
    }

    if (registry.items !== undefined) {
      data.items = registry.items.map((item) => {
        return ItemMapper.toData(item);
      });
    }

    if (registry.itemTextures !== undefined) {
      data.itemTextures = registry.itemTextures.map((texture) => {
        return ItemTextureMapper.toData(texture);
      });
    }

    if (registry.itemTags !== undefined) {
      data.itemTags = registry.itemTags.map((tag) => {
        return ItemTagMapper.toData(tag);
      });
    }

    if (registry.langsFiles !== undefined) {
      data.langFiles = registry.langsFiles.map((lang) => {
        return LangFileMapper.toData(lang);
      });
    }

    return data;
  }
  static toModel(data: RegistryData): RegistryModel {
    const model = new RegistryModel();
    model.id = data.id;
    model.version = data.version;
    model.name = data.name;
    model.namespace = data.namespace;
    model.items = data.items?.map((itemData) => {
      return ItemMapper.toModel(itemData);
    });
    model.itemTextures = data.itemTextures?.map((textureData) => {
      return ItemTextureMapper.toModel(textureData);
    });
    model.itemTags = data.itemTags?.map((tagData) => {
      return ItemTagMapper.toModel(tagData);
    });
    model.langsFiles = data.langFiles?.map((langData) => {
      return LangFileMapper.toModel(langData);
    });
    return model;
  }
}
