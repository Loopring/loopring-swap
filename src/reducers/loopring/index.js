import {
    LOGIN_SUCCESS,
    GET_SUPPORTED_TOKENS_SUCCESS,
    GET_SUPPORTED_TOKENS_START,
    GET_SUPPORTED_TOKENS_END,
    GET_USER_BALANCES_SUCCESS,
    GET_USER_BALANCES_START,
    GET_USER_BALANCES_END,
    GET_SWAP_DATA_START,
    GET_SWAP_DATA_END,
    GET_SWAP_DATA_SUCCESS,
    GET_SUPPORTED_MARKETS_START,
    GET_SUPPORTED_MARKETS_END,
    GET_SUPPORTED_MARKETS_SUCCESS,
    POST_SWAP_START,
    POST_SWAP_END,
    LOGOUT,
    RESET_SWAP_DATA,
} from "../../actions/loopring";

const initialState = {
    account: null,
    wallet: null,
    exchange: null,
    supportedTokens: {
        loadings: 0,
        data: [],
    },
    supportedMarkets: {
        loadings: 0,
        data: [],
    },
    balances: {
        loadings: 0,
        data: [],
    },
    swap: {
        loadings: 0,
        data: {},
    },
    swapSubmission: {
        loadings: 0,
    },
};

export const loopringReducer = (state = initialState, action) => {
    const { type } = action;
    switch (type) {
        case LOGIN_SUCCESS: {
            return {
                ...state,
                account: action.account,
                wallet: action.wallet,
                exchange: action.exchange,
            };
        }
        case GET_SUPPORTED_TOKENS_START: {
            return {
                ...state,
                supportedTokens: {
                    ...state.supportedTokens,
                    loadings: state.supportedTokens.loadings + 1,
                },
            };
        }
        case GET_SUPPORTED_TOKENS_END: {
            return {
                ...state,
                supportedTokens: {
                    ...state.supportedTokens,
                    loadings: state.supportedTokens.loadings - 1,
                },
            };
        }
        case GET_SUPPORTED_TOKENS_SUCCESS: {
            return {
                ...state,
                supportedTokens: {
                    ...state.supportedTokens,
                    data: action.supportedTokens,
                },
            };
        }
        case GET_SUPPORTED_MARKETS_START: {
            return {
                ...state,
                supportedMarkets: {
                    ...state.supportedMarkets,
                    loadings: state.supportedMarkets.loadings + 1,
                },
            };
        }
        case GET_SUPPORTED_MARKETS_END: {
            return {
                ...state,
                supportedMarkets: {
                    ...state.supportedMarkets,
                    loadings: state.supportedMarkets.loadings - 1,
                },
            };
        }
        case GET_SUPPORTED_MARKETS_SUCCESS: {
            return {
                ...state,
                supportedMarkets: {
                    ...state.supportedMarkets,
                    data: action.supportedMarkets,
                },
            };
        }
        case GET_USER_BALANCES_START: {
            return {
                ...state,
                balances: {
                    ...state.balances,
                    loadings: state.balances.loadings + 1,
                },
            };
        }
        case GET_USER_BALANCES_END: {
            return {
                ...state,
                balances: {
                    ...state.balances,
                    loadings: state.balances.loadings - 1,
                },
            };
        }
        case GET_USER_BALANCES_SUCCESS: {
            return {
                ...state,
                balances: {
                    ...state.balances,
                    data: action.balances,
                },
            };
        }
        case GET_SWAP_DATA_START: {
            return {
                ...state,
                swap: {
                    ...state.swap,
                    loadings: state.swap.loadings + 1,
                },
            };
        }
        case GET_SWAP_DATA_END: {
            return {
                ...state,
                swap: {
                    ...state.swap,
                    loadings: state.swap.loadings - 1,
                },
            };
        }
        case GET_SWAP_DATA_SUCCESS: {
            return {
                ...state,
                swap: {
                    ...state.swap,
                    data: {
                        averageFillPrice: action.averageFillPrice,
                        slippagePercentage: action.slippagePercentage,
                        maximumAmount: action.maximumAmount,
                        feePercentage: action.feePercentage,
                    },
                },
            };
        }
        case POST_SWAP_START: {
            return {
                ...state,
                swapSubmission: {
                    ...state.swapSubmission,
                    loadings: state.swapSubmission.loadings + 1,
                },
            };
        }
        case POST_SWAP_END: {
            return {
                ...state,
                swapSubmission: {
                    ...state.swapSubmission,
                    loadings: state.swapSubmission.loadings - 1,
                },
            };
        }
        case RESET_SWAP_DATA: {
            return {
                ...state,
                swap: {
                    loadings: 0,
                    data: {},
                },
            };
        }
        case LOGOUT: {
            return {
                ...initialState,
                supportedTokens: state.supportedTokens,
                supportedMarkets: state.supportedMarkets,
            };
        }
        default: {
            return state;
        }
    }
};
