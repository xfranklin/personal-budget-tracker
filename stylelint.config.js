export default {
  extends: ['stylelint-config-standard-scss', 'stylelint-config-recommended-vue/scss'],
  ignoreFiles: ['**/dist/**', '**/dev-dist/**', '**/node_modules/**', '**/.wrangler/**'],
  rules: {
    'scss/at-import-partial-extension': null,
    'scss/double-slash-comment-empty-line-before': null,
    'no-empty-source': null,
  },
}
