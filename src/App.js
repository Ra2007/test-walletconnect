import React, { useState, useEffect, useRef } from 'react';
import { Button, Layout, Row, Col, Typography, Input, Card, Spin } from 'antd';
import { createConnector, checkNumber, checkAddress } from './utils';
import Web3 from 'web3';

const { Header, Content } = Layout;
const { Text } = Typography;

const UPDATE_TIME = 5000;
const API_KEY = '57e4a16cfc0e46d9aa036d2d0b5dbdba';

const initWaletState = {
  connected: false,
  accounts: [],
  address: '',
  addressTo: '',
  amountEth: '',
  erorrTransaction: '',
  hashTransaction: '',
  disabledButton: false,
};

const web3 = new Web3(`https://ropsten.infura.io/v3/${API_KEY}`);

export default function App() {
  const ref = useRef(false);
  const [walletState, handleWalletState] = useState(initWaletState);
  const [balance, handleBalance] = useState(0);
  const [connector, setConnector] = useState(createConnector());

  const changeWalletState = (field, value) => {
    handleWalletState({
      ...walletState,
      [field]: value,
    });
  };

  const createNewConnector = async () => {
    const newConnector = createConnector();
    await newConnector.createSession();
    setConnector(newConnector);
    return setEvents(newConnector);
  };

  const createSessionWallet = async () => {
    if (!connector) return createNewConnector();

    if (!connector.connected) {
      await connector.createSession();
    } else {
      addDataWallet(connector.accounts);
    }

    setEvents(connector);
  };

  const addDataWallet = (accounts) => {
    const address = checkAddress(accounts[0]);

    if (address) {
      handleWalletState({
        ...walletState,
        connected: true,
        accounts,
        address,
      });
    } else {
      changeWalletState('erorrTransaction', 'Address not valid');
    }
  };

  const setEvents = (connect) => {
    connect.on('connect', (error, payload) => {
      if (error) {
        throw error;
      }
      connectOn(payload.params[0]);
    });

    connect.on('disconnect', (error, payload) => {
      if (error) {
        throw error;
      }

      handleWalletState(initWaletState);
      setConnector(null);
    });
  };

  const connectOn = (params) => {
    const { accounts } = params;
    addDataWallet(accounts);
  };

  const sendTransaction = async () => {
    handleWalletState({
      ...walletState,
      erorrTransaction: '',
      disabledButton: true,
    });
    const validAddressTo = checkAddress(walletState.addressTo);

    if (!validAddressTo)
      return changeWalletState('erorrTransaction', 'Address not valid');

    const amoutWei = web3.utils.toWei(walletState.amountEth);
    const gasPriceWei = await web3.eth.getGasPrice();
    const lastNonce = await web3.eth.getTransactionCount(walletState.address);

    const tx = {
      from: walletState.address,
      to: validAddressTo,
      data: '0x',
      gasPrice: web3.utils.toHex(gasPriceWei),
      gasLimit: web3.utils.toHex('21000'),
      value: web3.utils.toHex(amoutWei),
      nonce: web3.utils.toHex(lastNonce + 1),
    };

    connector
      .sendTransaction(tx)
      .then((result) => {
        handleWalletState({
          ...walletState,
          hashTransaction: result,
          erorrTransaction: '',
          disabledButton: false,
          amountEth: '',
          addressTo: '',
        });
      })
      .catch((err) => {
        const error = new Error(err);
        handleWalletState({
          ...walletState,
          erorrTransaction: error.message,
          disabledButton: false,
        });
      });
  };

  const disconnectWallet = () => {
    clearTimeout(ref.current);
    connector.killSession();
  };

  useEffect(() => {
    if (walletState.address && ref) {
      ref.current = setTimeout(async function tick() {
        try {
          const balance = await web3.eth.getBalance(walletState.address);

          handleBalance(web3.utils.fromWei(balance));
        } catch (error) {
          console.log(error);
        }

        ref.current = setTimeout(tick, UPDATE_TIME);
      }, 100);
    }
  }, [walletState.address, ref]);

  useEffect(() => {
    return () => {
      setTimeout(() => clearTimeout(ref.current), 1000);
    };
  }, []);

  return (
    <Layout>
      <Header style={{ height: 100 }}></Header>
      <Content>
        <Row>
          <Col span={12} offset={6}>
            <Card
              style={{ margin: 40, height: 300 }}
              title={walletState.address && walletState.address}
              extra={<div>{`${walletState.connected ? 'On' : 'Off'}line`}</div>}
            >
              {!walletState.connected ? (
                <>
                  <Button
                    style={{ marginBottom: 10 }}
                    type='primary'
                    onClick={() => createSessionWallet()}
                  >
                    Create session
                  </Button>
                </>
              ) : (
                <>
                  <Row style={{ marginBottom: 10, height: 50 }}>
                    <Col span={16}>
                      <Text strong style={{ color: '#000' }}>
                        {`Balance ETH: ${balance}`}
                      </Text>
                    </Col>
                    <Col span={6} offset={1}>
                      <Button onClick={() => disconnectWallet()}>
                        Disconnect
                      </Button>
                    </Col>
                  </Row>
                  <Row style={{ marginBottom: 10 }}>
                    <Col span={12}>
                      <Input
                        placeholder='Input to address'
                        value={walletState.addressTo}
                        onChange={(e) =>
                          changeWalletState('addressTo', e.target.value)
                        }
                      />
                    </Col>

                    <Col span={6} offset={1}>
                      <Input
                        placeholder='Amount ETH'
                        value={walletState.amountEth}
                        onChange={(e) =>
                          changeWalletState(
                            'amountEth',
                            checkNumber(e.target.value)
                          )
                        }
                      />
                    </Col>
                  </Row>

                  <Button
                    onClick={() => sendTransaction()}
                    disabled={
                      !(walletState.amountEth && walletState.addressTo) ||
                      walletState.disabledButton
                    }
                    style={{ width: 150 }}
                  >
                    {walletState.disabledButton ? (
                      <Spin size='small' />
                    ) : (
                      'Send transaction'
                    )}
                  </Button>
                  <Row style={{ marginTop: 20 }}>
                    {walletState.erorrTransaction && (
                      <Text type='danger'>{walletState.erorrTransaction}</Text>
                    )}
                    {walletState.hashTransaction && (
                      <Text>{`Hash transaction: ${walletState.hashTransaction}`}</Text>
                    )}
                  </Row>
                </>
              )}
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}
