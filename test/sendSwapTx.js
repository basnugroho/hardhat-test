const { expect, assert } = require("chai");
const { ethers, waffle } = require("hardhat");

const { addressFactory, addressRouter, addressFrom, addressTo } = require("../utils/AddressList");
const { erc20ABI, factoryABI, routerABI } = require("../utils/AbiList");

describe("SendSwapTx", function () {
    let provider, 
    contractFactory, 
    contractRouter, 
    contractToken, 
    decimals, 
    amountIn;

    // connecting to provider
    provider = new ethers.providers.JsonRpcProvider("https://eth-mainnet.g.alchemy.com/v2/XSw0YDy7RTU7KkbmyTdwlPWj6fsC7yUp");

    // contract addresses
    contractFactory = new ethers.Contract(addressFactory, factoryABI, provider);
    contractRouter = new ethers.Contract(addressRouter, routerABI, provider);
    contractToken = new ethers.Contract(addressFrom, erc20ABI, provider);

    const amountInHuman = "1";
    amountIn = ethers.utils.parseUnits(amountInHuman, decimals).toString();
    
    // get price information
    const getAmountsOut = async () => {
        decimals = await contractToken.decimals();
        
        const amountsOut = await contractRouter.getAmountsOut(amountIn, [addressFrom, addressTo]);
        return amountsOut[1].toString();
    };

    it("connects to a provider, factory, token and router", () => {
        assert(provider._isProvider, "provider is not a provider");
        expect(contractFactory.address).to.equal("0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f");
        expect(contractRouter.address).to.equal("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D");
        expect(contractToken.address).to.equal("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
    });

    it("gets the price of amountsOut", async () => {
        const amount = await getAmountsOut();
        assert(amount);
    });

    it("sends a transaction, i.e. swaps a token", async () => {
        const [ownerSigner] = await ethers.getSigners();

        const mainnetForkUniswaoRouter = new ethers.Contract(
            addressRouter, 
            routerABI, 
            ownerSigner
        );

        const myAddress = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
        const amountOut = await getAmountsOut();

        const txSwap = await mainnetForkUniswaoRouter.swapExactTokensForTokens(
            amountIn,
            amountOut,
            [addressFrom, addressTo],
            myAddress, // address to
            Date.now() + 1000 * 60 * 5,
            {
                gasLimit: 200000,
                gasPrice: ethers.utils.parseUnits("5.5", "gwei"),
            } //gas
        );

        assert(txSwap.hash);

        const mainnetForkProvider = waffle.provider;
        const txReceipt = await mainnetForkProvider.getTransactionReceipt(
            txSwap.hash
        );
        console.log("");
        console.log("SWAP TRANSACTION");
        console.log(txSwap);

        console.log("");
        console.log("TRANSACTION RECEIPT");
        console.log(txReceipt);
    });
});

