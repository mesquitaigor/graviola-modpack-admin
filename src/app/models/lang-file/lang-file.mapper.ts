import LangFileData from './lang-file.data';
import LangFileModel from './lang-file.model';

export default class LangFileMapper {
  static toData(lang: LangFileModel): LangFileData {
    return {
      locale: lang.locale,
      values: lang.values ? { ...lang.values } : undefined,
    };
  }

  static toModel(data: LangFileData): LangFileModel {
    const model = new LangFileModel();
    model.locale = data.locale;
    model.values = data.values ? { ...data.values } : undefined;
    return model;
  }
}
