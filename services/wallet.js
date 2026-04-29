import { RITUAL_CHAIN } from '../config/chain.js';
import { loadScript } from '../utils/helpers.js';
import { setStatus } from '../ui/flow-stepper.js';
import { updateChainInfo, stopChainInfoUpdates } from './chain.js';

export let provider = null;
export let signer   = null;
export let walletAddress = '';
export let isConnected   = false;
export let currentChainId = null;

function setProvider(p)  { provider = p; }
function setSigner(s)    { signer = s; }
function setAddress(a)   { walletAddress = a; }
function setConnected(b) { isConnected = b; }
function setChainId(id)  { currentChainId = id; }

// ── Public exports for other modules to read state
export function getProvider()    { return provider; }
export function getSigner()      { return signer; }
export function getAddress()     { return walletAddress; }
export function getIsConnected() { return isConnected; }
export function getChainId()     { return currentChainId; }

// ── Wallet modal control
export function openWalletModal() {
  detectWallets();
  document.getElementById('walletModal').classList.add('open');
}

export function closeWalletModal() {
  document.getElementById('walletModal').classList.remove('open');
}

export function toggleConnect() {
  if (isConnected) { disconnectWallet(); return; }
  openWalletModal();
}

// ── Detect installed wallets and style options
export function detectWallets() {
  const eth = window.ethereum;
  const hasMM    = !!(eth && eth.isMetaMask && !eth.isRabby);
  const hasRabby = !!(eth && eth.isRabby);
  const hasOKX   = !!window.okxwallet;
  const hasCB    = !!(window.coinbaseWalletExtension || (eth && eth.isCoinbaseWallet));

  styleWalletOption('optMetaMask',  hasMM,    'metamask',  'https://metamask.io/download/');
  styleWalletOption('optRabby',     hasRabby, 'rabby',     'https://rabby.io/');
  styleWalletOption('optOKX',       hasOKX,   'okx',       'https://www.okx.com/web3');
  styleWalletOption('optCoinbase',  hasCB,    'coinbase',  'https://www.coinbase.com/wallet/downloads');

  const wc = document.getElementById('optWalletConnect');
  wc.classList.remove('not-installed', 'detected');
}

function styleWalletOption(id, detected, providerType, installUrl) {
  const el = document.getElementById(id);
  el.classList.remove('detected', 'not-installed');
  if (detected) {
    el.classList.add('detected');
    el.onclick = () => connectWithProvider(providerType);
  } else {
    el.classList.add('not-installed');
    el.onclick = () => window.open(installUrl, '_blank');
  }
}

// ── Connect with a specific provider type
export async function connectWithProvider(type) {
  closeWalletModal();
  try {
    if (type === 'walletconnect') { await connectWalletConnect(); return; }

    let ethProvider = null;
    if (type === 'okx') {
      if (!window.okxwallet) { window.open('https://www.okx.com/web3', '_blank'); return; }
      ethProvider = window.okxwallet;
    } else if (type === 'coinbase') {
      if (window.coinbaseWalletExtension) {
        ethProvider = window.coinbaseWalletExtension;
      } else if (window.ethereum?.isCoinbaseWallet) {
        ethProvider = window.ethereum;
      } else {
        window.open('https://www.coinbase.com/wallet/downloads', '_blank'); return;
      }
    } else if (type === 'rabby') {
      if (window.ethereum?.isRabby) { ethProvider = window.ethereum; }
      else { window.open('https://rabby.io/', '_blank'); return; }
    } else {
      if (!window.ethereum) { window.open('https://metamask.io/download/', '_blank'); return; }
      ethProvider = window.ethereum;
    }

    await connectWallet(ethProvider);
  } catch (err) {
    console.error(err);
    setStatus('token', 'tokenStatusDot', 'tokenStatusText', 'error', '✗ ' + (err.message || 'Connection failed'));
    document.getElementById('tokenStatus').classList.add('visible');
  }
}

