import React from "react";
import Wallet from "../../lightcone/wallet";
import {
    lightconeGetAccount,
    getExchangeInfo,
    getOrderId,
    submitOrderToLightcone,
} from "../../lightcone/api/LightconeAPI";
import { toast } from "react-toastify";
import { getTokenInfo } from "../../lightcone/api/v1/tokeninfo/get";
import { FormattedMessage } from "react-intl";
import { getLoopringApiKey } from "../../utils";
import BigNumber from "bignumber.js";
import { getDepth } from "../../lightcone/api/v1/depth/get";
import { getMarketInfo } from "../../lightcone/api/v1/marketinfo/get";
import config from "../../lightcone/config";
import { getBalances } from "../../lightcone/api/v1/balances";
import { getFeeRates } from "../../lightcone/api/v1/fee-rates";
import { weiToEther } from "../../utils";
import { getEthNonce } from "../../lightcone/api/v1/ethnonce/get";
import { getRecommendedGasPrice } from "../../lightcone/api/v1/recommendedGasPrice/get";

// auth status

export const GET_AUTH_STATUS_SUCCESS = "GET_AUTH_STATUS_SUCCESS";
export const GET_AUTH_STATUS_START = "GET_AUTH_STATUS_START";
export const GET_AUTH_STATUS_END = "GET_AUTH_STATUS_END";

export const getAuthStatus = (address) => async (dispatch) => {
    try {
        dispatch({ type: GET_AUTH_STATUS_START });
        let needsRegistration = false;
        try {
            await lightconeGetAccount(address);
        } catch (error) {
            needsRegistration = true;
        }
        dispatch({ type: GET_AUTH_STATUS_SUCCESS, needsRegistration });
    } catch (error) {
        toast.error(<FormattedMessage id="error.auth.status" />);
        console.error("error checking auth status", error);
    } finally {
        dispatch({ type: GET_AUTH_STATUS_END });
    }
};

// registration

export const register = (web3Instance, ethereumAccount) => async (dispatch) => {
    try {
        const wallet = new Wallet("MetaMask", web3Instance, ethereumAccount);
        try {
            if (await lightconeGetAccount(wallet.address)) {
                toast.warn(
                    <FormattedMessage id="warn.register.existing.account" />
                );
                console.warn("the account is already registered");
                return;
            }
        } catch (error) {
            // silently fail if the account is yet to be created
        }
        const {
            exchangeAddress,
            onchainFees,
            chainId,
        } = await getExchangeInfo();
        const tokens = await getTokenInfo();
        const fee = new BigNumber(
            config.getFeeByType("create", onchainFees).fee
        ).plus(config.getFeeByType("deposit", onchainFees).fee);
        const { keyPair } = await wallet.generateKeyPair(exchangeAddress, 0);
        if (!keyPair || !keyPair.secretKey) {
            throw new Error("failed to generate key pair");
        }
        await wallet.createOrUpdateAccount(
            keyPair,
            {
                exchangeAddress,
                fee: fee.toString(),
                chainId: chainId,
                token: config.getTokenBySymbol("ETH", tokens),
                amount: "",
                permission: "",
                nonce: await getEthNonce(wallet.address),
                gasPrice: await getRecommendedGasPrice(),
            },
            true
        );
        toast.success(<FormattedMessage id="success.register" />);
    } catch (error) {
        toast.error(<FormattedMessage id="error.register" />);
        console.error("error registering user", error);
    }
};

// login

export const LOGIN_SUCCESS = "LOGIN_SUCCESS";

export const login = (web3Instance, selectedWeb3Account) => async (
    dispatch
) => {
    try {
        const wallet = new Wallet(
            "MetaMask",
            web3Instance,
            selectedWeb3Account
        );
        // custom notification in case the account is not registered
        let account;
        try {
            account = await lightconeGetAccount(selectedWeb3Account);
        } catch (error) {
            toast.warn(<FormattedMessage id="warn.account.not.found" />);
            console.warn("account not found");
            return;
        }
        const exchange = await getExchangeInfo();
        const { exchangeAddress } = exchange;
        const { keyPair } = await wallet.generateKeyPair(
            exchangeAddress,
            account.keyNonce
        );
        if (!keyPair) {
            // the user most probably aborted the signing
            console.warn("The user aborted the signing process");
            return;
        }
        const { publicKeyX, publicKeyY } = keyPair;
        if (
            account.publicKeyX !== publicKeyX ||
            account.publicKeyY !== publicKeyY
        ) {
            throw new Error(
                "api got and locally generated public keys don't match"
            );
        }
        wallet.keyPair = keyPair;
        wallet.accountId = account.accountId;
        dispatch({ type: LOGIN_SUCCESS, account, wallet, exchange });
    } catch (error) {
        toast.error(<FormattedMessage id="error.login" />);
        console.error("error initializing loopring", error);
    }
};

