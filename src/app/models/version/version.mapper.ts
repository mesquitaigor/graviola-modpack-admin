import ItemMapper from '../item/item.mapper';
import LangMapper from '../lang/lang.mapper';
import { MINECRAFT_VERSIONS } from '../modpack/minecraft-versions';
import type { VersionData } from './version.data';
import { VersionModel } from './version.model';

export default class VersionMapper {
  static createEmpty(): VersionModel {
    const version = new VersionModel();
    version.id = crypto.randomUUID();
    version.value = '0.0.0';
    version.mcVersion = MINECRAFT_VERSIONS[0] as string | undefined;
    return version;
  }
  static toData(model: VersionModel): VersionData {
    return {
      id: model.id,
      value: model.value,
      mcVersion: model.mcVersion,
      entries: model.entries,
      items: model.items?.map((item) => ItemMapper.toData(item)),
      langs: model.langs?.map((lang) => LangMapper.toData(lang)),
    };
  }
  static toModel(data: VersionData): VersionModel {
    const version = new VersionModel();
    version.id = data.id;
    version.value = data.value;
    version.mcVersion = data.mcVersion;
    version.entries = data.entries;
    version.items = data.items?.map((itemData) => ItemMapper.toModel(itemData)) ?? [];
    version.langs = data.langs?.map((langData) => LangMapper.toModel(langData));
    return version;
  }
}
