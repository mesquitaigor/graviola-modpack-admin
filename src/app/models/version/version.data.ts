import type { ItemData } from '../item/item.data';
import type LangData from '../lang/lang.data';

export class VersionData {
  public id?: string;
  public mcVersion?: string;
  public value?: string;
  public entries?: {
    items: { id: string; name: string }[];
  };
  public items?: ItemData[];
  public langs?: LangData[];
}
