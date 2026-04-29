// FIX BUG B: Pakai URL ESM bukan UMD. UMD tidak bisa di-import sebagai ES module.
import { ethers } from 'https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.2/ethers.esm.min.js';

export const X402_CONFIG = {
  httpPrecompile:       '0x0000000000000000000000000000000000000801',
  httpPrecompileSecure: '0x0000000000000000000000000000000000000805',
  dkmsPrecompile:       '0x000000000000000000000000000000000000081B',
  mintFeeTokenEth: '0.001',
  mintFeeNFTEth:   '0.005',
  get mintFeeToken() { return ethers.parseEther(this.mintFeeTokenEth); },
  get mintFeeNFT()   { return ethers.parseEther(this.mintFeeNFTEth); },
  treasury: '0x000000000000000000000000000000000000dEaD',
};

export const ERC20_MINT_ABI = [
  'function mintToken(string name, string symbol, uint256 supply, uint8 decimals, address recipient) external payable returns (address)',
];