// ── WalletConnect v2
async function connectWalletConnect() {
  setStatus('token', 'tokenStatusDot', 'tokenStatusText', 'pending', '⟳ Loading WalletConnect...');
  document.getElementById('tokenStatus').classList.add('visible');
  try {
    // Ensure ethers is loaded
    if (!window.ethers) {
      throw new Error('ethers.js library not loaded. Please refresh the page.');
    }
    
    if (!window.WalletConnectModalSign) {
      await loadScript('https://unpkg.com/@walletconnect/modal-sign-html@2.6.2/dist/index.umd.js');
    }
    const wcSign = new window.WalletConnectModalSign({
      projectId: 'a7a7a5d8cec6d78db7b80b26a80df76a',
      metadata: {
        name: 'RitualX402', description: 'Mint on Ritual Chain via X402',
        url: window.location.origin, icons: ['https://ritualfoundation.org/favicon.ico'],
      },
    });
    setStatus('token', 'tokenStatusDot', 'tokenStatusText', 'pending', '⟳ Scan QR with your mobile wallet...');
    const session = await wcSign.connect({
      requiredNamespaces: {
        eip155: {
          methods: ['eth_sendTransaction', 'personal_sign', 'eth_signTypedData_v4'],
          chains: [`eip155:${RITUAL_CHAIN.chainId}`],
          events: ['chainChanged', 'accountsChanged'],
        },
      },
    });
    const wcAccounts = session.namespaces.eip155?.accounts || [];
    if (!wcAccounts.length) throw new Error('No accounts returned from WalletConnect');
    setAddress(wcAccounts[0].split(':')[2]);
    setProvider(new window.ethers.JsonRpcProvider(RITUAL_CHAIN.rpc));
    window._wcSign = wcSign;
    window._wcSession = session;
    setConnected(true);
    setChainId(RITUAL_CHAIN.chainId);
    onConnectedWC();
  } catch (err) {
    if (err.message?.includes('Modal closed')) {
      setStatus('token', 'tokenStatusDot', 'tokenStatusText', 'error', '✗ WalletConnect modal closed by user');
    } else { throw err; }
  }
}

// ── Core wallet connection
export async function connectWallet(ethProvider) {
  try {
    // Ensure ethers is loaded
    if (!window.ethers) {
      throw new Error('ethers.js library not loaded. Please refresh the page.');
    }
    
    setStatus('token', 'tokenStatusDot', 'tokenStatusText', 'pending', '⟳ Requesting wallet access...');
    document.getElementById('tokenStatus').classList.add('visible');

    const p = new window.ethers.BrowserProvider(ethProvider);
    const accounts = await p.send('eth_requestAccounts', []);
    if (!accounts?.length) throw new Error('No accounts returned');

    setProvider(p);
    setAddress(accounts[0]);
    setSigner(await p.getSigner());

    const network = await p.getNetwork();
    setChainId(Number(network.chainId));

    if (currentChainId !== RITUAL_CHAIN.chainId) {
      await switchToRitual(ethProvider);
    } else {
      onConnected();
    }
  } catch (err) {
    console.error('connectWallet error:', err);
    let msg = err.message || 'Unknown error';
    if (err.code === 4001 || err.code === 'ACTION_REJECTED') msg = 'Request rejected by user.';
    setStatus('token', 'tokenStatusDot', 'tokenStatusText', 'error', '✗ ' + msg);
  }
}

// ── Switch / add Ritual Chain
export async function switchToRitual(ethProvider) {
  const ep = ethProvider || window.ethereum;
  if (!ep) { showWrongNetworkBanner(); return; }
  try {
    await ep.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: RITUAL_CHAIN.chainIdHex }] });
    const p = new window.ethers.BrowserProvider(ep);
    setProvider(p);
    const newSigner = await p.getSigner();
    setSigner(newSigner);
    setAddress(await newSigner.getAddress());
    setChainId(RITUAL_CHAIN.chainId);
    onConnected();
  } catch (switchErr) {
    if ([4902, -32603].includes(switchErr.code) || switchErr.data?.originalError?.code === 4902) {
      try {
        await ep.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: RITUAL_CHAIN.chainIdHex, chainName: RITUAL_CHAIN.name,
            nativeCurrency: RITUAL_CHAIN.nativeCurrency,
            rpcUrls: [RITUAL_CHAIN.rpc], blockExplorerUrls: [RITUAL_CHAIN.explorer],
          }],
        });
        const p = new window.ethers.BrowserProvider(ep);
        setProvider(p);
        const newSigner = await p.getSigner();
        setSigner(newSigner);
        setAddress(await newSigner.getAddress());
        setChainId(RITUAL_CHAIN.chainId);
        onConnected();
      } catch (addErr) {
        console.error('addChain error:', addErr);
        showWrongNetworkBanner();
      }
    } else if (switchErr.code === 4001 || switchErr.code === 'ACTION_REJECTED') {
      setStatus('token', 'tokenStatusDot', 'tokenStatusText', 'error',
        '✗ Network switch rejected. Please switch to Ritual Chain (1979) manually.');
      document.getElementById('tokenStatus').classList.add('visible');
    } else {
      console.error('switchChain error:', switchErr);
      showWrongNetworkBanner();
    }
  }
}

