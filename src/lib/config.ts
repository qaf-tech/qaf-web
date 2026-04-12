export const config = {
  wsUrl: process.env.NEXT_PUBLIC_WS_URL!,
  apiUrl: process.env.NEXT_PUBLIC_API_URL!,
  appName: process.env.NEXT_PUBLIC_APP_NAME!,
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION!,
} as const;
