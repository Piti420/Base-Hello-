
const providerOptions = {
  walletconnect: {
    package: window.WalletConnectProvider.default,
    options: {
      infuraId: '1c5d2f11f5c846e2b24e5b7b2fdb00cf'
    }
  }
};

const web3Modal = new window.Web3Modal.default({
  cacheProvider: true,
  providerOptions
});

let signer;
let address;
const gmContractAddress = "0x06B17752e177681e5Df80e0996228D7d1dB2F61b";
const hiTokenAddress = "0xdEeBc11cB7eDAe91aD9a6165ab385B6D04a839E0";

const gmAbi = [
  "function gm() public",
  "function gmCount() view returns (uint256)"
];

const hiAbi = [
  "function claim() public"
];

async function connectWallet() {
  const instance = await web3Modal.connect();
  const provider = new ethers.providers.Web3Provider(instance);
  signer = provider.getSigner();
  address = await signer.getAddress();
}

async function sayGM() {
  await connectWallet();
  const contract = new ethers.Contract(gmContractAddress, gmAbi, signer);
  const tx = await contract.gm();
  await tx.wait();
  updateGMCount();
}

async function claimHI() {
  await connectWallet();
  const contract = new ethers.Contract(hiTokenAddress, hiAbi, signer);
  const tx = await contract.claim();
  await tx.wait();
  alert("You claimed 100 HI!");
}

async function updateGMCount() {
  const provider = new ethers.providers.JsonRpcProvider("https://mainnet.base.org");
  const contract = new ethers.Contract(gmContractAddress, gmAbi, provider);
  const count = await contract.gmCount();
  document.getElementById("gmCount").innerText = count.toString();
}

updateGMCount();
