// Konfiguracja adresów kontraktów
const GM_CONTRACT = "0x06B17752e177681e5Df80e0996228D7d1dB2F61b";
const HI_CONTRACT = "0xdEeBc11cB7eDAe91aD9a6165ab385B6D04a839E0"; // Claim 100 HI

let provider;
let signer;
let userAddress;

// ABI kontraktu GM
const gmABI = [
  "function sayGM(string memory _message) public",
  "function getGreeting() public view returns (string memory)",
  "function getLastGreeter() public view returns (address)",
  "function getGreetingCount() public view returns (uint256)",
  "event NewGM(address indexed greeter, string message)"
];

// ABI kontraktu HI (claim)
const hiABI = [
  "function claim() public"
];

// Sprawdzenie sieci Base
async function checkNetwork() {
  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  const baseMainnetChainId = '0x2105'; // 8453 w hex
  const baseSepoliaChainId = '0x14a34'; // 84532 w hex
  if (chainId !== baseMainnetChainId && chainId !== baseSepoliaChainId) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: baseMainnetChainId }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: baseMainnetChainId,
            chainName: 'Base Mainnet',
            rpcUrls: ['https://mainnet.base.org'],
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18
            },
            blockExplorerUrls: ['https://basescan.org']
          }],
        });
      }
    }
  }
}

// Połączenie z portfelem
async function connectWallet() {
  if (window.ethereum) {
    try {
      provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      signer = provider.getSigner();
      userAddress = await signer.getAddress();
      document.getElementById("status").innerText = `🟢 Connected: ${userAddress}`;
      await checkNetwork();
    } catch (err) {
      console.error("Connect error:", err);
      document.getElementById("status").innerText = "❌ Failed to connect wallet.";
    }
  } else {
    alert("MetaMask not detected!");
  }
}

// Greet Onchain z gasLimit
async function greetOnchain() {
  try {
    if (!signer) return alert("Connect your wallet first");

    await checkNetwork();
    const contract = new ethers.Contract(GM_CONTRACT, gmABI, signer);
    const message = "Hello from Base"; // Możesz dodać input w HTML, by użytkownik wpisał wiadomość
    const tx = await contract.sayGM(message, { gasLimit: 150000 });
    await tx.wait();

    document.getElementById("status").innerText = "✅ Greeted onchain!";
    document.getElementById("shareButtons").style.display = "block";
    animateLogo();

    // Odczyt powitania
    const greeting = await contract.getGreeting();
    const count = await contract.getGreetingCount();
    document.getElementById("gmCount").innerText = `Current Greeting: ${greeting} | Total Greetings: ${count}`;
  } catch (err) {
    console.error("Greet error:", err);
    document.getElementById("status").innerText = "❌ Failed to send GM. Check wallet or try again.";
  }
}

// Claim 100 HI
async function claimHI() {
  try {
    if (!signer) return alert("Connect your wallet first");

    await checkNetwork();
    const contract = new ethers.Contract(HI_CONTRACT, hiABI, signer);
    const tx = await contract.claim({ gasLimit: 150000 });
    await tx.wait();

    document.getElementById("status").innerText = "✅ Claimed 100 HI!";
    animateLogo();
  } catch (err) {
    console.error("Claim error:", err);
    document.getElementById("status").innerText = "❌ Failed to claim HI.";
  }
}

// Animacja logo po sukcesie
function animateLogo() {
  const logo = document.getElementById("helloLogo");
  if (!logo) return;

  logo.classList.add("pulse");
  setTimeout(() => logo.classList.remove("pulse"), 1000);
}

// Przypnij event listenery
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("connectWallet").addEventListener("click", connectWallet);
  document.getElementById("greetButton").addEventListener("click", greetOnchain);
  document.getElementById("claimButton").addEventListener("click", claimHI);
});
