import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ethers } from 'ethers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faSquare } from '@fortawesome/free-regular-svg-icons';
import polygonLogo from '../assets/polygonlogo.svg';
import ethLogo from '../assets/ethlogo.svg';
import { networks } from '../utils/networks';
import { Link } from 'react-router-dom';
import domainAbi from '../utils/Domains.json'; // Import ABI of the Domains contract

const Domain = () => {
  const { tld, contractAddress } = useParams();
  const [network, setNetwork] = useState('');
  const [currentAccount, setCurrentAccount] = useState('');
  const [name, setName] = useState('');
  const [minting, setMinting] = useState(false);
  const [domains, setDomains] = useState([]); // State to store fetched domains

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
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

  const mintDomain = async () => {
    if (!name) return;
    setMinting(true);

    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          contractAddress,
          domainAbi.abi,
          signer
        );

        console.log(
          `Minting domain ${name}.${tld} on contract ${contractAddress}...`
        );
        let tx = await contract.register(name);
        await tx.wait();

        console.log(`Domain ${name}.${tld} minted!`);
        alert(`Domain ${name}.${tld} minted successfully!`);
        setName(''); // Clear the input field after minting
        fetchDomains(); // Refresh the list of domains after minting
      }
    } catch (error) {
      console.error('Minting failed:', error);
      alert('Minting failed. Please try again.');
    } finally {
      setMinting(false);
    }
  };

  const fetchDomains = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          contractAddress,
          domainAbi.abi,
          signer
        );

        const names = await contract.getAllNames();

        const mintRecords = await Promise.all(
          names.map(async (name) => {
            const mintRecord = await contract.records(name);
            const owner = await contract.domains(name);
            return {
              id: names.indexOf(name),
              name: name,
              record: mintRecord,
              owner: owner,
            };
          })
        );

        console.log('MINTS FETCHED ', mintRecords);
        setDomains(mintRecords);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const switchNetwork = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xe705' }],
        });
      } catch (error) {
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0xe705',
                  chainName: 'Linea Sepolia Testnet',
                  rpcUrls: ['https://linea-sepolia.infura.io/v3/'],
                  nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  blockExplorerUrls: ['https://sepolia.lineascan.build/'],
                },
              ],
            });
          } catch (error) {
            console.log(error);
          }
        }
        console.log(error);
      }
    } else {
      alert(
        'MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html'
      );
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    fetchDomains(); // Fetch domains when the component mounts
  }, []);

  return (
    <div className='text-center h-screen bg-darkGray w-full'>
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

      <div className='grid grid-cols-2 w-full overflow-hidden'>
        <div className='h-[80vh] flex flex-col items-center justify-center overflow-hidden gap-[2rem]'>
          <h1 className='text-7xl text-textGray font-bold'>Organization Domain Details</h1>
          <span
            className='px-[2rem] py-[0.5rem] flex flex-row items-center justify-center max-w-fit rounded-lg gap-[1.5rem]'
            style={{
              background: '#17171c',
              boxShadow:
                'inset -24px -24px 49px #0b0b0e, inset 24px 24px 49px #2d2d3a',
            }}
          >
            <pre className='text-2xl font-bold text-peach'>
              TLD: <span className='text-beige'>{tld}</span>
            </pre>
            <p className='text-xl text-textGray'>{contractAddress}</p>
            <FontAwesomeIcon
              icon={faCopy}
              className='cursor-pointer text-white hover:text-gray-300'
              onClick={() => copyToClipboard(contractAddress)}
            />
          </span>

          <div className='flex flex-col items-center justify-center gap-[2rem] w-full'>
            <pre className='text-2xl text-peach font-bold'>
              Mint a New <span className='text-beige'>{tld}</span> Domain Name
            </pre>
            <div className='flex flex-row items-center justify-center w-full gap-[1rem]'>
              <span className='px-[1rem] py-[0.5rem] flex items-center justify-center bg-lightGray text-peach text-lg w-full text-center placeholder-textGray outline-none max-w-[30rem] rounded-lg'>
                <input
                  type='text'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`Enter a domain name for ${tld}`}
                  className='text-textGray bg-lightGray w-full focus:outline-none'
                />
                <p>.{tld}</p>
              </span>
              <button
                className='px-[2rem] py-[0.75rem] bg-beige text-textGreen font-bold rounded-lg animate-gradient-animation min-w-fit'
                onClick={mintDomain}
                disabled={minting || !name}
              >
                {minting ? 'Minting...' : `Mint \n ${name}.${tld}`}
              </button>
            </div>

            {/* <span>
            
              <p className='mt-2'>
                Domain name will be mapped to your wallet address with which you
                are minting it
              </p>
              <p className='mt-10 text-5xl font-bold text-teal-500 mb-2'>
                Why Web3 Domains
              </p>
              <div className='mt-5 text-lg font-bold space-y-5'>
                <p className='bg-gradient-to-r from-red-600 to-pink-600 rounded py-3 px-24'>
                  To recieve NFT docs and credentials
                </p>
                <p className='bg-gradient-to-r from-red-600 to-pink-600 rounded py-3 px-24'>
                  To access NFT gated platforms
                </p>
                <p className='bg-gradient-to-r from-red-600 to-pink-600 rounded py-3 px-24'>
                  For communications and authentication
                </p>
              </div>
            </span> */}
          </div>
        </div>

        <div className='h-[80vh] py-[5rem] flex flex-col items-center justify-start overflow-y-scroll'>
          <h2 className='text-5xl text-textGray font-bold mb-5'>
            Minted Domains
          </h2>
          {domains.length === 0 ? (
            <p>No domains minted yet.</p>
          ) : (
            <ul className='text-xl justify-center flex flex-wrap gap-4'>
              {domains.map((domain, index) => (
                <li
                  key={index}
                  className='px-[2rem] py-[0.75rem] text-[1.25rem] text-beige rounded-lg cursor-pointer transform transition-transform duration-300 hover:scale-105 shadow-md'
                  style={{
                    background: '#17171c',
                    boxShadow:
                      'inset -24px -24px 49px #0b0b0e, inset 24px 24px 49px #2d2d3a',
                  }}
                  onClick={() =>
                    window.open(
                      `https://sepolia.lineascan.build/nft/${contractAddress}/${index}`,
                      '_blank'
                    )
                  }
                >
                  {domain.name}.{tld}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Domain;
