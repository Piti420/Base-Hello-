
let provider;
let signer;
let gmContract;
let hiToken;

const GM_CONTRACT_ADDRESS = "0x06B17752e177681e5Df80e0996228D7d1dB2F61b";
const HI_TOKEN_ADDRESS = "0xdEeBc11cB7eDAe91aD9a6165ab385B6D04a839E0";

const gmABI = [
  "function gm() public",
  "function getGMCount(address) view returns (uint256)"
];

const hiABI = [
  "function claim() public"
];

async function connectWallet() {
  if (window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();

    gmContract = new ethers.Contract(GM_CONTRACT_ADDRESS, gmABI, signer);
    hiToken = new ethers.Contract(HI_TOKEN_ADDRESS, hiABI, signer);

    document.getElementById("status").innerText = "Wallet connected";
  } else {
    document.getElementById("status").innerText = "Please install MetaMask";
  }
}

async function greetOnchain() {
  if (!signer || !gmContract) {
    document.getElementById("status").innerText = "Connect wallet first.";
    return;
  }

  try {
    const tx = await gmContract.gm();
    await tx.wait();
    document.getElementById("status").innerText = "GM sent successfully!";
  } catch (error) {
    console.error(error);
    document.getElementById("status").innerText = error.message.includes("already greeted") 
      ? "You can only greet once every 24h." 
      : "Failed to send GM.";
  }
}

async function claimTokens() {
  if (!signer || !hiToken) {
    document.getElementById("status").innerText = "Connect wallet first.";
    return;
  }

  try {
    const tx = await hiToken.claim();
    await tx.wait();
    document.getElementById("status").innerText = "Successfully claimed 100 HI!";
  } catch (error) {
    console.error(error);
    document.getElementById("status").innerText = error.message.includes("already claimed") 
      ? "You have already claimed your HI tokens." 
      : "Failed to claim tokens.";
  }
}

document.getElementById("connectButton").onclick = connectWallet;
document.getElementById("greetButton").onclick = greetOnchain;
document.getElementById("claimButton").onclick = claimTokens;
