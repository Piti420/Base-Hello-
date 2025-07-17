// Konfiguracja adresów kontraktów
const GM_CONTRACT = "0x06B17752e177681e5Df80e0996228D7d1dB2F61b";
const HI_CONTRACT = "0xdEeBc11cB7eDAe91aD9a6165ab385B6D04a839E0";
const WEBSITE_URL = "https://piti420.github.io/Base-Hello"; // Zaktualizowany URL

let provider;
let signer;
let userAddress;

// Konfiguracja toastr
toastr.options = {
  positionClass: "toast-top-right",
  timeOut: 5000,
  closeButton: true,
  progressBar: true
};

// ABI kontraktu GM
const gmABI = [
  "function sayGM(string memory _message) public",
  "function getGreeting() public view returns (string memory)",
  "function getLastGreeter() public view returns (address)",
  "function getGreetingCount() public view returns (uint256)",
  "event NewGM(address indexed greeter, string message)"
];

// ABI kontraktu HI (zgodne z Basescan)
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
      toastr.info("Switched to Base Mainnet");
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
      toastr.info("Added Base Mainnet to MetaMask");
    } else {
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
    provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();
    toastr.success(`Connected: ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`);
    await checkNetwork();
    await checkContractBalance();
    await checkClaimStatus();
    await updateGreetingInfo();
  } catch (err) {
    console.error("Connect error:", err);
    toastr.error(`Failed to connect wallet: ${err.message}`);
  }
}

// Sprawdzenie salda kontraktu HI
async function checkContractBalance() {
  try {
    const contract = new ethers.Contract(HI_CONTRACT, hiABI, provider);
    const balance = await contract.balanceOf(HI_CONTRACT);
    const balanceInHI = ethers.utils.formatEther(balance);
    if (parseFloat(balanceInHI) < 100) {
      toastr.warning(`Contract balance is low (${balanceInHI} HI). Contact the owner to refill.`);
      document.getElementById("claimButton").disabled = true;
      document.getElementById("claimButton").style.opacity = 0.5;
    }
  } catch (err) {
    console.error("Error checking contract balance:", err);
    toastr.error(`Failed to check contract balance: ${err.message}`);
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

// Sprawdzenie statusu claimu
async function checkClaimStatus() {
  if (!userAddress || !provider) {
    console.warn("User address or provider not initialized, skipping checkClaimStatus");
    return;
  }
  try {
    await checkNetwork();
    const contract = new ethers.Contract(HI_CONTRACT, hiABI, provider);
    const hasClaimed = await contract.hasClaimed(userAddress);
    if (hasClaimed) {
      toastr.warning("This address has already claimed 100 HI tokens.");
      document.getElementById("claimButton").disabled = true;
      document.getElementById("claimButton").style.opacity = 0.5;
    } else {
      document.getElementById("claimButton").disabled = false;
      document.getElementById("claimButton").style.opacity = 1;
    }
  } catch (err) {
    console.error("Error checking claim status:", err);
    toastr.error(`Failed to check claim status: ${err.message}`);
    document.getElementById("claimButton").disabled = true;
    document.getElementById("claimButton").style.opacity = 0.5;
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
    const tx = await contract.sayGM(message, { gasLimit: 150000 });
    toastr.info("Awaiting transaction confirmation...");
    await tx.wait();

    toastr.success("Greeted onchain! Your message is live!");
    document.getElementById("shareButtons").style.display = "block";
    animateLogo();
    await updateGreetingInfo();

    // Dynamiczne linki do udostępniania
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
    const tx = await contract.sayGM(message, { gasLimit: 150000 });
    toastr.info("Awaiting transaction confirmation...");
    await tx.wait();

    toastr.success("GM sent onchain! Your message is live!");
    document.getElementById("shareButtons").style.display = "block";
    animateLogo();
    await updateGreetingInfo();

    // Dynamiczne linki do udostępniania
    const shareText = encodeURIComponent(`I just said "${message}" on Base! 🚀 Join the community at ${WEBSITE_URL} #Base #Web3 #GM`);
    document.getElementById("shareTwitter").href = `https://twitter.com/intent/tweet?text=${shareText}`;
    document.getElementById("shareFarcaster").href = `https://warpcast.com/~/compose?text=${shareText}`;
  } catch (err) {
    console.error("GM error:", err);
    toastr.error(`Failed to send GM: ${err.message}`);
  }
}

// Claim 100 HI
async function claimHI() {
  try {
    if (!signer) return toastr.error("Connect your wallet first");

    await checkNetwork();
    const contract = new ethers.Contract(HI_CONTRACT, hiABI, signer);
    const hasClaimed = await contract.hasClaimed(userAddress);
    if (hasClaimed) {
      toastr.warning("This address has already claimed 100 HI tokens.");
      document.getElementById("claimButton").disabled = true;
      document.getElementById("claimButton").style.opacity = 0.5;
      return;
    }

    // Sprawdź saldo kontraktu przed claimem
    const balance = await contract.balanceOf(HI_CONTRACT);
    const balanceInHI = ethers.utils.formatEther(balance);
    if (parseFloat(balanceInHI) < 100) {
      toastr.error("Contract does not have enough HI tokens to claim.");
      document.getElementById("claimButton").disabled = true;
      document.getElementById("claimButton").style.opacity = 0.5;
      return;
    }

    const tx = await contract.claim({ gasLimit: 200000 });
    toastr.info("Awaiting transaction confirmation...");
    await tx.wait();

    toastr.success("Claimed 100 HI! Check your wallet!");
    document.getElementById("claimButton").disabled = true;
    document.getElementById("claimButton").style.opacity = 0.5;
    animateLogo();
    await checkClaimStatus();
  } catch (err) {
    console.error("Claim error:", err);
    toastr.error(`Failed to claim HI: ${err.message}`);
    document.getElementById("claimButton").disabled = true;
    document.getElementById("claimButton").style.opacity = 0.5;
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
  document.getElementById("gmButton").addEventListener("click", () => {
    console.log("GM button clicked"); // Debugowanie
    sendGM();
  });
  document.getElementById("claimButton").addEventListener("click", () => {
    console.log("Claim button clicked"); // Debugowanie
    claimHI();
  });
});
