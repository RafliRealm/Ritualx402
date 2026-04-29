export const X402_CONFIG = {
  httpPrecompile:       '0x0000000000000000000000000000000000000801',
  httpPrecompileSecure: '0x0000000000000000000000000000000000000805',
  dkmsPrecompile:       '0x000000000000000000000000000000000000081B',
  mintFeeTokenEth: '0.001',
  mintFeeNFTEth:   '0.005',
  get mintFeeToken() { 
    try {
      if (!window.ethers) {
        console.warn('⚠️ ethers not loaded, returning BigInt(0)');
        return 0n;
      }
      return window.ethers.parseEther(this.mintFeeTokenEth); 
    } catch (err) {
      console.error('Error parsing fee:', err);
      return 0n;
    }
  },
  get mintFeeNFT() { 
    try {
      if (!window.ethers) {
        console.warn('⚠️ ethers not loaded, returning BigInt(0)');
        return 0n;
      }
      return window.ethers.parseEther(this.mintFeeNFTEth); 
    } catch (err) {
      console.error('Error parsing fee:', err);
      return 0n;
    }
  },
  treasury: '0x000000000000000000000000000000000000dEaD',
};

export const ERC20_MINT_ABI = [
  'function mintToken(string name, string symbol, uint256 supply, uint8 decimals, address recipient) external payable returns (address)',
];
