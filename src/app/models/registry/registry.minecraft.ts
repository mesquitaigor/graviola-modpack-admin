import type { ItemData } from '../item/item.data';
import type RegistryData from './registry.data';

export const ITENS_VANILLA: ItemData[] = [
  { id: 'minecraft:acacia_boat', icon: 'acacia_boat.png', name: 'Acacia Boat' },
];

export const MINECRAFT_REGISTRY: RegistryData = {
  namespace: 'minecraft',
  name: 'Minecraft',
  versions: [
    {
      mcVersion: '1.20.1',
      value: '1.20.1',
      items: ITENS_VANILLA,
    },
  ],
  items: ITENS_VANILLA,
};
