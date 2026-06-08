import ItemMapper from '../item/item.mapper';
import type RegistryData from './registry.data';
import LangMapper from '../lang/lang.mapper';
import ItemTagMapper from '../item-tag/item-tag.mapper';
import ItemTextureMapper from '../item-texture/item-texture.mapper';
import RegistryModel from './registry.model';
import VersionMapper from '../version/version.mapper';

export default class RegistryMapper {
  static toCreateData(registry: RegistryModel): RegistryData {
    registry.id = crypto.randomUUID();
    if (!registry.modId) {
      registry.modId = crypto.randomUUID();
    }
    if (!registry.createdAt) {
      registry.createdAt = new Date();
    }
    if (!registry.versions?.length) {
      const version = VersionMapper.createEmpty();
      registry.versions?.push(version);
    }
    return RegistryMapper.toData(registry);
  }

  static toData(registry: RegistryModel): RegistryData {
    const data: RegistryData = {};
    data.id = registry.id;
    data.namespace = registry.namespace;
    data.name = registry.name;
    data.modId = registry.modId;
    data.createdAt = registry.createdAt?.toISOString();
    data.updatedAt = registry.updatedAt?.toISOString();

    if (registry.versions !== undefined) {
      data.versions = registry.versions.map((v) => VersionMapper.toData(v));
    }

    if (registry.items !== undefined) {
      data.items = registry.items.map((item) => ItemMapper.toData(item));
    }

    if (registry.itemTextures !== undefined) {
      data.itemTextures = registry.itemTextures.map((texture) => ItemTextureMapper.toData(texture));
    }

    if (registry.itemTags !== undefined) {
      data.itemTags = registry.itemTags.map((tag) => ItemTagMapper.toData(tag));
    }

    if (registry.langs !== undefined) {
      data.langs = registry.langs.map((lang) => LangMapper.toData(lang));
    }

    return data;
  }

  static toModel(data: RegistryData): RegistryModel {
    const model = new RegistryModel();
    model.id = data.id;
    model.name = data.name;
    model.namespace = data.namespace;
    model.modId = data.modId;
    if (data.createdAt) {
      model.createdAt = new Date(data.createdAt);
    }
    if (data.updatedAt) {
      model.updatedAt = new Date(data.updatedAt);
    }

    if (data.versions !== undefined) {
      model.versions = data.versions.map((v) => {
        return VersionMapper.toModel(v);
      });
    }

    model.items = data.items?.map((itemData) => ItemMapper.toModel(itemData));
    model.itemTextures = data.itemTextures?.map((textureData) =>
      ItemTextureMapper.toModel(textureData),
    );
    model.itemTags = data.itemTags?.map((tagData) => ItemTagMapper.toModel(tagData));
    model.langs = data.langs?.map((langData) => LangMapper.toModel(langData));

    return model;
  }
}
