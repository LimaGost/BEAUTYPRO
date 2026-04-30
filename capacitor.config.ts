import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mustech.beautypro',
  appName: 'BeautyPro',
  webDir: 'dist',
  server: {
    // Permite que o app nativo carregue conteúdo via HTTPS
    androidScheme: 'https',
  },
  plugins: {
    // Configuração do plugin de contatos
    Contacts: {
      // iOS: a descrição que aparece no popup de permissão do sistema
      iosPermissionUsageDescription: 'BeautyPro precisa acessar seus contatos para importar clientes automaticamente.',
    },
  },
};

export default config;
