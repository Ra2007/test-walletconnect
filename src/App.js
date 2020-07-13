import React, { useState, useEffect, useRef } from 'react';
import { Button, Layout, Row, Col, Typography, Input, Card } from 'antd';
import {
  apiGetAccountAssets,
  apiGetGasPrices,
  createConnector,
  convertWeiToEth,
  checkNumber,
} from './utils';

const { Header, Content } = Layout;
const { Text } = Typography;
const UPDATE_TIME = 5000;

const initWaletState = {
  connected: false,
  chainId: '',
  accounts: [],
  address: '',
  addressTo: '',
  amountEth: '',
  erorrTransaction: '',
  hashTransaction: '',
};

export default function App() {
  const [walletState, handleWalletState] = useState(initWaletState);
  const [balance, handleBalance] = useState(0);
  const ref = useRef(false);
  const [connector, setConnector] = useState(createConnector());

  const changeWalletState = (field, value) => {
    console.log(walletState);
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
      console.log(connector);
      await connector.createSession();
    } else {
      handleWalletState({
        ...walletState,
        connected: true,
        chainId: connector.chainId,
        accounts: connector.accounts,
        address: connector.accounts[0],
      });
    }

    setEvents(connector);
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
      console.log(payload);
      handleWalletState(initWaletState);
      setConnector(null);
    });
  };

  const connectOn = (params) => {
    console.log(walletState);
    const { accounts, chainId } = params;
    handleWalletState({
      ...walletState,
      connected: true,
      chainId,
      accounts,
      address: accounts[0],
    });
  };

  const sendTransaction = async () => {
    const hexValue = (+walletState.amountEth).toString(16);
    const gasPrice = await apiGetGasPrices();

    const tx = {
      from: walletState.address,
      to: walletState.addressTo,
      data: '0x',
      gasPrice,
      gas: '0x9c40',
      value: '0x' + hexValue,
      nonce: '0x0114',
    };

    connector
      .sendTransaction(tx)
      .then((result) => {
        handleWalletState({
          ...walletState,
          hashTransaction: result,
          erorrTransaction: '',
          amountEth: '',
          addressTo: '',
        });
        console.log(result);
      })
      .catch((error) => {
        changeWalletState('erorrTransaction', error);
        console.error(error);
      });
  };

  const disconnectWallet = () => {
    clearTimeout(ref.current);
    connector.killSession();
  };

  useEffect(() => {
    if (walletState.address && walletState.chainId && ref) {
      ref.current = setTimeout(async function tick() {
        try {
          console.log('send api');
          const result = await apiGetAccountAssets(walletState.address);
          handleBalance(convertWeiToEth(result));
        } catch (error) {
          console.log(error);
        }

        ref.current = setTimeout(tick, UPDATE_TIME); // (*)
      }, 100);
    }
  }, [walletState.address, walletState.chainId, ref]);

  useEffect(() => {
    return () => {
      setTimeout(() => clearTimeout(ref.current), 1000);
    };
  }, []);

  console.log(connector);
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
                    disabled={!(walletState.amountEth && walletState.addressTo)}
                  >
                    Send transaction
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
