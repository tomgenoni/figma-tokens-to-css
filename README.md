# Design Token Testing

This repo demonstrates how to manually export tokens from Figma and convert to CSS and Tailwind for testing purposes in React. This is not meant as a long-term meath for managing design tokens.

## Design tokens

All important design decisions — the color, sizing, and spacing of components — are captured in
Figma variables. These variables are exported from Figma as JSON and converted by scripts into CSS
variables and a Tailwind configuration imported by Next.js and Storybook to render the components
and layouts.

The collections in the Figma file consist primarily of semantic, shared, general purpose variables
for use on colors, backgrounds, borders, spacing, sizing and border radii. There are also a handful
of component-specific variables that are not meant to be used by any other component. For example, a
unique `max-width` value on the `Tooltip`.

### Converting Figma variables to code

Syncing Figma variables with code is a simple, but manual, process.

1. In the Figma pdl file, open the
   [Design Token Manager](https://www.figma.com/community/plugin/1263743870981744253/design-tokens-manager)
   Figma plugin. This plugin outputs tokens in the
   [Design Tokens Format Module](https://www.designtokens.org/tr/drafts/format/), which is the
   proposed and emerging standard for "exchanging design tokens between different tools."
2. Click the blue "Export Tokens" button. The JSON output will show inside the plugin.
3. Click the Download icon and save the zip file to your computer.
4. Unzip the file and copy the resulting "design-tokens" directory into `src` directory, overwriting
   the existing directory.

### Programmatically generating CSS and Tailwind config

Run `npm run build-pdl`. This executes two scripts:

1. `tokensToCSS.js` outputs the CSS variables in `src/styles/generated/pdl.css`
2. `tokensToTailwind.js` outputs a Tailwind v4 configuration file to
   `src/styles/generated/tailwind-pdl.css`

**Important:** Because these files are programmatically generated they should not be edited
manually.

These scripts are custom and may need adjustments as new variable are added. A future enhancement is
to use [Tokens Studio](https://tokens.studio/plugin) to manage the tokens with proper version
control and [Style Dictionary](https://styledictionary.com/) to convert the tokens to CSS variables.
This is the "standard" way to manage and convert tokens but does require a fair amount of overhead
and is arguably unnecessary for smaller projects with only one consumer.

### Using tokens in JS

In some cases you may need to use values from the JSON in your React files. For example, values used
with `floating-ui` for animation are needed as JavaScript variables. In `useFloatingTransitions.ts`
we want to grab the values for animation duration and scale.

```js
import dimensionTokens from '../../design-tokens/dimension.value.tokens.json';
const ANIMATION_DURATION = parseInt(dimensionTokens.transition.duration.base.$value);
const ANIMATION_SCALE = parseFloat(dimensionTokens.transition.scale.base.$value);
```

First we import the token file we need, usually will be `dimension.value.tokens.json`. Then assign
them to local constants and convert the value as needed.

1. `dimensionTokens.transition.duration.base.$value` is a string `100ms` and we use `parseInt()` to
   convert it to the number `100`.
2. `dimensionTokens.transition.scale.base.$value` is a string `.98` and we use `parseFloat()` to
   convert the type to a `number`.

## Tailwind

The configuration of Tailwind happens in two CSS files.

1. [`src/styles/tailwind-categories.css`](src/styles/tailwind-categories.css)
2. [`src/styles/generated/tailwind-pdl.css`](src/styles/generated/tailwind-pdl.css)

By default Tailwind will include all the utility classes through what it calls
["theme variable namespaces"](https://tailwindcss.com/docs/theme#theme-variable-namespaces). The
first file determines which of these Tailwind namespaces are enabled or disabled. The second file
appends custom utility classes in a namespace in order to align with the design system. See the next
section for more details.

Note: we're using two files because the first can be managed manually, the second is generated
programmatically based on the Figma variables.

#### Disabled namespaces

Tailwind includes many classes for color, like `bg-sky-500`. Because we only want the brand
colors available, and we need to support dark mode, we can disable this category by setting it to
`initial`. This prevents Tailwind from generating like `bg-sky-500`.

```css
@theme {
  --color-*: initial;
}
```

Most categories have been disabled, but to support current usage in the React app some
categories are enabled and some are appended to.

#### Appending to namespaces

In order to add the custom spacing names and values to Tailwind we're generating the
`tailwind-pdl.css` described above.

```css
@theme {
  ...
  --spacing-sm: 0.75rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.25rem;
  ...
}
```

With this configuration Tailwind makes available new utility classes that also support responsive
prefixes. For example, instead of the syntax using numbers `pb-2 md:pb-4`, you use the t-shirt scale
`pb-sm md:pb-lg`. Since Figma will be using that same scale there is no context switching required.

Additionally, by using the
[IntelliSense for VS Code](https://tailwindcss.com/docs/editor-setup#intellisense-for-vs-code)
extension these new classes will autocomplete in your code editor.
