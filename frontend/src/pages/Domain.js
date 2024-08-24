import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faSquare } from '@fortawesome/free-regular-svg-icons';
import polygonLogo from "../assets/polygonlogo.svg";
import ethLogo from "../assets/ethlogo.svg";
import { networks } from "../utils/networks";
import { Link } from 'react-router-dom';
import domainAbi from "../utils/Domains.json"; // Import ABI of the Domains contract

const Domain = () => {
  const { tld, contractAddress } = useParams();
  const [network, setNetwork] = useState("");
  const [currentAccount, setCurrentAccount] = useState("");
  const [name, setName] = useState("");
  const [minting, setMinting] = useState(false);
  const [domains, setDomains] = useState([]); // State to store fetched domains

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
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
        setName(""); // Clear the input field after minting
        fetchDomains(); // Refresh the list of domains after minting
      }
    } catch (error) {
      console.error("Minting failed:", error);
      alert("Minting failed. Please try again.");
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

        console.log("MINTS FETCHED ", mintRecords);
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

  useEffect(() => {
    checkIfWalletIsConnected();
    fetchDomains(); // Fetch domains when the component mounts
  }, []);

  return (
    <div className="bg-[#0d1116] text-center text-white min-h-screen">
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
      <div className="flex">
        <div className="fixed w-1/2 p-10 mt-12 justify-center">
          <h1 className="text-4xl text-teal-500 font-bold">Domain Details</h1>
          <div className="mt-4 flex flex-col items-center">
            <p className="text-2xl font-bold text-red-500">TLD: {tld}</p>
            <div className="flex items-center">
              <p className="text-xl">{contractAddress}</p>
              <FontAwesomeIcon
                icon={faCopy}
                className="cursor-pointer text-white hover:text-gray-300 mt-1 ml-3"
                onClick={() => copyToClipboard(contractAddress)}
              />
            </div>
          </div>

          {/* Domain Minting Form */}
          <div className="mt-10 flex flex-col items-center">
            <h2 className="text-5xl text-teal-500 font-bold mb-5">Mint a New Domain Name</h2>
            <div className="flex border justify-center border-teal-500 rounded-lg bg-black text-white text-lg py-2 px-4 mb-4 w-full max-w-md text-center placeholder-gray-500 focus:outline-none">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`Enter a domain name for ${tld}`}
                className="bg-black border-transparent text-white text w-full max-w-md focus:outline-none"
              />
              <p>.{tld}</p>
            </div>
            
            <button
              className="h-12 bg-gradient-to-r from-sky-500 to-teal-400 text-white font-bold rounded-lg px-8 py-2 animate-gradient-animation"
              onClick={mintDomain}
              disabled={minting || !name}
            >
              {minting ? "Minting..." : `Mint \n ${name}.${tld}`}
            </button>
            <p className="mt-2">Domain name will be mapped to your wallet address with which you are minting it</p>
            <p className="mt-10 text-5xl font-bold text-teal-500 mb-2">Why Web3 Domains</p>
            <div className="mt-5 text-lg font-bold space-y-5">
              <p className="bg-gradient-to-r from-red-600 to-pink-600 rounded py-3 px-24">To recieve NFT docs and credentials</p>
              <p className="bg-gradient-to-r from-red-600 to-pink-600 rounded py-3 px-24">To access NFT gated platforms</p>
              <p className="bg-gradient-to-r from-red-600 to-pink-600 rounded py-3 px-24">For communications and authentication</p>
            </div>
          </div>
        </div>

        <div className="w-1/2 ml-[50%] mt-20">
          {/* Displaying Fetched Domains */}
          <div className="mt-10">
            <h2 className="text-4xl text-teal-500 font-bold mb-5">Minted Domains</h2>
            {domains.length === 0 ? (
              <p>No domains minted yet.</p>
            ) : (
              <ul className="text-xl justify-center flex flex-wrap gap-4">
                {domains.map((domain, index) => (
                  <li
                    key={index}
                    className="w-2/5 py-4 bg-teal-500 shadow-md rounded-lg p-4 mb-4 cursor-pointer transform transition-transform duration-300 hover:scale-105"
                    onClick={() => window.open(`https://opencampus-codex.blockscout.com/token/${contractAddress}/instance/${index}`, '_blank')}
                  >
                    {domain.name}.{tld}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Domain;
