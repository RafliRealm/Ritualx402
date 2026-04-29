// ethers is already loaded as global in index.html
const { ethers } = window;

export const X402_CONFIG = {
  httpPrecompile:       '0x0000000000000000000000000000000000000801',
  httpPrecompileSecure: '0x0000000000000000000000000000000000000805',
  dkmsPrecompile:       '0x000000000000000000000000000000000000081B',
  mintFeeTokenEth: '0.001',
  mintFeeNFTEth:   '0.005',
  get mintFeeToken() { 
    if (!ethers) throw new Error('ethers not loaded');
    return ethers.parseEther(this.mintFeeTokenEth); 
  },
  get mintFeeNFT() { 
    if (!ethers) throw new Error('ethers not loaded');
    return ethers.parseEther(this.mintFeeNFTEth); 
  },
  treasury: '0x000000000000000000000000000000000000dEaD',
};

export const ERC20_MINT_ABI = [
  'function mintToken(string name, string symbol, uint256 supply, uint8 decimals, address recipient) external payable returns (address)',
];
