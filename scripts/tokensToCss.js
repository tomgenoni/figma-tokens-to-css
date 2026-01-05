import fs from 'fs';
import path from 'path';
import {
  SYSTEM_PREFIX,
  CSS_FILENAME,
  GRADIENT_PERCENT,
  FILE_WARNING,
  loadTokenFile,
  loadCollectionFiles,
  flattenTokens,
  processFontFamily,
  getGeneratedStylesDir,
  createCssVariable,
  processValue,
} from './shared.js';

const DARK_THEME_SELECTOR = '[data-theme="dark"]';

let css = `${FILE_WARNING}

:root {
  /* Colors */
`;

// Load all tokens for reference resolution
const paletteColors = loadTokenFile('palettes.value.tokens.json');
const lightColors = loadCollectionFiles('mode', 'light');
const darkColors = loadCollectionFiles('mode', 'dark');
const allTokens = { ...paletteColors, ...lightColors, ...darkColors };

const lightTokens = flattenTokens(lightColors, '', allTokens);
const darkTokens = flattenTokens(darkColors, '', allTokens);

// Generate light mode variables
for (const [key, tokenData] of Object.entries(lightTokens)) {
  const darkTokenData = darkTokens[key];
  if (darkTokenData) {
    css += createCssVariable(key, tokenData.value, '', SYSTEM_PREFIX);

    if (key.toLowerCase().includes('chart')) {
      const gradientValue = `linear-gradient(${tokenData.value}${GRADIENT_PERCENT}, ${tokenData.value}), #ffffff`;
      css += createCssVariable(`${key}-gradient`, gradientValue, '', SYSTEM_PREFIX);
    }
  }
}

css += '\n  /* Dimension */\n';
const dimensionTokens = flattenTokens(loadCollectionFiles('dimension', 'value'));
for (const [key, tokenData] of Object.entries(dimensionTokens)) {
  if (key.startsWith('elevation-')) {
    continue;
  }
  const processed = processValue(tokenData.value, tokenData.type);
  css += createCssVariable(key, processed.value, processed.comment, SYSTEM_PREFIX);
}

css += '\n  /* Elevation */\n';
for (const [key, tokenData] of Object.entries(dimensionTokens)) {
  if (key.startsWith('elevation-')) {
    css += createCssVariable(key, tokenData.value, '', SYSTEM_PREFIX);
  }
}

css += '\n  /* Type */\n';
const typeTokens = flattenTokens(loadCollectionFiles('type', 'value'));
for (const [key, tokenData] of Object.entries(typeTokens)) {
  if (key.includes('family')) {
    // Transform 'family-*' to 'font-*' to match expected output format
    const fontKey = key.replace('family-', 'font-');
    css += createCssVariable(fontKey, processFontFamily(tokenData.value), '', SYSTEM_PREFIX);
  } else if (key.includes('weight')) {
    // Transform 'weight-*' to 'font-weight-*'
    const weightKey = key.startsWith('weight-') ? `font-${key}` : key;
    css += createCssVariable(weightKey, tokenData.value, '', SYSTEM_PREFIX);
  } else {
    // Handle size and line-height tokens
    const processed = processValue(tokenData.value, tokenData.type);
    // Transform 'size-*' to 'text-size-*' and 'line-height-*' to 'text-line-height-*'
    const textKey = key.startsWith('size-') || key.startsWith('line-height-') ? `text-${key}` : key;
    css += createCssVariable(textKey, processed.value, processed.comment, SYSTEM_PREFIX);
  }
}

// Process text styles (heading and mono)
const textStyles = loadTokenFile('text.styles.tokens.json');
const allTypeTokens = { ...typeTokens };

// Process heading styles
if (textStyles.heading) {
  for (const [sizeKey, sizeValue] of Object.entries(textStyles.heading)) {
    for (const [weightKey, style] of Object.entries(sizeValue)) {
      if (style.$type === 'typography' && style.$value) {
        const baseKey = `heading-${sizeKey}`;

        // Extract fontSize
        if (style.$value.fontSize) {
          const fontSize = style.$value.fontSize.startsWith('{')
            ? resolveTypographyReference(style.$value.fontSize, allTypeTokens)
            : style.$value.fontSize;
          const processed = processValue(fontSize, 'dimension');
          css += createCssVariable(`${baseKey}-size`, processed.value, processed.comment, SYSTEM_PREFIX);
        }

        // Extract lineHeight
        if (style.$value.lineHeight) {
          const lineHeight = style.$value.lineHeight.startsWith('{')
            ? resolveTypographyReference(style.$value.lineHeight, allTypeTokens)
            : style.$value.lineHeight;
          const processed = processValue(lineHeight, 'dimension');
          css += createCssVariable(`${baseKey}-line-height`, processed.value, processed.comment, SYSTEM_PREFIX);
        }
      }
    }
  }
}

// Helper function to resolve typography token references
function resolveTypographyReference(ref, tokens) {
  if (typeof ref === 'string' && ref.startsWith('{') && ref.endsWith('}')) {
    const path = ref.slice(1, -1);
    const tokenKey = path.replace(/\./g, '-');
    return tokens[tokenKey]?.value || ref;
  }
  return ref;
}

css += `}\n\n/* Dark mode selectors and variables */\n${DARK_THEME_SELECTOR} {\n`;

// Generate dark mode variables
for (const [key, tokenData] of Object.entries(darkTokens)) {
  const lightTokenData = lightTokens[key];
  if (lightTokenData) {
    css += createCssVariable(key, tokenData.value, '', SYSTEM_PREFIX);

    if (key.toLowerCase().includes('chart')) {
      const gradientValue = `linear-gradient(${tokenData.value}${GRADIENT_PERCENT}, ${tokenData.value}), #ffffff`;
      css += createCssVariable(`${key}-gradient`, gradientValue, '', SYSTEM_PREFIX);
    }
  }
}

css += '}\n\n@media (prefers-color-scheme: dark) {\n  :root {\n';

// Generate prefers-color-scheme dark variables
for (const [key, tokenData] of Object.entries(darkTokens)) {
  const lightTokenData = lightTokens[key];
  if (lightTokenData) {
    css += `  ${createCssVariable(key, tokenData.value, '', SYSTEM_PREFIX)}`;

    if (key.toLowerCase().includes('chart')) {
      const gradientValue = `linear-gradient(${tokenData.value}${GRADIENT_PERCENT}, ${tokenData.value}), #ffffff`;
      css += `  ${createCssVariable(`${key}-gradient`, gradientValue, '', SYSTEM_PREFIX)}`;
    }
  }
}

css += '  }\n}';

const outputPath = path.join(getGeneratedStylesDir(), CSS_FILENAME);
fs.writeFileSync(outputPath, css);

console.log('Design tokens have been converted to CSS variables');
