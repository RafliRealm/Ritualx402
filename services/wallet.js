// FIX BUG B: Pakai ESM URL bukan UMD
import { ethers } from 'https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.2/ethers.esm.min.js';
import { RITUAL_CHAIN } from '../config/chain.js';
import { loadScript } from '../utils/helpers.js';
import { setStatus } from '../ui/flow-stepper.js';
// FIX BUG A: HAPUS import updateChainInfo dari ./chain.js (circular dependency)
// updateChainInfo sekarang dipanggil langsung dengan parameter

import { updateChainInfo } from './chain.js';

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

export function getProvider()    { return provider; }
export function getSigner()      { return signer; }
export function getAddress()     { return walletAddress; }
export function getIsConnected() { return isConnected; }
export function getChainId()     { return currentChainId; }

// ── Helper: ambil provider manapun yang tersedia (FIX BUG #3 OKX)
function getAnyEthProvider() {
  return window.ethereum || window.okxwallet || null;
}

// ── Wallet modal
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

export function detectWallets() {
  const eth    = window.ethereum;
  const hasMM  = !!(eth && eth.isMetaMask && !eth.isRabby);
  const hasRab = !!(eth && eth.isRabby);
  const hasOKX = !!window.okxwallet;
  const hasCB  = !!(window.coinbaseWalletExtension || (eth && eth.isCoinbaseWallet));

  styleWalletOption('optMetaMask', hasMM,  'metamask', 'https://metamask.io/download/');
  styleWalletOption('optRabby',    hasRab, 'rabby',    'https://rabby.io/');
  styleWalletOption('optOKX',      hasOKX, 'okx',      'https://www.okx.com/web3');
  styleWalletOption('optCoinbase', hasCB,  'coinbase', 'https://www.coinbase.com/wallet/downloads');
  document.getElementById('optWalletConnect').classList.remove('not-installed', 'detected');
}

function styleWalletOption(id, detected, type, installUrl) {
  const el = document.getElementById(id);
  el.classList.remove('detected', 'not-installed');
  if (detected) {
    el.classList.add('detected');
    el.onclick = () => connectWithProvider(type);
  } else {
    el.classList.add('not-installed');
    el.onclick = () => window.open(installUrl, '_blank');
  }
}

export async function connectWithProvider(type) {
  closeWalletModal();
  try {
    if (type === 'walletconnect') { await connectWalletConnect(); return; }

    let ep = null;
    if (type === 'okx') {
      if (!window.okxwallet) { window.open('https://www.okx.com/web3', '_blank'); return; }
      ep = window.okxwallet;
    } else if (type === 'coinbase') {
      if (window.coinbaseWalletExtension) ep = window.coinbaseWalletExtension;
      else if (window.ethereum?.isCoinbaseWallet) ep = window.ethereum;
      else { window.open('https://www.coinbase.com/wallet/downloads', '_blank'); return; }
    } else if (type === 'rabby') {
      if (window.ethereum?.isRabby) ep = window.ethereum;
      else { window.open('https://rabby.io/', '_blank'); return; }
    } else {
      if (!window.ethereum) { window.open('https://metamask.io/download/', '_blank'); return; }
      ep = window.ethereum;
    }

    await connectWallet(ep);
  } catch (err) {
    console.error(err);
    showStatusError('✗ ' + (err.message || 'Connection failed'));
  }
}

async function connectWalletConnect() {
  showStatusPending('⟳ Loading WalletConnect...');
  try {
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
    showStatusPending('⟳ Scan QR with your mobile wallet...');
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
    setProvider(new ethers.JsonRpcProvider(RITUAL_CHAIN.rpc));
    window._wcSign = wcSign;
    window._wcSession = session;
    setConnected(true);
    setChainId(RITUAL_CHAIN.chainId);
    onConnected();
  } catch (err) {
    if (err.message?.includes('Modal closed')) {
      showStatusError('✗ WalletConnect modal closed by user');
    } else { throw err; }
  }
}

export async function connectWallet(ethProvider) {
  try {
    showStatusPending('⟳ Requesting wallet access...');

    const p = new ethers.BrowserProvider(ethProvider);
    const accounts = await p.send('eth_requestAccounts', []);
    if (!accounts?.length) throw new Error('No accounts returned');

    // FIX BUG #1: simpan ke local var dulu sebelum set module state
    const s = await p.getSigner();
    setProvider(p);
    setSigner(s);
    setAddress(accounts[0]);

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
    showStatusError('✗ ' + msg);
  }
}

