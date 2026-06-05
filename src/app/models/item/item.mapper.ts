import type { ItemData } from './item.data';
import ItemModel from './item.model';

export default class ItemMapper {
  static toData(item: ItemModel): ItemData {
    return {
      id: item.id,
      icon: item.icon,
      iconDataUrl: item.iconDataUrl,
      iconId: item.iconId,
      name: item.name,
    };
  }
  static toModel(data: ItemData): ItemModel {
    const model = new ItemModel();
    model.id = data.id;
    model.icon = data.icon;
    model.iconDataUrl = data.iconDataUrl;
    model.iconId = data.iconId;
    model.name = data.name;
    return model;
  }
}
