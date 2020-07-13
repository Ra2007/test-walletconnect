import axios from 'axios';

const api = axios.create({
  baseURL: 'https://ropsten.infura.io',
  timeout: 30000, // 30 secs
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

export async function apiGetAccountAssets(address) {
  const response = await api.post(`/v3/57e4a16cfc0e46d9aa036d2d0b5dbdba`, {
    jsonrpc: '2.0',
    method: 'eth_getBalance',
    params: [address, 'latest'],
    id: 1,
  });
  const { result } = response.data;
  return result;
}

export async function apiGetGasPrices() {
  const response = await api.post(`/v3/57e4a16cfc0e46d9aa036d2d0b5dbdba`, {
    jsonrpc: '2.0',
    method: 'eth_gasPrice',
    params: [],
    id: 1,
  });
  const { result } = response.data;
  return result;
}
