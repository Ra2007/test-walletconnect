export const checkAddress = (adr) => {
  const address = adr.toLowerCase();
  const hex = address.substring(0, 2) === '0x' ? address.substring(2) : address;
  const checkHex = new RegExp(/^[a-fA-F0-9]{40}$/, 'g');

  return checkHex.test(hex) ? '0x' + hex : false;
};
