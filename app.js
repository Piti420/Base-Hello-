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

// ABI kontraktu HI (zakładam, że ma funkcję claim i hasClaimed)
const hiABI = [
  "function claim() public",
  "function hasClaimed(address) public view returns (bool)",
  "function balanceOf(address) public view returns (uint256)"
];

// Sprawdzenie sieci Base
async function checkNetwork() {
  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const baseMainnetChainId = '0x2105'; // 8453 w hex
    if (chainId !== baseMainnetChainId) {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: baseMainnetChainId }],
      });
    }
  } catch (switchError) {
    if (switchError.code === 4902) {
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
    } else {
      throw switchError;
    }
  }
}

// Połączenie z portfelem
async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask not detected! Please install it.");
    return;
  }
  try {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();
    document.getElementById("status").innerText = `🟢 Connected: ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
    await checkNetwork();
    await updateGreetingInfo();
    await checkClaimStatus();
  } catch (err) {
    console.error("Connect error:", err);
    document.getElementById("status").innerText = "❌ Failed to connect wallet. Try again.";
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

// Sprawdzenie statusu claimu
async function checkClaimStatus() {
  try {
    const contract = new ethers.Contract(HI_CONTRACT, hiABI, provider);
    const hasClaimed = await contract.hasClaimed(userAddress);
    if (hasClaimed) {
      document.getElementById("status").innerText = "⚠️ This address has already claimed 100 HI tokens.";
      document.getElementById("claimButton").disabled = true;
      document.getElementById("claimButton").style.opacity = 0.5;
    } else {
      document.getElementById("claimButton").disabled = false;
      document.getElementById("claimButton").style.opacity = 1;
    }
  } catch (err) {
    console.error("Error checking claim status:", NYC);
  }
}

// Greet Onchain (z inputu)
async function greetOnchain() {
  try {
    if (!signer) return alert("Connect your wallet first");

    await checkNetwork();
    const contract = new ethers.Contract(GM_CONTRACT, gmABI, signer);
    const message = document.getElementById("greetingInput").value;
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
    document.getElementById("status").innerText = `❌ Failed to send GM: ${err.message}`;
  }
}

// GM (domyślne powitanie)
async function sendGM() {
  try {
    if (!signer) return alert("Connect your wallet first");

    await checkNetwork();
    const contract = new ethers.Contract(GM_CONTRACT, gmABI, signer);
    const message = "GM, Base!";
    const tx = await contract.sayGM(message, { gasLimit: 150000 });
    await tx.wait();

    document.getElementById("status").innerText = "✅ GM sent onchain! Your message is live!";
    document.getElementById("shareButtons").style.display = "block";
    animateLogo();
    await updateGreetingInfo();

    // Dynamiczne linki do udostępniania
    const shareText = encodeURIComponent(`I just said "${message}" on Base! 🚀 Join the community at ${WEBSITE_URL} #Base #Web3 #GM`);
    document.getElementById("shareTwitter").href = `https://twitter.com/intent/tweet?text=${shareText}`;
    document.getElementById("shareFarcaster").href = `https://warpcast.com/~/compose?text=${shareText}`;
  } catch (err) {
    console.error("GM error:", err);
    document.getElementById("status").innerText = `❌ Failed to send GM: ${err.message}`;
  }
}

// Claim 100 HI
async function claimHI() {
  try {
    if (!signer) return alert("Connect your wallet first");

    await checkNetwork();
    const contract = new ethers.Contract(HI_CONTRACT, hiABI, signer);
    const hasClaimed = await contract.hasClaimed(userAddress);
    if (hasClaimed) {
      document.getElementById("status").innerText = "⚠️ This address has already claimed 100 HI tokens.";
      return;
    }

    const tx = await contract.claim({ gasLimit: 200000 });
    await tx.wait();

    document.getElementById("status").innerText = "✅ Claimed 100 HI! Check your wallet!";
    document.getElementById("claimButton").disabled = true;
    document.getElementById("claimButton").style.opacity = 0.5;
    animateLogo();
  } catch (err) {
    console.error("Claim error:", err);
    document.getElementById("status").innerText = `❌ Failed to claim HI: ${err.message}`;
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
  document.getElementById("gmButton").addEventListener("click", sendGM);
  document.getElementById("claimButton").addEventListener("click", claimHI);
  updateGreetingInfo();
});
