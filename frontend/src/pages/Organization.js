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
import { Link as ScrollLink } from 'react-scroll';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

const CONTRACT_ADDRESS = '0xd773bE644ec4C5a9e0E2A85530902eB39AC28E79';
const Organization = () => {
  const [domains, setDomains] = useState([]);
  const [tld, setTld] = useState('');
  const [network, setNetwork] = useState('');
  const [loading, setLoading] = useState(false);
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

  const createNewDomain = async () => {
    if (!tld) {
      return;
    }
    setLoading(true);
    console.log('Creating domain with TLD', tld);
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

        console.log('Going to pop wallet now to pay gas...');
        let tx = await contract.createDomain(tld, {
          value: ethers.utils.parseEther('0.01'),
        });
        const receipt = await tx.wait();

        if (receipt.status === 1) {
          console.log(
            'Domain created! https://sepolia.lineascan.build/tx/' + //to change
              tx.hash
          );
          setTimeout(() => {
            fetchDomains();
          }, 2000);
          setTld('');
        } else {
          alert('Transaction failed! Please try again');
        }
      }
    } catch (error) {
      console.log(error);
      if (error.code === 'INSUFFICIENT_FUNDS') {
        alert(
          'Transaction failed due to insufficient funds for gas. Please ensure you have enough ETH to cover the gas fees.'
        );
      } else {
        alert('Creation failed (Duplicate TLD). Please try again.');
      }
    } finally {
      setLoading(false);
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

  const withdrawFunds = async () => {
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

        console.log('Withdrawing funds...');
        let tx = await contract.withdraw();
        await tx.wait();
        console.log(
          'Funds withdrawn! https://sepolia.lineascan.build/tx/' + //to change
            tx.hash
        );
      }
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
        <p className='text-xl text-textGray mt-10 font-semibold'>
          No matching TLD found.
        </p>
      );
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

  const renderInputForm = () => {
    if (network !== 'Linea Sepolia Testnet') {
      return (
        <div className='flex flex-col items-center mx-auto max-w-lg gap-[1rem]'>
          <pre className='text-[1.25rem] text-peach'>
            {'!  Please connect to Linea Sepolia Testnet  !'}
          </pre>
          <button
            className='px-[1.5rem] py-[0.75rem] text-textGreen bg-textGray font-bold rounded-lg'
            onClick={switchNetwork}
          >
            Click here to switch
          </button>
        </div>
      );
    }

    return (
      <div className='py-[1.5rem] flex flex-col items-center justify-center w-full gap-[2rem]'>
        <input
          type='text'
          value={tld}
          placeholder='eg:  zomato'
          onChange={(e) => setTld(e.target.value)}
          className='px-[2rem] py-[2rem] w-[30rem] rounded-lg bg-lightGray text-white text-lg placeholder-textGray outline-double'
        />
        <div className='flex flex-row items-center justify-center w-full gap-[1rem]'>
          <input
            disabled
            className='px-[1rem] py-[0.5rem] text-lg text-black flex items-center justify-center rounded-lg'
            placeholder='Preview'
            value={tld && `.${tld}`}
          />
          <button
            className='px-[2rem] py-[0.75rem] bg-beige text-textGreen font-bold animate-gradient-animation rounded-lg'
            disabled={loading}
            onClick={createNewDomain}
          >
            {loading ? 'Creating...' : 'Create A Domain'}
          </button>
        </div>
        <p className='text-peach'>( Fee 0.01 ETH )</p>
      </div>
    );
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    fetchDomains();
  }, []);

  useEffect(() => {
    if (network === 'Edu-Chain') {
      fetchDomains();
    }
  }, [currentAccount, network]);

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

      <div className='py-[12.5rem] flex flex-col items-center justify-center w-full gap-[3.125rem]'>
        {/* <p className='text-9xl font-bold text-textGray'>
          Name <span className='text-beige'>Space</span>
        </p>
        <p className='text-3xl text-peach font-bold'>
          Domain Name Service Launchpad
        </p> */}

        <p className='text-5xl font-bold text-textGray'>
          Create a Domain for your{' '}
          <span className='text-beige'>Organization</span>
        </p>

        {renderInputForm()}

        <ul
          type='1'
          className='grid grid-cols-2 gap-[2rem] text-peach max-w-[60rem]'
        >
          <li
            className='px-[1.5rem] py-[1.5rem] text-2xl font-bold rounded-3xl tracking-wide'
            style={{
              background: '#17171c',
              boxShadow:
                'inset -24px -24px 49px #0b0b0e, inset 24px 24px 49px #2d2d3a',
            }}
          >
            Create Web3 domains like
            <span className='text-beige px-[0.5rem]'>
              {`.mit .iit .degensclub .zomato .zo`}
            </span>
            for your <span className='text-whitee'>Organization</span>
          </li>
          <li
            className='px-[1.5rem] py-[1.5rem] text-2xl font-bold rounded-3xl'
            style={{
              background: '#17171c',
              boxShadow:
                'inset -24px -24px 49px #0b0b0e, inset 24px 24px 49px #2d2d3a',
            }}
          >
            Let your organization members create a name with your Web3 Domain
          </li>
        </ul>
        <ScrollLink
          to='secondDiv'
          smooth={true}
          duration={500}
          className='p-[0.25rem] text-textGreen bg-beige cursor-pointer rounded-[50%]  object-cover'
        >
          <ArrowDownwardIcon fontSize='large' />
        </ScrollLink>
      </div>

      <div
        id='secondDiv'
        className='mb-[10rem] px-[5rem] py-[7.5rem] flex flex-col items-center justify-center w-full gap-[2.5rem]'
      >
        <div className='flex flex-row justify-between w-full'>
          <p className='text-5xl text-textGray font-bold'>
            Domains Created By Other Organizations
          </p>
          <input
            type='text'
            placeholder='Search your TLD'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='p-[1rem] max-w-lg text-textGray bg-lightGray rounded-lg outline-none placeholder-textGray'
          />
        </div>

        {renderDomains()}
      </div>
    </div>
  );
};

export default Organization;
