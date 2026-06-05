import type ItemTagData from './item-tag.data';
import ItemTagModel from './item-tag.model';

export default class ItemTagMapper {
  static toData(tag: ItemTagModel): ItemTagData {
    return {
      tagId: tag.tagId,
      values: tag.values ? [...tag.values] : undefined,
    };
  }

  static toModel(data: ItemTagData): ItemTagModel {
    const model = new ItemTagModel();
    model.tagId = data.tagId;
    model.values = data.values ? [...data.values] : undefined;
    return model;
  }
}
