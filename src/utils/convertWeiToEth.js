export const convertWeiToEth = (wei) => {
  let ethBal = parseInt(wei, 16);

  return ethBal * Math.pow(10, -18);
};
