const { VaultCss } = require('./packages/vaultcss/dist/index.js');

console.log('Testing VaultCSS...');

const vault = new VaultCss({ valutMediaQuery: true });

const testCSS = `
.test {
  @media (--md) {
    color: red;
  }
}
`;

console.log('Running optimize...');
try {
  const result = vault.optimize(testCSS, { file: 'test.css' });
  console.log('Success!');
  console.log('Result:', result);
} catch (error) {
  console.error('Error:', error.message);
}