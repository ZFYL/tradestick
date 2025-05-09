import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      background: string;
      foreground: string;
      primary: string;
      secondary: string;
      accent: string;
      buy: string;
      sell: string;
      chart: {
        background: string;
        grid: string;
        text: string;
      }
    }
  }
}