export async function switchToRitual(ethProvider) {
  const ep = ethProvider || getAnyEthProvider();
  if (!ep) { showWrongNetworkBanner(); return; }
  try {
    await ep.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: RITUAL_CHAIN.chainIdHex }] });
    const p = new ethers.BrowserProvider(ep);
    // FIX BUG #1: local var dulu
    const s = await p.getSigner();
    setProvider(p);
    setSigner(s);
    setAddress(await s.getAddress());
    setChainId(RITUAL_CHAIN.chainId);
    onConnected();
  } catch (switchErr) {
    if ([4902, -32603].includes(switchErr.code) || switchErr.data?.originalError?.code === 4902) {
      try {
        await ep.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: RITUAL_CHAIN.chainIdHex,
            chainName: RITUAL_CHAIN.name,
            nativeCurrency: RITUAL_CHAIN.nativeCurrency,
            rpcUrls: [RITUAL_CHAIN.rpc],
            blockExplorerUrls: [RITUAL_CHAIN.explorer],
          }],
        });
        const p = new ethers.BrowserProvider(ep);
        // FIX BUG #1: local var dulu
        const s = await p.getSigner();
        setProvider(p);
        setSigner(s);
        setAddress(await s.getAddress());
        setChainId(RITUAL_CHAIN.chainId);
        onConnected();
      } catch (addErr) {
        console.error('addChain error:', addErr);
        showWrongNetworkBanner();
      }
    } else if (switchErr.code === 4001 || switchErr.code === 'ACTION_REJECTED') {
      showStatusError('✗ Network switch rejected. Please switch to Ritual Chain (1979) manually.');
    } else {
      console.error('switchChain error:', switchErr);
      showWrongNetworkBanner();
    }
  }
}

export function disconnectWallet() {
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

  // FIX BUG #3: daftarkan listener di semua provider yang mungkin ada
  const ep = getAnyEthProvider();
  if (ep) {
    ep.removeListener?.('chainChanged', handleChainChange);
    ep.removeListener?.('accountsChanged', handleAccountChange);
    ep.on?.('chainChanged', handleChainChange);
    ep.on?.('accountsChanged', handleAccountChange);
  }

  // FIX BUG A: kirim parameter langsung, tidak lewat import circular
  updateChainInfo(provider, walletAddress, currentChainId);
}

export function showWrongNetworkBanner() {
  document.getElementById('wrongNetworkAlert').classList.add('visible');
  document.getElementById('chainBadge').classList.add('wrong');
  document.getElementById('chainBadge').textContent = 'Wrong Network';
  const btn = document.getElementById('connectBtn');
  btn.classList.add('wrong-network');
  btn.textContent = 'Wrong Network';
}

function handleChainChange(chainIdHex) {
  const newId = parseInt(chainIdHex, 16);
  setChainId(newId);
  if (newId !== RITUAL_CHAIN.chainId) {
    showWrongNetworkBanner();
  } else {
    document.getElementById('wrongNetworkAlert').classList.remove('visible');
    document.getElementById('chainBadge').classList.remove('wrong');
    document.getElementById('chainBadge').textContent = 'Ritual Chain · 1979';
  }
  updateChainInfo(provider, walletAddress, newId);
}

function handleAccountChange(accounts) {
  if (!accounts.length) {
    disconnectWallet();
  } else {
    setAddress(accounts[0]);
    document.getElementById('connectBtn').textContent =
      walletAddress.slice(0,6) + '...' + walletAddress.slice(-4);
    updateChainInfo(provider, walletAddress, currentChainId);
  }
}

// ── Internal status helpers
function showStatusPending(msg) {
  setStatus('token', 'tokenStatusDot', 'tokenStatusText', 'pending', msg);
  document.getElementById('tokenStatus').classList.add('visible');
}

function showStatusError(msg) {
  setStatus('token', 'tokenStatusDot', 'tokenStatusText', 'error', msg);
  document.getElementById('tokenStatus').classList.add('visible');
}
