// Konfiguracja adresów kontraktów
const GM_CONTRACT = "0x06B17752e177681e5Df80e0996228D7d1dB2F61b";
const HI_CONTRACT = "0xdEeBc11cB7eDAe91aD9a6165ab385B6D04a839E0";
const WEBSITE_URL = "https://yourusername.github.io/your-repo"; // Zastąp swoim URL-em GitHub Pages

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

// ABI kontraktu HI
const hiABI = ["function claim() public"];

// Sprawdzenie sieci Base
async function checkNetwork() {
  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  const baseMainnetChainId = '0x2105'; // 8453 w hex
  if (chainId !== baseMainnetChainId) {
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
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
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
      document.getElementById("status").innerText = `🟢 Connected: ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
      await checkNetwork();
      await updateGreetingInfo();
    } catch (err) {
      console.error("Connect error:", err);
      document.getElementById("status").innerText = "❌ Failed to connect wallet. Try again.";
    }
  } else {
    alert("MetaMask not detected! Please install it.");
  }
}

// Aktualizacja informacji o powitaniach
async function updateGreetingInfo() {
  try {
    const contract = new ethers.Contract(GM_CONTRACT, gmABI, provider);
    const greeting = await contract.getGreeting();
    const count = await contract.getGreetingCount();
    const lastGreeter = await contract.getLastGreeter();
    document.getElementById("gmCount").innerText = `Latest Greeting: "${greeting}" | Total Greetings: ${count} | Last Greeter: ${lastGreeter.slice(0, 6)}...${lastGreeter.slice(-4)}`;
  } catch (err) {
    console.error("Error fetching greeting info:", err);
    document.getElementById("gmCount").innerText = "⚠️ Unable to fetch greeting data.";
  }
}

// Greet Onchain
async function greetOnchain() {
  try {
    if (!signer) return alert("Connect your wallet first");

    await checkNetwork();
    const contract = new ethers.Contract(GM_CONTRACT, gmABI, signer);
    const message = document.getElementById("greetingInput").value || "Hello from Base";
    if (!message) return alert("Please enter a greeting message");
    const tx = await contract.sayGM(message, { gasLimit: 150000 });
    await tx.wait();

    document.getElementById("status").innerText = "✅ Greeted onchain! Your message is live!";
    document.getElementById("shareButtons").style.display = "block";
    animateLogo();
    await updateGreetingInfo();

    // Dynamiczne linki do udostępniania
    const shareText = encodeURIComponent(`I just said "${message}" on Base! 🚀 Join the community at ${WEBSITE_URL} #Base #Web3 #GM`);
    document.getElementById("shareTwitter").href = `https://twitter.com/intent/tweet?text=${shareText}`;
    document.getElementById("shareFarcaster").href = `https://warpcast.com/~/compose?text=${shareText}`;
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

    document.getElementById("status").innerText = "✅ Claimed 100 HI! Check your wallet!";
    animateLogo();
  } catch (err) {
    console.error("Claim error:", err);
    document.getElementById("status").innerText = "❌ Failed to claim HI. Try again.";
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
  document.getElementById("connectWallet").addEventListener("click", connectWallet);
  document.getElementById("greetButton").addEventListener("click", greetOnchain);
  document.getElementById("claimButton").addEventListener("click", claimHI);
  updateGreetingInfo(); // Wyświetl dane z kontraktu przy ładowaniu strony
});
