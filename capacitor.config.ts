import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAP_SERVER_URL || 'http://10.0.2.2:3000';

const config: CapacitorConfig = {
  appId: 'com.harshavardhan.visiontherapy',
  appName: 'Vision Therapy',
  webDir: 'dist-capacitor',
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith('http://'),
  },
};

export default config;
