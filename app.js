// Konfiguracja adresów kontraktów
const GM_CONTRACT = "0x06B17752e177681e5Df80e0996228D7d1dB2F61b";
const WEBSITE_URL = "https://piti420.github.io/Base-Hello";

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

// Sprawdzenie sieci Base
async function checkNetwork() {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask not detected");
    }
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const baseMainnetChainId = '0x2105'; // 8453 w hex
    console.log("Current chainId:", chainId);
    if (chainId !== baseMainnetChainId) {
      console.log("Switching to Base Mainnet...");
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: baseMainnetChainId }],
      });
      toastr.info("Switched to Base Mainnet");
    }
  } catch (switchError) {
    if (switchError.code === 4902) {
      console.log("Adding Base Mainnet to MetaMask...");
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x2105',
          chainName: 'Base Mainnet',
          rpcUrls: ['https://mainnet.base.org'],
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          blockExplorerUrls: ['https://basescan.org']
        }],
      });
      toastr.info("Added Base Mainnet to MetaMask");
    } else {
      console.error("Network switch error:", switchError);
      toastr.error(`Failed to switch network: ${switchError.message}`);
      throw switchError;
    }
  }
}

// Połączenie z portfelem
async function connectWallet() {
  if (!window.ethereum) {
    toastr.error("MetaMask not detected! Please install it.");
    return;
  }
  try {
    console.log("Connecting wallet...");
    provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();
    toastr.success(`Connected: ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`);
    await checkNetwork();
    await updateGreetingInfo();
  } catch (err) {
    console.error("Connect error:", err);
    toastr.error(`Failed to connect wallet: ${err.message}`);
  }
}

// Aktualizacja informacji o powitaniach
async function updateGreetingInfo() {
  if (!provider) {
    console.warn("Provider not initialized, skipping updateGreetingInfo");
    return;
  }
  try {
    await checkNetwork();
    const contract = new ethers.Contract(GM_CONTRACT, gmABI, provider);
    const greeting = await contract.getGreeting();
    const count = await contract.getGreetingCount();
    const lastGreeter = await contract.getLastGreeter();
    toastr.info(`Latest Greeting: "${greeting}" | Total Greetings: ${count} | Last Greeter: ${lastGreeter.slice(0, 6)}...${lastGreeter.slice(-4)}`);
  } catch (err) {
    console.error("Error fetching greeting info:", err);
    // Nie pokazuj błędu użytkownikowi
  }
}

// Greet Onchain (z inputu)
async function greetOnchain() {
  try {
    if (!signer) return toastr.error("Connect your wallet first");

    await checkNetwork();
    const contract = new ethers.Contract(GM_CONTRACT, gmABI, signer);
    const message = document.getElementById("greetingInput").value;
    if (!message) return toastr.error("Please enter a greeting message");
    console.log("Sending greet transaction:", message);
    const tx = await contract.sayGM(message, { gasLimit: 150000 });
    toastr.info("Awaiting transaction confirmation...");
    await tx.wait();

    toastr.success("Greeted onchain! Your message is live!");
    document.getElementById("shareButtons").style.display = "block";
    animateLogo();
    await updateGreetingInfo();

    const shareText = encodeURIComponent(`I just said "${message}" on Base! 🚀 Join the community at ${WEBSITE_URL} #Base #Web3 #GM`);
    document.getElementById("shareTwitter").href = `https://twitter.com/intent/tweet?text=${shareText}`;
    document.getElementById("shareFarcaster").href = `https://warpcast.com/~/compose?text=${shareText}`;
  } catch (err) {
    console.error("Greet error:", err);
    toastr.error(`Failed to send GM: ${err.message}`);
  }
}

// GM (domyślne powitanie)
async function sendGM() {
  try {
    if (!signer) return toastr.error("Connect your wallet first");

    await checkNetwork();
    const contract = new ethers.Contract(GM_CONTRACT, gmABI, signer);
    const message = "GM, Base!";
    console.log("Sending GM transaction...");
    const tx = await contract.sayGM(message, { gasLimit: 150000 });
    toastr.info("Awaiting transaction confirmation...");
    await tx.wait();

    toastr.success("GM sent onchain! Your message is live!");
    document.getElementById("shareButtons").style.display = "block";
    animateLogo();
    await updateGreetingInfo();

    const shareText = encodeURIComponent(`I just said "${message}" on Base! 🚀 Join the community at ${WEBSITE_URL} #Base #Web3 #GM`);
    document.getElementById("shareTwitter").href = `https://twitter.com/intent/tweet?text=${shareText}`;
    document.getElementById("shareFarcaster").href = `https://warpcast.com/~/compose?text=${shareText}`;
  } catch (err) {
    console.error("GM error:", err);
    toastr.error(`Failed to send GM: ${err.message}`);
  }
}

// Animacja logo
function animateLogo() {
  const logo = document.getElementById("helloLogo");
  if (!logo) return;

  logo.classList.add("pulse");
  setTimeout(() => logo.classList.remove("pulse"), 1000);
}

// Inicjalizacja
window.addEventListener("DOMContentLoaded", () => {
  console.log("Initializing event listeners...");
  const connectButton = document.getElementById("connectWallet");
  const greetButton = document.getElementById("greetButton");
  const gmButton = document.getElementById("gmButton");

  if (!connectButton || !greetButton || !gmButton) {
    console.error("One or more buttons not found in DOM");
    toastr.error("Error: Buttons not found. Check HTML.");
    return;
  }

  connectButton.addEventListener("click", () => {
    console.log("Connect Wallet clicked");
    connectWallet();
  });
  greetButton.addEventListener("click", () => {
    console.log("Greet Onchain clicked");
    greetOnchain();
  });
  gmButton.addEventListener("click", () => {
    console.log("GM button clicked");
    sendGM();
  });
});