// logout

export const LOGOUT = "LOGOUT";

export const logout = () => ({ type: LOGOUT });

// get supported tokens

export const GET_SUPPORTED_TOKENS_START = "GET_SUPPORTED_TOKENS_START";
export const GET_SUPPORTED_TOKENS_END = "GET_SUPPORTED_TOKENS_END";
export const GET_SUPPORTED_TOKENS_SUCCESS = "GET_SUPPORTED_TOKENS_SUCCESS";

export const getSupportedTokens = (supportedMarkets) => async (dispatch) => {
    dispatch({ type: GET_SUPPORTED_TOKENS_START });
    try {
        const supportedTokens = await getTokenInfo();
        const filteredSupportedTokens = supportedTokens.reduce(
            (accumulator, supportedToken) => {
                const { tokenId } = supportedToken;
                if (
                    supportedMarkets.find(
                        (market) =>
                            market.quoteTokenId === tokenId ||
                            market.baseTokenId === tokenId
                    )
                ) {
                    accumulator.push(supportedToken);
                }
                return accumulator;
            },
            []
        );
        dispatch({
            type: GET_SUPPORTED_TOKENS_SUCCESS,
            supportedTokens: filteredSupportedTokens,
        });
    } catch (error) {
        toast.error(<FormattedMessage id="error.supported.tokens" />);
        console.error("error getting supported tokens", error);
    }
    dispatch({ type: GET_SUPPORTED_TOKENS_END });
};

// get supported markets

export const GET_SUPPORTED_MARKETS_START = "GET_SUPPORTED_MARKETS_START";
export const GET_SUPPORTED_MARKETS_END = "GET_SUPPORTED_MARKETS_END";
export const GET_SUPPORTED_MARKETS_SUCCESS = "GET_SUPPORTED_MARKETS_SUCCESS";

export const getSupportedMarkets = () => async (dispatch) => {
    dispatch({ type: GET_SUPPORTED_MARKETS_START });
    try {
        dispatch({
            type: GET_SUPPORTED_MARKETS_SUCCESS,
            supportedMarkets: await getMarketInfo(),
        });
    } catch (error) {
        toast.error(<FormattedMessage id="error.supported.markets" />);
        console.error("error getting supported markets", error);
    }
    dispatch({ type: GET_SUPPORTED_MARKETS_END });
};

// get user balances

export const GET_USER_BALANCES_START = "GET_USER_BALANCES_START";
export const GET_USER_BALANCES_END = "GET_USER_BALANCES_END";
export const GET_USER_BALANCES_SUCCESS = "GET_USER_BALANCES_SUCCESS";

export const getUserBalances = (account, wallet, supportedTokens) => async (
    dispatch
) => {
    dispatch({ type: GET_USER_BALANCES_START });
    try {
        const partialBalances = await getBalances(
            account.accountId,
            await getLoopringApiKey(wallet, account)
        );
        // we process the tokens with no balance too,
        // saving them with a 0 balance if necessary
        const allBalances = supportedTokens
            .filter((supportedToken) => supportedToken.enabled)
            .reduce((allBalances, supportedToken) => {
                const supportedTokenId = supportedToken.tokenId;
                const supportedTokenSymbol = supportedToken.symbol;
                const matchingBalance = partialBalances.find(
                    (balance) => balance.tokenId === supportedTokenId
                );
                const balance = matchingBalance
                    ? matchingBalance.totalAmount
                    : "0";
                allBalances.push({
                    id: supportedTokenId,
                    symbol: supportedTokenSymbol,
                    name: supportedToken.name,
                    address: supportedToken.address,
                    balance: weiToEther(
                        new BigNumber(balance),
                        supportedToken.decimals
                    ),
                    decimals: supportedToken.decimals,
                });
                return allBalances;
            }, [])
            .sort((a, b) => b.balance.minus(a.balance).toNumber());
        dispatch({ type: GET_USER_BALANCES_SUCCESS, balances: allBalances });
    } catch (error) {
        toast.error(<FormattedMessage id="error.user.balances" />);
        console.error("error getting user balances", error);
    }
    dispatch({ type: GET_USER_BALANCES_END });
};

// get current exchange rate

export const GET_SWAP_DATA_START = "GET_SWAP_DATA_START";
export const GET_SWAP_DATA_END = "GET_SWAP_DATA_END";
export const GET_SWAP_DATA_SUCCESS = "GET_SWAP_DATA_SUCCESS";

