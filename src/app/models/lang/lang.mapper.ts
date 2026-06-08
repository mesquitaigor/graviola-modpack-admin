import type LangData from './lang.data';
import LangModel from './lang.model';

export default class LangMapper {
  static toData(lang: LangModel): LangData {
    return {
      locale: lang.locale,
      values: lang.values ? { ...lang.values } : undefined,
    };
  }

  static toModel(data: LangData): LangModel {
    const model = new LangModel();
    model.locale = data.locale;
    model.values = data.values ? { ...data.values } : undefined;
    return model;
  }
}
