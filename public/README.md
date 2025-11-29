# Public Assets

Place static files here. Anything in `public/` is served from the site root.

Examples:
- Logo: `/kaburlu-logo.png`
- Images: `/images/hero-news.webp`

Usage in code:
```jsx
<img src="/kaburlu-logo.png" alt="Kaburlu" />
```

Usage in CSS:
```css
background-image: url('/images/texture.png');
```

Note: Files in this folder are not processed by Webpack; they are copied as-is.
