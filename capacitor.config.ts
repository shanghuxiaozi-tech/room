import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.curtainai.measure',
  appName: 'AI Curtain Measure',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos'],
    },
  },
};

export default config;