// ── Disconnect
export function disconnectWallet() {
  stopChainInfoUpdates();
  
  // Cleanup WalletConnect session
  if (window._wcSign) {
    try {
      window._wcSign.disconnect();
    } catch (_) {
      // silent fail
    }
    window._wcSign = null;
  }
  if (window._wcSession) window._wcSession = null;
  
  setConnected(false);
  setAddress('');
  setSigner(null);
  setProvider(null);
  setChainId(null);

  const btn = document.getElementById('connectBtn');
  btn.textContent = 'Connect Wallet';
  btn.classList.remove('connected', 'wrong-network');
  document.getElementById('chainInfoPanel').classList.remove('visible');
  document.getElementById('balanceBadge').style.display = 'none';
}

// ── Post-connection UI updates
function onConnected() {
  setConnected(true);
  setChainId(RITUAL_CHAIN.chainId);

  const btn = document.getElementById('connectBtn');
  btn.textContent = walletAddress.slice(0,6) + '...' + walletAddress.slice(-4);
  btn.classList.add('connected');
  btn.classList.remove('wrong-network');

  document.getElementById('chainBadge').classList.remove('wrong');
  document.getElementById('chainBadge').textContent = 'Ritual Chain · 1979';
  document.getElementById('wrongNetworkAlert').classList.remove('visible');
  document.getElementById('noWalletAlert').classList.remove('visible');
  document.getElementById('chainInfoPanel').classList.add('visible');
  document.getElementById('balanceBadge').style.display = 'flex';
  document.getElementById('tokenRecipient').placeholder = walletAddress;
  document.getElementById('nftRecipient').placeholder = walletAddress;
  document.getElementById('tokenStatus').classList.remove('visible');

  if (window.ethereum) {
    window.ethereum.removeListener('chainChanged', handleChainChange);
    window.ethereum.removeListener('accountsChanged', handleAccountChange);
    window.ethereum.on('chainChanged', handleChainChange);
    window.ethereum.on('accountsChanged', handleAccountChange);
  }
  updateChainInfo();
}

function onConnectedWC() {
  const btn = document.getElementById('connectBtn');
  btn.textContent = 'WC: ' + walletAddress.slice(0,6) + '...' + walletAddress.slice(-4);
  btn.classList.add('connected');
  btn.classList.remove('wrong-network');
  document.getElementById('chainBadge').classList.remove('wrong');
  document.getElementById('wrongNetworkAlert').classList.remove('visible');
  document.getElementById('noWalletAlert').classList.remove('visible');
  document.getElementById('chainInfoPanel').classList.add('visible');
  document.getElementById('balanceBadge').style.display = 'flex';
  document.getElementById('tokenRecipient').placeholder = walletAddress;
  document.getElementById('nftRecipient').placeholder = walletAddress;
  document.getElementById('tokenStatus').classList.remove('visible');
  updateChainInfo();
}

export function showWrongNetworkBanner() {
  document.getElementById('wrongNetworkAlert').classList.add('visible');
  document.getElementById('chainBadge').classList.add('wrong');
  document.getElementById('chainBadge').textContent = 'Wrong Network';
  const btn = document.getElementById('connectBtn');
  btn.classList.add('wrong-network');
  btn.textContent = 'Wrong Network';
}

// ── Chain change listeners
function handleChainChange(chainIdHex) {
  const newId = parseInt(chainIdHex, 16);
  setChainId(newId);
  if (newId !== RITUAL_CHAIN.chainId) {
    showWrongNetworkBanner();
  } else {
    document.getElementById('wrongNetworkAlert').classList.remove('visible');
    document.getElementById('chainBadge').classList.remove('wrong');
  }
  updateChainInfo();
}

function handleAccountChange(accounts) {
  if (!accounts.length) {
    disconnectWallet();
  } else {
    setAddress(accounts[0]);
    document.getElementById('connectBtn').textContent =
      walletAddress.slice(0,6) + '...' + walletAddress.slice(-4);
    updateChainInfo();
  }
}
