module.exports = {
    root: true,
    env: {
      browser: true,
      es2021: true,
      node: true
    },
    extends: [
      'plugin:vue/vue3-recommended',
      'airbnb-base',
      'plugin:@typescript-eslint/recommended'
    ],
    parser: 'vue-eslint-parser',
    parserOptions: {
      parser: '@typescript-eslint/parser',
      ecmaVersion: 2021,
      sourceType: 'module'
    },
    plugins: ['vue', '@typescript-eslint'],
    settings: {
      'import/resolver': {
        typescript: {}
      }
    },
    rules: {
      // Vue specific rules
      'vue/multi-word-component-names': 'off',
      'vue/html-self-closing': ['error', {
        html: {
          void: 'always',
          normal: 'never',
          component: 'always'
        }
      }],
      
      // TypeScript rules
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      
      // General JavaScript rules
      'import/prefer-default-export': 'off',
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'never',
          jsx: 'never',
          ts: 'never',
          tsx: 'never',
          vue: 'never'
        }
      ],
      'max-len': ['error', { code: 120, ignoreUrls: true }],
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
    }
  }