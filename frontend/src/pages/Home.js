import "../styles/App.css";
import { ethers } from "ethers";
import '@fortawesome/fontawesome-free/css/all.min.css';
import { useNavigate } from "react-router-dom";
import ethLogo from "../assets/ethlogo.svg";
import { networks } from "../utils/networks";
import contractAbi from "../utils/DomainFactory.json";
import React, { useEffect, useState } from "react";
import polygonLogo from "../assets/polygonlogo.svg";
import { faCopy, faSquare } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';


const CONTRACT_ADDRESS = "0x376343F54fC19fCC383Af473e9Cd2d39Fd5cd0C7";
const Home = () => {
  const [domains, setDomains] = useState([]);
  const [tld, setTld] = useState("");
  const [network, setNetwork] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentAccount, setCurrentAccount] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  

  const handleCardClick = (tld, contractAddress) => {
    navigate(`/domain/${tld}/${contractAddress}`);
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask -> https://metamask.io/");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
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

        console.log("DOMAINS FETCHED", deployedDomains);
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
    console.log("Creating domain with TLD", tld);
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

        console.log("Going to pop wallet now to pay gas...");
        let tx = await contract.createDomain(tld, {
          value: ethers.utils.parseEther("0.01"),
        });
        const receipt = await tx.wait();

        if (receipt.status === 1) {
          console.log(
            "Domain created! https://opencampus-codex.blockscout.com/tx/" +
              tx.hash
          );
          setTimeout(() => {
            fetchDomains();
          }, 2000);
          setTld("");
        } else {
          alert("Transaction failed! Please try again");
        }
      }
    } catch (error) {
      console.log(error);
      alert("Creation failed (Duplicate TLD). Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
        alert('Address copied to clipboard!');
    }).catch(err => {
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

        console.log("Withdrawing funds...");
        let tx = await contract.withdraw();
        await tx.wait();
        console.log(
          "Funds withdrawn! https://opencampus-codex.blockscout.com/tx/" +
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
      console.log("Make sure you have metamask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
    } else {
      console.log("No authorized account found");
    }

    const chainId = await ethereum.request({ method: "eth_chainId" });
    const networkName = networks[chainId] || "Unknown Network";
    console.log(networkName);
    setNetwork(networkName);

    ethereum.on("chainChanged", handleChainChanged);

    function handleChainChanged(_chainId) {
      window.location.reload();
    }
  };

  const renderDomains = () => {
    const filteredDomains = domains.filter(domain =>
      domain.tld.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (currentAccount && filteredDomains.length > 0) {
      return (
        <div className="flex flex-col items-center justify-center w-full">
          <div className="flex flex-wrap justify-center gap-4">
            {filteredDomains.map((domain, index) => (
              <div
                className="bg-teal-500 shadow-md rounded-lg p-4 mb-4 cursor-pointer transform transition-transform duration-300 hover:scale-105"
                key={index}
                onClick={() => handleCardClick(domain.tld, domain.address)}
              >
                <p className="font-bold text-2xl">TLD: {domain.tld}</p>
                <div className="flex items-center">
                  <p className="mr-2">{domain.address}</p>
                  <FontAwesomeIcon
                    icon={faCopy}
                    className="cursor-pointer text-white hover:text-gray-300"
                    onClick={() => copyToClipboard(domain.address)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    } else if (currentAccount && filteredDomains.length === 0) {
      return <p className="text-xl mt-10 font-semibold">No matching TLD found.</p>;
    }
  };

  const switchNetwork = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xa045c" }],
        });
      } catch (error) {
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0xa045c",
                  chainName: "Edu-Chain",
                  rpcUrls: ["https://rpc.open-campus-codex.gelato.digital"],
                  nativeCurrency: {
                    name: "EDU",
                    symbol: "EDU",
                    decimals: 18,
                  },
                  blockExplorerUrls: [
                    "https://opencampus-codex.blockscout.com/",
                  ],
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
        "MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html"
      );
    }
  };

  const renderInputForm = () => {
    if (network !== "Edu-Chain") {
      return (
        <div className="flex flex-col items-center mx-auto max-w-lg">
          <p>Please connect to Edu-Chain</p>
          <button
            className="h-12 bg-orange-500 text-white font-bold rounded-lg px-8 py-2 animate-gradient-animation"
            onClick={switchNetwork}
          >
            Click here to switch
          </button>
        </div>
      );
    }

    return (
      <div className=" flex flex-col items-center mt-10 justify-center w-full">
        <p className="text-4xl bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent font-bold mb-5">Create A Top Level Domain (TLD)</p>
        <div className="flex items-center justify-between w-full max-w-md mb-4">
          <input
            type="text"
            value={tld}
            placeholder="TLD"
            onChange={(e) => setTld(e.target.value)}
            className="border border-teal-500 rounded-lg bg-black text-white text-lg py-2 px-4 text-center w-full mb-2 placeholder-gray-500 focus:outline-none focus:border-red-500"
          />
        </div>
        <button
          className="h-12 bg-gradient-to-r from-sky-500 to-teal-400 text-white font-bold rounded-lg px-8 py-2 animate-gradient-animation"
          disabled={loading}
          onClick={createNewDomain}
        >
          {loading ? "Creating..." : "Create TLD"}
        </button>
        <p className="mt-1">( Fee 0.01 EDU )</p>
      </div>
    );
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    fetchDomains();
  }, []);

  useEffect(() => {
    if (network === "Edu-Chain") {
      fetchDomains();
    }
  }, [currentAccount, network]);

  return (
    <div className=" bg-[#0d1116] text-center text-white">
      
        <div className="">
          <header className="flex w-full bg-gradient-to-r from-red-500 to-pink-600 fixed justify-between px-4 z-50">
          <div className="flex items-center text-left ml-10">
            <FontAwesomeIcon icon={faSquare} className="mr-2 text-white" size="2x" />
            <Link to="/">
              <p className="text-4xl font-bold text-white cursor-pointer">NameSpace</p>
            </Link>
          </div>
            <div className="flex rounded-lg px-5 py-3 mr-10 mt-2 gap-4">
              <div className="flex flex-col items-center mx-auto max-w-lg">
                <button
                  onClick={connectWallet}
                  className="h-12 bg-gradient-to-r from-sky-500 to-teal-500 text-white font-bold rounded-lg px-8 py-2 animate-gradient-animation"
                >
                  {currentAccount ? "Connected" : "Connect Wallet"}
                </button>
              </div>
              <div className="bg-black flex p-3 rounded-lg">
              <img
                alt="Network logo"
                className="w-5 h-5 mr-2"
                src={network.includes("Polygon") ? polygonLogo : ethLogo}
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
        </div>
        <div>
          <div className="flex">
            <div className="h-screen mt-32 fixed w-1/2 bg-[#0d1116]"> 
              <p className="bg-gradient-to-r from-sky-500 to-teal-500 bg-clip-text text-transparent font-bold text-9xl">NameSpace</p>
              <p className="text-4xl font-bold mt-5">Domain Name Service Launchpad</p>
              <p className="text-2xl  font-bold mt-5 pl-10 pr-10">Create Web3 domains like .eth .nft .crypto for your entity and let your members mint there unique domain names</p>
              {renderInputForm()}
              <div className="">
              <p className="mt-5 text-2xl font-bold">Are you looking to mint a domain name like 'yourname.xyz'?</p>
              <p className="mt-2 text-2xl font-bold text-red-500">Click on your prefered TLD card to mint</p>
              <p className="mt-5 text-2xl font-bold">Search A TLD</p>
              <div className="flex justify-center w-full mt-5">
                <div className="w-full max-w-lg">
                  <input
                    type="text"
                    placeholder="Search for a TLD"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 mb-5 border border-teal-500 rounded-lg bg-black focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
              </div>
            </div>
            <div className="ml-[50%] w-1/2">
              <p className="mt-40 mb-16 text-5xl bg-gradient-to-r from-sky-300 to-teal-500 bg-clip-text text-transparent font-bold">Mint Domain From Existing TLDs</p>
              {renderDomains()}
            </div>
          </div>
        </div>
      </div>
  );
};

export default Home;
