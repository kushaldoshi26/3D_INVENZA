/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'brand-cyan': '#00f2ff',
                'brand-purple': '#7000ff',
                'brand-deep': '#050508',
                'accent': '#00f2ff',
                'muted': '#94a3b8',
            },
            fontFamily: {
                'tech': ['Orbitron', 'sans-serif'],
                'main': ['Space Grotesk', 'sans-serif'],
            }
        },
    },
    plugins: [],
};
