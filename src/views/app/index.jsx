import React, { useState, useEffect } from "react";
import { Layout } from "../../components/layout";
import { ThemeProvider } from "styled-components";
import { GlobalStyle } from "./styled";
import { useDispatch, useSelector } from "react-redux";
import MewConnect from "@myetherwallet/mewconnect-web-client";
import Web3Modal from "web3modal";
import { INFURA_URL, CHAIN_ID } from "../../env";
import { useCallback } from "react";
import { Drawer } from "../../components/drawer";
import { initializeWeb3 } from "../../actions/web3";
import { ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
    login,
    getSupportedTokens,
    getUserBalances,
    getSupportedMarkets,
    logout,
} from "../../actions/loopring";
import { Flex, Box } from "reflexbox";
import { Swapper } from "../swapper";
import { FullScreenOverlay } from "../../components/full-screen-overlay";
import moment from "moment";
import momentIt from "moment/locale/it";
import { IntlProvider } from "react-intl";
import en from "../../i18n/messages/en.json";
import it from "../../i18n/messages/it.json";
import { switchLanguage } from "../../actions/i18n";
import { InvalidChainId } from "../../components/invalid-chain-id";
import WalletConnectProvider from "@walletconnect/web3-provider";
import Authereum from "authereum";

// setting up moment locales
moment.locale("it", momentIt);
const localizedMessages = { en, it };

const commonColors = {
    error: "#c62828",
    warning: "#FF6F00",
    primary: "#1c60ff",
    success: "#00c853",
    disabled: "rgb(202, 209, 213)",
    textDisabled: "rgba(5, 5, 5, 0.565)",
    textButton: "#d6e0ff",
};

const light = {
    ...commonColors,
    background: "#edf2f7",
    foreground: "#dfe6ef",
    border: "#b9ccdf",
    textLight: "#999999",
    text: "#0e062d",
    textInverted: "#F1F9D2",
    shadow: "rgba(0, 0, 0, 0.4)",
    placeholder: "#999999",
};

const dark = {
    ...commonColors,
    background: "#18191b",
    foreground: "#0d0d0d",
    border: "#23262a",
    textLight: "#737373",
    text: "#F1F9D2",
    textInverted: "#0e062d",
    shadow: "rgba(255, 255, 255, 0.1)",
    placeholder: "#737373",
};

const lightWeb3ModalTheme = {
    background: light.background,
    main: light.text,
    secondary: light.text,
    hover: light.foreground,
};

const darkWeb3ModalTheme = {
    background: dark.background,
    main: dark.text,
    secondary: dark.text,
    hover: dark.foreground,
};

const web3ModalOptions = {
    cacheProvider: true,
    providerOptions: {
        mewconnect: {
            package: MewConnect,
            options: {
                infuraId: INFURA_URL,
            },
        },
        walletconnect: {
            package: WalletConnectProvider,
            options: {
                infuraId: INFURA_URL,
            },
        },
        authereum: {
            package: Authereum,
            options: {
                infuraId: INFURA_URL,
            },
        },
    },
};

export const getWeb3Modal = () => new Web3Modal(web3ModalOptions);

export let selectedTheme = light;

