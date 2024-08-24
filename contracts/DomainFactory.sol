// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "./domain.sol";

contract DomainFactory {
    struct DomainData {
        Domains domainContract;
        string tld;
    }

    DomainData[] public deployedDomains;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function createDomain(string memory _tld) public payable {
        require(msg.value == 0.01 ether, "You need to send exactly 0.01 EDU to create a domain");

        // Check if the TLD already exists
        for (uint i = 0; i < deployedDomains.length; i++) {
            require(keccak256(abi.encodePacked(deployedDomains[i].tld)) != keccak256(abi.encodePacked(_tld)), "TLD already exists");
        }

        Domains newDomain = new Domains(_tld);  
        deployedDomains.push(DomainData({
            domainContract: newDomain,
            tld: _tld
        }));
    }

    function getAllDomains() public view returns (DomainData[] memory) {
        return deployedDomains;
    }

    function withdraw() public {
        require(msg.sender == owner, "Only the contract owner can withdraw funds");
        payable(owner).transfer(address(this).balance);
    }
}
