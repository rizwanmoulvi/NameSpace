import React, { useEffect, useState } from 'react';
// import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSquare } from '@fortawesome/free-regular-svg-icons';
import { Link } from 'react-router-dom';
import polygonLogo from '../assets/polygonlogo.svg';
import ethLogo from '../assets/ethlogo.svg';
import { networks } from '../utils/networks';
// import contractAbi from '../utils/DomainFactory.json';

// const CONTRACT_ADDRESS = '0x376343F54fC19fCC383Af473e9Cd2d39Fd5cd0C7';

const Home = () => {
  const [currentAccount, setCurrentAccount] = useState('');
  const [network, setNetwork] = useState('');
  // const navigate = useNavigate();

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert('Get MetaMask -> https://metamask.io/');
        return;
      }

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      console.log('Connected', accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log('Make sure you have metamask!');
      return;
    } else {
      console.log('We have the ethereum object', ethereum);
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log('Found an authorized account:', account);
      setCurrentAccount(account);
    } else {
      console.log('No authorized account found');
    }

    const chainId = await ethereum.request({ method: 'eth_chainId' });
    const networkName = networks[chainId] || 'Unknown Network';
    console.log(networkName);
    setNetwork(networkName);

    ethereum.on('chainChanged', handleChainChanged);

    function handleChainChanged(_chainId) {
      window.location.reload();
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  return (
    <div className='w-full h-screen bg-darkGray text-center'>
      <header className='flex w-full bg-lightGray fixed justify-between p-[0.75rem] z-50'>
        <div className='flex items-center text-left ml-10'>
          <FontAwesomeIcon
            icon={faSquare}
            className='mr-2 text-peach'
            size='2x'
          />
          <Link to='/'>
            <p className='text-4xl font-bold text-peach cursor-pointer'>
              NameSpace
            </p>
          </Link>
        </div>
        <div className='flex rounded-lg px-5 py-3 mr-10 mt-2 gap-4'>
          <div className='flex flex-col items-center mx-auto max-w-lg'>
            <button
              onClick={connectWallet}
              className='h-12 bg-beige text-textGreen font-bold rounded-lg px-8 py-2 animate-gradient-animation'
            >
              {currentAccount ? 'Connected' : 'Connect Wallet'}
            </button>
          </div>
          <div className='bg-beige text-textGreen font-bold flex p-3 rounded-lg'>
            <img
              alt='Network logo'
              className='w-5 h-5 mr-2'
              src={network.includes('Polygon') ? polygonLogo : ethLogo}
            />
            {currentAccount ? (
              <p>
                Wallet: {currentAccount.slice(0, 6)}...
                {currentAccount.slice(-4)}
              </p>
            ) : (
              <p>Not connected</p>
            )}
          </div>
        </div>
      </header>
      <div className='py-[17.5rem] flex flex-col items-center justify-center w-full gap-[2rem]'>
        <p className='text-9xl font-bold text-textGray'>
          Name <span className='text-beige'>Space</span>
        </p>
        <p className='text-3xl mt-5 text-peach font-bold'>
          Web3 Domain Name Service Launchpad For Organizations
        </p>

        <span className='flex mt-10 flex-row gap-[2rem]'>
          <Link to={'/organization'}>
            <button
              className='px-[2rem] py-[1rem] text-[1.5rem] font-medium text-peach bg-lightGray rounded-2xl'
              style={{
                background: '#17171c',
                boxShadow:
                  'inset -24px -24px 49px #0b0b0e, inset 24px 24px 49px #2d2d3a',
              }}
            >
              For Organizations
            </button>
          </Link>
          <Link to={'/member'}>
            <button
              className='px-[2rem] py-[1rem] text-[1.5rem] font-medium text-peach bg-lightGray rounded-2xl'
              style={{
                background: '#17171c',
                boxShadow:
                  'inset -24px -24px 49px #0b0b0e, inset 24px 24px 49px #2d2d3a',
              }}
            >
              For Organization Members
            </button>
          </Link>
        </span>
      </div>
    </div>
  );
};

export default Home;
