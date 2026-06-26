/** @type {import('lint-staged').Configuration} */
export default {
  "*.{js,jsx,ts,tsx,mjs,cjs,mts}": ["prettier --write", "eslint --fix"],
  "*.{json,md,yml,yaml,css,scss,html}": ["prettier --write"],
};
