import type ItemTextureData from './item-texture.data';
import ItemTextureModel from './item-texture.model';

export default class ItemTextureMapper {
  static toData(texture: ItemTextureModel): ItemTextureData {
    return {
      itemId: texture.itemId,
      itemName: texture.itemName,
      imageBlob: texture.imageBlob,
    };
  }

  static toModel(data: ItemTextureData): ItemTextureModel {
    const model = new ItemTextureModel();
    model.itemId = data.itemId;
    model.itemName = data.itemName;
    model.imageBlob = data.imageBlob;
    return model;
  }
}
