/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'brand-accent': '#00f2ff',
                'brand-deep': '#050508',
                'brand-elevated': 'rgba(20, 24, 45, 0.6)',
            },
            fontFamily: {
                'tech': ['Orbitron', 'sans-serif'],
                'main': ['Space Grotesk', 'sans-serif'],
            },
            animation: {
                'glow': 'glow 3s infinite',
            },
            keyframes: {
                glow: {
                    '0%, 100%': { boxShadow: '0 0 5px rgba(0, 242, 255, 0.2)' },
                    '50%': { boxShadow: '0 0 20px rgba(0, 242, 255, 0.5)' },
                }
            }
        },
    },
    plugins: [],
}
