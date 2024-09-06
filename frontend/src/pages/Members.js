import '../styles/App.css';
import { ethers } from 'ethers';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { useNavigate } from 'react-router-dom';
import ethLogo from '../assets/ethlogo.svg';
import { networks } from '../utils/networks';
import contractAbi from '../utils/DomainFactory.json';
import React, { useEffect, useState } from 'react';
import polygonLogo from '../assets/polygonlogo.svg';
import { faCopy, faSquare } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';

const CONTRACT_ADDRESS = '0xd773bE644ec4C5a9e0E2A85530902eB39AC28E79';

const Members = () => {
  const [domains, setDomains] = useState([]);
  const [network, setNetwork] = useState('');
  const [currentAccount, setCurrentAccount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleCardClick = (tld, contractAddress) => {
    navigate(`/domain/${tld}/${contractAddress}`);
  };

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

  const fetchDomains = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractAbi.abi,
          signer
        );

        const domainData = await contract.getAllDomains();
        const deployedDomains = domainData.map((data, index) => ({
          id: index,
          tld: data.tld,
          address: data.domainContract,
        }));

        console.log('DOMAINS FETCHED', deployedDomains);
        setDomains(deployedDomains);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert('Address copied to clipboard!');
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
      });
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

  const renderDomains = () => {
    const filteredDomains = domains.filter((domain) =>
      domain.tld.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (currentAccount && filteredDomains.length > 0) {
      return (
        <div className='flex flex-col items-center justify-center w-full'>
          <div className='flex flex-wrap justify-center gap-[1rem]'>
            {filteredDomains.map((domain, index) => (
              <div
                className='p-[1rem] flex flex-col rounded-lg cursor-pointer transform transition-transform duration-300 hover:scale-105 min-w-fit gap-[0.75rem]'
                key={index}
                onClick={() => handleCardClick(domain.tld, domain.address)}
                style={{
                  background: '#17171c',
                  boxShadow:
                    'inset -24px -24px 49px #0b0b0e, inset 24px 24px 49px #2d2d3a',
                }}
              >
                <pre className='text-xl font-bold text-peach'>
                  TLD: <span className='text-beige'>{domain.tld}</span>
                </pre>
                <div className='flex flex-row gap-[0.5rem]'>
                  <p className='text-xs text-textGray  hover:text-peach'>
                    {domain.address}
                  </p>
                  <FontAwesomeIcon
                    icon={faCopy}
                    className='cursor-pointer text-textGray hover:text-peach'
                    onClick={() => copyToClipboard(domain.address)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    } else if (currentAccount && filteredDomains.length === 0) {
      return (
        <p className='text-xl mt-10 font-semibold'>No matching TLD found.</p>
      );
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    fetchDomains();
  }, []);

  useEffect(() => {
    if (network === 'Linea Sepolia Testnet') {
      fetchDomains();
    }
  }, [currentAccount, network]);

  return (
    <div className='w-full h-screen bg-darkGray text-center text-white'>
      <header className='flex w-full bg-lightGray justify-between p-[0.75rem] z-50'>
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
          <div className='bg-beige text-textGreen flex p-3 rounded-lg'>
            <img
              alt='Network logo'
              className='w-5 h-5 mr-2'
              src={network.includes('Polygon') ? polygonLogo : ethLogo}
            />
            {currentAccount ? (
              <p className='font-bold'>
                Wallet: {currentAccount.slice(0, 6)}...
                {currentAccount.slice(-4)}
              </p>
            ) : (
              <p className='font-bold'>Not connected</p>
            )}
          </div>
        </div>
      </header>

      <div className='px-[5rem] py-[5rem] flex flex-col items-center justify-center w-full gap-[2.5rem]'>
        <div className='flex flex-row justify-between w-full'>
          <p className='text-5xl text-textGray font-bold'>
            Mint Domain Under Your Organization TLD
          </p>
          <input
            type='text'
            placeholder='Search your organization'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='p-[1rem] max-w-lg text-textGray bg-lightGray rounded-lg outline-none'
          />
        </div>

        {renderDomains()}
      </div>
    </div>
  );
};

export default Members;
