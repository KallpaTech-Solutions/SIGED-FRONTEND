/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          unas: {
            green: '#00843D', // Verde oficial UNAS
            dark: '#00632d',
            light: '#e6f4ea'
          },
          // Variables CSS personalizadas para el tema UNAS
          background: 'hsl(var(--background))',
          foreground: 'hsl(var(--foreground))',
          card: 'hsl(var(--card))',
          'card-foreground': 'hsl(var(--card-foreground))',
          popover: 'hsl(var(--popover))',
          'popover-foreground': 'hsl(var(--popover-foreground))',
          primary: 'hsl(var(--primary))',
          'primary-foreground': 'hsl(var(--primary-foreground))',
          'primary-50': 'hsl(var(--primary-50))',
          'primary-100': 'hsl(var(--primary-100))',
          'primary-600': 'hsl(var(--primary-600))',
          'primary-700': 'hsl(var(--primary-700))',
          'primary-800': 'hsl(var(--primary-800))',
          secondary: 'hsl(var(--secondary))',
          'secondary-foreground': 'hsl(var(--secondary-foreground))',
          'secondary-600': 'hsl(var(--secondary-600))',
          accent: 'hsl(var(--accent))',
          'accent-foreground': 'hsl(var(--accent-foreground))',
          success: 'hsl(var(--success))',
          'success-foreground': 'hsl(var(--success-foreground))',
          muted: 'hsl(var(--muted))',
          'muted-foreground': 'hsl(var(--muted-foreground))',
          destructive: 'hsl(var(--destructive))',
          'destructive-foreground': 'hsl(var(--destructive-foreground))',
          border: 'hsl(var(--border))',
          input: 'hsl(var(--input))',
          ring: 'hsl(var(--ring))',
        },
        borderRadius: {
          DEFAULT: 'var(--radius)',
        },
      },
    },
    plugins: [],
  }