export const App = () => {
    const dispatch = useDispatch();

    const {
        selectedLanguage,
        web3Instance,
        chainId,
        selectedAccount: selectedWeb3Account,
        loopringAccount,
        loopringWallet,
        supportedTokens,
        supportedMarkets,
    } = useSelector((state) => ({
        selectedLanguage: state.i18n.selectedLanguage,
        web3Instance: state.web3.instance,
        chainId: state.web3.chainId,
        selectedAccount: state.web3.selectedAccount,
        loopringAccount: state.loopring.account,
        loopringWallet: state.loopring.wallet,
        supportedTokens: state.loopring.supportedTokens.data,
        supportedMarkets: state.loopring.supportedMarkets.data,
    }));

    const [lightTheme, setLightTheme] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => {
        dispatch(getSupportedMarkets());
    }, [dispatch]);

    useEffect(() => {
        if (supportedMarkets && supportedMarkets.length > 0) {
            dispatch(getSupportedTokens(supportedMarkets));
        }
    }, [dispatch, supportedMarkets]);

    useEffect(() => {
        if (
            loopringAccount &&
            loopringWallet &&
            supportedTokens &&
            supportedTokens.length > 0
        ) {
            dispatch(
                getUserBalances(
                    loopringAccount,
                    loopringWallet,
                    supportedTokens
                )
            );
        }
    }, [dispatch, loopringAccount, loopringWallet, supportedTokens]);

    // setting up local storage-saved theme
    useEffect(() => {
        const cachedTheme =
            localStorage.getItem("loopring-swap-theme") || "light";
        const lightTheme = cachedTheme === "light";
        setLightTheme(lightTheme);
        web3ModalOptions.theme = lightTheme
            ? lightWeb3ModalTheme
            : darkWeb3ModalTheme;
    }, [dispatch]);

    // setting up local storage-saved language
    useEffect(() => {
        const cachedLanguage = localStorage.getItem("loopring-swap-language");
        if (cachedLanguage && cachedLanguage in localizedMessages) {
            dispatch(switchLanguage(cachedLanguage));
        }
    }, [dispatch]);

    const handleDrawerOpenClick = useCallback(() => {
        setDrawerOpen(true);
    }, []);

    const handleDrawerClose = useCallback(() => {
        setDrawerOpen(false);
    }, []);

    const handleConnectWallet = useCallback(() => {
        dispatch(initializeWeb3());
    }, [dispatch]);

    const handleLogin = useCallback(() => {
        dispatch(login(web3Instance, selectedWeb3Account));
    }, [dispatch, selectedWeb3Account, web3Instance]);

    const handleLogout = useCallback(() => {
        dispatch(logout());
    }, [dispatch]);

    const handleOverlayClick = useCallback(() => {
        setDrawerOpen(false);
    }, []);

    const handleThemeChange = useCallback(() => {
        const newLightTheme = !lightTheme;
        const textTheme = newLightTheme ? "light" : "dark";
        localStorage.setItem("loopring-swap-theme", textTheme);
        web3ModalOptions.theme = newLightTheme
            ? lightWeb3ModalTheme
            : darkWeb3ModalTheme;
        setLightTheme(newLightTheme);
        selectedTheme = newLightTheme ? light : dark;
    }, [lightTheme]);

    const handleSelectedLanguageChange = useCallback(
        (language) => {
            localStorage.setItem("loopring-swap-language", language);
            dispatch(switchLanguage(language));
        },
        [dispatch]
    );

    return (
        <IntlProvider
            locale={selectedLanguage}
            messages={localizedMessages[selectedLanguage]}
        >
            <ThemeProvider theme={lightTheme ? light : dark}>
                <GlobalStyle />
                <Layout onDrawerOpenClick={handleDrawerOpenClick}>
                    <Flex
                        width="100%"
                        height="100%"
                        justifyContent="center"
                        alignItems="center"
                    >
                        <Box maxWidth="420px" p="16px">
                            {!chainId || chainId === CHAIN_ID ? (
                                <Swapper
                                    onConnectWalletClick={handleDrawerOpenClick}
                                />
                            ) : (
                                <InvalidChainId />
                            )}
                        </Box>
                    </Flex>
                </Layout>
                <FullScreenOverlay
                    open={drawerOpen}
                    onClick={handleOverlayClick}
                />
                <Drawer
                    open={drawerOpen}
                    onClose={handleDrawerClose}
                    onConnectWallet={handleConnectWallet}
                    selectedWeb3Account={selectedWeb3Account}
                    onLogin={handleLogin}
                    onLogout={handleLogout}
                    loggedIn={!!loopringAccount}
                    darkTheme={!lightTheme}
                    onDarkThemeChange={handleThemeChange}
                    selectedLanguage={selectedLanguage}
                    onSelectedLanguageChange={handleSelectedLanguageChange}
                />
                <ToastContainer
                    className="custom-toast-root"
                    toastClassName="custom-toast-container"
                    bodyClassName="custom-toast-body"
                    position="top-right"
                    closeButton={false}
                    transition={Slide}
                    limit={3}
                />
            </ThemeProvider>
        </IntlProvider>
    );
};
