import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.farmacomas.control',
  appName: 'Farmacomas Control',
  webDir: 'www',
  server: {
    androidScheme: 'https',
  },
};

export default config;
