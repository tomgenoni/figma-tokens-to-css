import fs from 'fs';
import path from 'path';
import {
  FILE_WARNING,
  loadCollectionFiles,
  flattenTokens,
  processFontFamily,
  getGeneratedStylesDir,
  createCssVariable,
  processValue,
} from './shared.js';

// Configuration for token processing
const tokenConfig = [
  {
    collection: 'dimension',
    comment: 'Spacing and breakpoints',
    filter: (key) => key.includes('spacing') || key.includes('breakpoint'),
    transform: (key, tokenData) => {
      const processed = processValue(tokenData.value, tokenData.type);
      return { key, value: processed.value, comment: processed.comment };
    },
  },
  {
    collection: 'type',
    comment: 'Fonts',
    filter: (key) => key.includes('family'),
    transform: (key, tokenData) => {
      // Transform 'family-*' to 'font-*' to match expected output format
      const fontKey = key.replace('family-', 'font-');
      return { key: fontKey, value: processFontFamily(tokenData.value) };
    },
  },
];

// Process tokens and generate CSS
function processTokens(config) {
  const tokens = flattenTokens(loadCollectionFiles(config.collection, 'value'));
  return Object.entries(tokens)
    .filter(([key]) => config.filter(key))
    .map(([key, tokenData]) => config.transform(key, tokenData));
}

// Generate CSS
let css = `${FILE_WARNING}

@import 'tailwindcss';

@theme {
`;

for (const config of tokenConfig) {
  css += `  /* ${config.comment} */\n`;
  const processedTokens = processTokens(config);
  for (const { key, value, comment } of processedTokens) {
    css += createCssVariable(key, value, comment);
  }
  css += '\n';
}

css += '}\n';

// Write output
const outputPath = path.join(getGeneratedStylesDir(), 'tailwind-pdl.css');
fs.writeFileSync(outputPath, css);

console.log('Design tokens have been converted to Tailwind variables');
