# Token Template

## CSS Variables (globals)

```css
:root {
  --color-bg: 255 255 255;
  --color-fg: 17 24 39;
  --color-accent: 14 116 144;
  --radius-md: 0.75rem;
  --shadow-soft: 0 10px 30px rgba(0, 0, 0, 0.08);
}
```

## Tailwind Theme Mapping

```js
// tailwind.config.js
extend: {
  colors: {
    bg: 'rgb(var(--color-bg) / <alpha-value>)',
    fg: 'rgb(var(--color-fg) / <alpha-value>)',
    accent: 'rgb(var(--color-accent) / <alpha-value>)'
  },
  borderRadius: {
    md: 'var(--radius-md)'
  },
  boxShadow: {
    soft: 'var(--shadow-soft)'
  }
}
```

## Primitive Contract Example

- `Button`
- Variants: `primary`, `secondary`, `ghost`, `danger`
- Sizes: `sm`, `md`, `lg`
- States: default, hover, focus-visible, disabled, loading
