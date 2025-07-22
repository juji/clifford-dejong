import { StyleSheet } from 'react-native';

// Theme-aware styles
export const getThemeStyles = (isDarkMode: boolean) => {
  const colors = {
    background: isDarkMode ? '#000000' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    textSecondary: isDarkMode ? '#cccccc' : '#666666',
  };

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContainer: {
      padding: 16,
    },
    heading: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 16,
      marginTop: 54,
      color: colors.text,
    },
    paragraph: {
      fontSize: 16,
      lineHeight: 24,
      marginBottom: 8,
      color: colors.textSecondary,
    },
  });
};

// Keep the original export for backward compatibility (but now it's light theme only)
export const appStyles = getThemeStyles(false);
