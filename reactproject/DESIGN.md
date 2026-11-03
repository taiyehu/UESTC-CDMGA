# Typography / UI baseline

Source: `@dsh-ui/tokens@0.1.0` (DSH Design System tokens, MIT).

Imported in `src/main.tsx` as `@dsh-ui/tokens/index.css`.

## Type scale used

| Token | Size / line-height | Use |
|---|---|---|
| `xxxs-11` | 11 / 14 | eyebrow, tiny status, mobile nav labels |
| `xxs-12` | 12 / 18 | metadata labels, table headers |
| `xs-13` | 13 / 20 | form labels, compact controls |
| `s-14` | 14 / 22 | body/UI default, buttons, nav |
| `base-16` | 16 / 24 | article body, inputs, primary reading |
| `l-20` | 20 / 28 | card title |
| `xl-24` | 24 / 32 | section title |

Hero display follows Material 3: `displaySmall 36/44` desktop; mobile 30/36. No body text below 14px.

The implementation is the final "Typography + readability layer" in `src/styles.css`.
