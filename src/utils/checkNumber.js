export const checkNumber = (value) =>
  value
    .replace(',', '.')
    .replace(/[^\d\.]/g, '')
    .replace(/\./, 'x')
    .replace(/\./g, '')
    .replace(/x/, '.');
