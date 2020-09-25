import React, { useRef, useState, useLayoutEffect } from "react";
import PropTypes from "prop-types";
import { Box } from "reflexbox";
import {
    faPlug,
    faLock,
    faLockOpen,
    faTimes,
    faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import { selectedTheme } from "../../views/app";
import { FormattedMessage } from "react-intl";
import {
    RootFlex,
    HeaderFlex,
    Icon,
    EllipsizedBox,
    CloseIcon,
    SummaryMessage,
} from "./styled";
import { Lrc } from "./sections/lrc";
import { Support } from "./sections/support";
import { TechnicalResources } from "./sections/technical-resources";
import { ExchangeInfo } from "./sections/exchange-info";
import { Settings } from "./sections/settings";
import { Button } from "../button";
import { useCallback } from "react";
import { getShortenedEthereumAddress } from "../../utils";

export const Drawer = ({
    open,
    onClose,
    onConnectWallet,
    selectedWeb3Account,
    onLogin,
    onLogout,
    loggedIn,
    darkTheme,
    onDarkThemeChange,
    selectedLanguage,
    onSelectedLanguageChange,
}) => {
    const container = useRef(null);

    const [icon, setIcon] = useState(faLock);
    const [iconColor, setIconColor] = useState("");
    const [summaryMessageKey, setSummaryMessageKey] = useState("placeholder");
    const [buttonMessageKey, setButtonMessageKey] = useState("placeholder");

    useLayoutEffect(() => {
        if (loggedIn) {
            setIcon(faLockOpen);
            setIconColor(selectedTheme.success);
            setSummaryMessageKey("drawer.wallet.connect.logout");
            setButtonMessageKey("drawer.wallet.connect.action.logout");
        } else if (selectedWeb3Account) {
            setIcon(faLock);
            setIconColor(selectedTheme.error);
            setSummaryMessageKey("drawer.wallet.connect.login");
            setButtonMessageKey("drawer.wallet.connect.action.login");
        } else {
            setIcon(faPlug);
            setIconColor(selectedTheme.primary);
            setSummaryMessageKey("drawer.wallet.connect.summary");
            setButtonMessageKey("drawer.wallet.connect.action.connect");
        }
    }, [loggedIn, selectedWeb3Account]);

    const handleButtonClick = useCallback(() => {
        if (loggedIn) {
            onLogout();
        } else if (selectedWeb3Account) {
            onLogin();
        } else {
            onConnectWallet();
        }
    }, [
        loggedIn,
        onConnectWallet,
        onLogin,
        onLogout,
        selectedWeb3Account,
    ]);

    return (
        <RootFlex
            flexDirection="column"
            alignItems="center"
            open={open}
            ref={container}
        >
            <HeaderFlex mb={3}>
                <EllipsizedBox>
                    {selectedWeb3Account ? (
                        getShortenedEthereumAddress(selectedWeb3Account)
                    ) : (
                        <FormattedMessage id="drawer.wallet.connect.header.connect" />
                    )}
                </EllipsizedBox>
                <Box ml={3} minWidth="auto">
                    <CloseIcon icon={faTimes} onClick={onClose} />
                </Box>
            </HeaderFlex>
            <Box mb={3}>
                <Icon icon={icon} color={iconColor} fontSize="40" />
            </Box>
            <Box px={4} mb={3} fontSize="12px" textAlign="center">
                <SummaryMessage>
                    <FormattedMessage id={summaryMessageKey} />
                </SummaryMessage>
            </Box>
            <Box px={4} mb={4}>
                <Button onClick={handleButtonClick}>
                    <FormattedMessage id={buttonMessageKey} />
                </Button>
            </Box>
            <Box width="100%" mb={2}>
                <Settings
                    darkTheme={darkTheme}
                    onDarkThemeChange={onDarkThemeChange}
                    selectedLanguage={selectedLanguage}
                    onSelectedLanguageChange={onSelectedLanguageChange}
                />
            </Box>
            <Box width="100%" mb={2}>
                <Lrc />
            </Box>
            <Box width="100%" mb={2}>
                <Support />
            </Box>
            <Box width="100%" mb={2}>
                <TechnicalResources />
            </Box>
            <Box width="100%" mb={2}>
                <ExchangeInfo />
            </Box>
        </RootFlex>
    );
};

Drawer.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onConnectWallet: PropTypes.func.isRequired,
    selectedWeb3Account: PropTypes.string,
    onLogin: PropTypes.func.isRequired,
    onLogout: PropTypes.func.isRequired,
    loggedIn: PropTypes.bool.isRequired,
    darkTheme: PropTypes.bool.isRequired,
    onDarkThemeChange: PropTypes.func.isRequired,
    selectedLanguage: PropTypes.string.isRequired,
    onSelectedLanguageChange: PropTypes.func.isRequired,
};
