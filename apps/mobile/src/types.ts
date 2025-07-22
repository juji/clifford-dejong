/**
 * Type definitions for the mobile app
 */

export type AppTheme = 'light' | 'dark' | 'system';

export interface AppSettings {
  theme: AppTheme;
  useSystemTheme: boolean;
}
