import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const AppPreset = definePreset(Aura, {
  primitive: {
    emerald: {
      50: '#ecf9f1',
      100: '#d9f2e3',
      200: '#b3e6c8',
      300: '#8cd9ac',
      400: '#66cc91',
      500: '#40bf75',
      600: '#33995e',
      700: '#267346',
      800: '#194d2f',
      900: '#0d2617',
      950: '#091b10',
    },
    platinum: {
      50: '#f2f2f2',
      100: '#e6e6e6',
      200: '#cccccc',
      300: '#b3b3b3',
      400: '#999999',
      500: '#808080',
      600: '#666666',
      700: '#4d4d4d',
      800: '#333333',
      900: '#1a1a1a',
      950: '#121212',
    },
  },
  semantic: {
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '{platinum.50}',
          100: '{platinum.100}',
          200: '{platinum.200}',
          300: '{platinum.300}',
          400: '{platinum.400}',
          500: '{platinum.500}',
          600: '{platinum.600}',
          700: '{platinum.700}',
          800: '{platinum.800}',
          900: '{platinum.900}',
          950: '{platinum.950}',
        },
      },
    },
  },
});