export const getSwapData = (
    wallet,
    account,
    baseToken,
    quoteToken,
    fromAmount,
    supportedTokens,
    selling
) => async (dispatch) => {
    dispatch({ type: GET_SWAP_DATA_START });
    try {
        const market = `${baseToken.symbol}-${quoteToken.symbol}`;
        let feePercentage = 0;
        if (wallet && account) {
            const wrappedFees = await getFeeRates(
                [market],
                account.accountId,
                await getLoopringApiKey(wallet, account)
            );
            feePercentage = new BigNumber(wrappedFees[0].takerRate).dividedBy(
                100000
            );
        }
        const { asks, bids } = await getDepth(market, 1, 1000, supportedTokens);
        const orders = selling ? bids : asks;
        const bestPrice = orders[0].price;
        const estimatedToAmount = selling
            ? new BigNumber(fromAmount).multipliedBy(bestPrice)
            : new BigNumber(fromAmount).dividedBy(bestPrice);
        // fetching all the orders required to fill the requested size
        let totalOrdersSize = new BigNumber("0");
        let averageFillPrice = new BigNumber("0");
        let weights = new BigNumber("0");
        for (let i = 0; i < orders.length; i++) {
            const order = orders[i];
            let adjustedOrderSize = new BigNumber(order.aggregatedSize);
            if (
                totalOrdersSize
                    .plus(adjustedOrderSize)
                    .isGreaterThan(estimatedToAmount)
            ) {
                adjustedOrderSize = estimatedToAmount.minus(totalOrdersSize);
            }
            const weight = adjustedOrderSize.dividedBy(estimatedToAmount);
            weights = weights.plus(weight);
            const weightedPrice = new BigNumber(order.price).multipliedBy(
                weight
            );
            averageFillPrice = averageFillPrice.plus(weightedPrice);
            totalOrdersSize = totalOrdersSize.plus(adjustedOrderSize);
            if (totalOrdersSize.isGreaterThanOrEqualTo(estimatedToAmount)) {
                break;
            }
        }
        let slippagePercentage = new BigNumber(averageFillPrice)
            .minus(bestPrice)
            .dividedBy(averageFillPrice)
            .multipliedBy("100");
        if (selling) {
            slippagePercentage = slippagePercentage.negated();
        }
        dispatch({
            type: GET_SWAP_DATA_SUCCESS,
            averageFillPrice: averageFillPrice,
            slippagePercentage,
            maximumAmount: orders.reduce(
                (totalSize, order) => totalSize.plus(order.aggregatedSize),
                new BigNumber("0")
            ),
            feePercentage,
        });
    } catch (error) {
        toast.error(<FormattedMessage id="error.swap.data" />);
        console.error("error getting swap data", error);
    } finally {
        dispatch({ type: GET_SWAP_DATA_END });
    }
};

// perform swap

export const POST_SWAP_START = "POST_SWAP_START";
export const POST_SWAP_END = "POST_SWAP_END";
export const POST_SWAP_SUCCESS = "POST_SWAP_SUCCESS";

export const postSwap = (
    account,
    wallet,
    exchange,
    fromToken,
    fromAmount,
    toToken,
    toAmount,
    supportedTokens,
    selling
) => async (dispatch) => {
    dispatch({ type: POST_SWAP_START });
    try {
        const apiKey = await getLoopringApiKey(wallet, account);
        const orderId = await getOrderId(
            account.accountId,
            fromToken.tokenId,
            apiKey
        );
        const validSince = new Date().getTime() / 1000 - 3600;
        const validUntil = new Date().getTime() / 1000 + 3600 * 24 * 10000;
        const signedOrder = wallet.submitOrder(
            supportedTokens,
            exchange.exchangeId,
            fromToken.address,
            toToken.address,
            fromAmount,
            toAmount,
            orderId,
            validSince,
            validUntil,
            config.getLabel(),
            !selling,
            "swap-ui"
        );
        if (!signedOrder) {
            // the user aborted the signing procedure
            return;
        }
        await submitOrderToLightcone(signedOrder, apiKey);
        toast.success(<FormattedMessage id="swap.success" />);
        dispatch({ type: POST_SWAP_SUCCESS });
    } catch (error) {
        toast.error(<FormattedMessage id="error.swap" />);
        console.error("error performing swap", error);
    } finally {
        dispatch({ type: POST_SWAP_END });
    }
};

// reset swap data

export const RESET_SWAP_DATA = "RESET_SWAP_DATA";

export const resetSwapData = () => ({
    type: RESET_SWAP_DATA,
});
