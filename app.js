// Konfiguracja adresów kontraktów
const GM_CONTRACT = "0x06B17752e177681e5Df80e0996228D7d1dB2F61b";
const HI_CONTRACT = "0xdEeBc11cB7eDAe91aD9a6165ab385B6D04a839E0";
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

// ABI kontraktu HI
const hiABI = [
  "function claim() public",
  "function hasClaimed(address) public view returns (bool)",
  "function balanceOf(address) public view returns (uint256)"
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
    if (!provider) throw new Error("Provider not initialized");
    await checkNetwork();
    const contract = new ethers.Contract(HI_CONTRACT, hiABI, provider);
    const balance = await contract.balanceOf(HI_CONTRACT);
    const balanceInHI = ethers.utils.formatEther(balance);
    console.log(`Contract balance: ${balanceInHI} HI`);
    if (parseFloat(balanceInHI) < 100) {
      toastr.warning(`Contract balance is low (${balanceInHI} HI). Contact the owner to refill.`);
      document.getElementById("claimButton").disabled = true;
      document.getElementById("claimButton").style.opacity = 0.5;
    } else {
      toastr.info(`Contract balance: ${balanceInHI} HI`);
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
    console.log("Checking hasClaimed for:", userAddress);
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
    if (err.code === "CALL_EXCEPTION") {
      toastr.error(`Failed to check claim status: Ensure you're on Base Mainnet (Chain ID: 8453) and the contract is valid.`);
    } else {
      toastr.error(`Failed to check claim status: ${err.message}`);
    }
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

// Claim 100 HI
async function claimHI() {
  try {
    if (!signer) return toastr.error("Connect your wallet first");

    await checkNetwork();
    const contract = new ethers.Contract(HI_CONTRACT, hiABI, signer);
    console.log("Checking hasClaimed for:", userAddress);
    const hasClaimed = await contract.hasClaimed(userAddress);
    if (hasClaimed) {
      toastr.warning("This address has already claimed 100 HI tokens.");
      document.getElementById("claimButton").disabled = true;
      document.getElementById("claimButton").style.opacity = 0.5;
      return;
    }

    console.log("Checking contract balance...");
    const balance = await contract.balanceOf(HI_CONTRACT);
    const balanceInHI = ethers.utils.formatEther(balance);
    if (parseFloat(balanceInHI) < 100) {
      toastr.error(`Contract does not have enough HI tokens to claim (${balanceInHI} HI). Contact the owner to refill.`);
      document.getElementById("claimButton").disabled = true;
      document.getElementById("claimButton").style.opacity = 0.5;
      return;
    }

    console.log("Sending claim transaction...");
    const tx = await contract.claim({ gasLimit: 300000 });
    toastr.info("Awaiting transaction confirmation...");
    await tx.wait();

    toastr.success("Claimed 100 HI! Check your wallet!");
    document.getElementById("claimButton").disabled = true;
    document.getElementById("claimButton").style.opacity = 0.5;
    animateLogo();
    await checkClaimStatus();
  } catch (err) {
    console.error("Claim error:", err);
    if (err.code === "CALL_EXCEPTION") {
      toastr.error(`Failed to claim HI: Contract call failed. Ensure you're on Base Mainnet (Chain ID: 8453) and the contract has enough tokens.`);
    } else if (err.code === -32603) {
      toastr.error(`Failed to claim HI: Transaction failed, possibly due to insufficient contract balance or gas.`);
    } else {
      toastr.error(`Failed to claim HI: ${err.message}`);
    }
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
  console.log("Initializing event listeners...");
  const connectButton = document.getElementById("connectWallet");
  const greetButton = document.getElementById("greetButton");
  const gmButton = document.getElementById("gmButton");
  const claimButton = document.getElementById("claimButton");

  if (!connectButton || !greetButton || !gmButton || !claimButton) {
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
  claimButton.addEventListener("click", () => {
    console.log("Claim button clicked");
    claimHI();
  });
});
