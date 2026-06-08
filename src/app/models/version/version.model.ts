import type ItemModel from '../item/item.model';
import type LangModel from '../lang/lang.model';

export class VersionModel {
  public id?: string;
  public mcVersion?: string;
  public value?: string;
  public entries?: {
    items: { id: string; name: string }[];
  };
  public items: ItemModel[] = [];
  public langs?: LangModel[];
}
