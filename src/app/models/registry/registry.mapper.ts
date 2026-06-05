import ItemMapper from '../item/item.mapper';
import type RegistryData from './registry.data';
import LangMapper from '../lang/lang.mapper';
import ItemTagMapper from '../item-tag/item-tag.mapper';
import ItemTextureMapper from '../item-texture/item-texture.mapper';
import RegistryModel from './registry.model';

export default class RegistryMapper {
  static toData(registry: RegistryModel): RegistryData {
    const data: RegistryData = {};
    data.id = registry.id;
    data.namespace = registry.namespace;
    data.name = registry.name;
    data.version = registry.version;
    data.mcVersion = registry.mcVersion;
    data.modId = registry.modId;
    data.createdAt = registry.createdAt?.toISOString();
    data.updatedAt = registry.updatedAt?.toISOString();

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

    if (registry.langs !== undefined) {
      data.langs = registry.langs.map((lang) => {
        return LangMapper.toData(lang);
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
    model.mcVersion = data.mcVersion;
    model.modId = data.modId;
    if (data.createdAt) {
      model.createdAt = new Date(data.createdAt);
    }
    if (data.updatedAt) {
      model.updatedAt = new Date(data.updatedAt);
    }
    model.items = data.items?.map((itemData) => {
      return ItemMapper.toModel(itemData);
    });
    model.itemTextures = data.itemTextures?.map((textureData) => {
      return ItemTextureMapper.toModel(textureData);
    });
    model.itemTags = data.itemTags?.map((tagData) => {
      return ItemTagMapper.toModel(tagData);
    });
    model.langs = data.langs?.map((langData) => {
      return LangMapper.toModel(langData);
    });
    return model;
  }
}
