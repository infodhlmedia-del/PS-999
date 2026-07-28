import { API_BASE_URL } from './config';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
export const loginUser = async (mobile, password) => {
    try {
        const response = await fetch(`${API_BASE_URL}/userLogin/login.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mobile: mobile,
                password: password,
            }),
        });

        const rawText = await response.text();
        try {
            const data = JSON.parse(rawText);
            return data;
        } catch (e) {
            console.error('JSON Parse Error:', e);
            // Some PHP servers return text before JSON, let's try to find JSON in the string
            const jsonMatch = rawText.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid JSON: ' + rawText.substring(0, 50));
        }
    } catch (error) {
        console.error('Login API Error:', error);
        throw error;
    }
};

export const AdminContactDetailes = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/OtherDetailes/AdminContactDetailes.php`);
        const text = await response.text();
        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('Admin Contact Detailes JSON Parse Error:', e);
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Admin Contact Detailes JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Admin Contact Detailes API Error:', error);
        throw error;
    }
}

export const registerUser = async (username, password, mobile) => {
    try {
        const response = await fetch(`${API_BASE_URL}/userLogin/register.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password,
                mobile: mobile,
            }),
        });

        const text = await response.text();
        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('Register JSON Parse Error:', e);
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Register JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Register API Error:', error);
        throw error;
    }
};

export const getWalletBalance = async (mobile, userId = null) => {
    try {
        const response = await fetch(`${API_BASE_URL}/userLogin/balance.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mobile: mobile,
                user_id: userId,
            }),
        });

        const text = await response.text();
        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('Wallet Balance JSON Parse Error:', e);
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) return JSON.parse(jsonMatch[0]);
            throw new Error('Invalid Balance JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Get Wallet Balance API Error:', error);
        throw error;
    }
};

export const getDateTime = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/userLogin/dateTime.php`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Get Date/Time API Error:', error);
        throw error;
    }
};

export const getMarkets = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/Reguler/read/market.php`);

        const rawText = await response.text();

        try {
            const data = JSON.parse(rawText);
            return data;
        } catch (e) {
            console.error('Markets JSON Parse Error:', e);
            const jsonMatch = rawText.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Markets JSON: ' + rawText.substring(0, 50));
        }
    } catch (error) {
        console.error('Get Markets API Error:', error);
        throw error;
    }
};


export const getBetHistory = async (userId, firstDate, lastDate) => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/OtherDetailes/betHistory.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                firstdate: firstDate,
                lastdate: lastDate,
            }),
        });

        const text = await response.text();

        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('Bet History JSON Parse Error:', e);
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Bet History JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Get Bet History API Error:', error);
        throw error;
    }
};

export const bidhistory = async (user_id, firstdate, lastdate) => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/OtherDetailes/betHistory.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "user_id": user_id,
                "firstdate": firstdate,
                "lastdate": lastdate
            }),
        });

        const text = await response.text();

        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('Place Bet JSON Parse Error:', e);
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Place Bet JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Place Bet API Error:', error);
        throw error;
    }
};


// export const getFundRequestHistory = async (userId) => {
//     try {
//         const response = await fetch(`${API_BASE_URL}/website/OtherDetailes/UserAddPointsRequests.php`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//                 user_id: userId,
//             }),
//         });

//         const text = await response.text();

//         try {
//             const data = JSON.parse(text);
//             return data;
//         } catch (e) {
//             console.error('Fund Request JSON Parse Error:', e);
//             const jsonMatch = text.match(/\{.*\}/);
//             if (jsonMatch) {
//                 return JSON.parse(jsonMatch[0]);
//             }
//             throw new Error('Invalid Fund Request JSON: ' + text.substring(0, 50));
//         }
//     } catch (error) {
//         console.error('Get Fund Request History API Error:', error);
//         throw error;
//     }
// };


export const getWithdrawRequestHistory = async (userId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/OtherDetailes/UserWithdrawPointsRequests.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
            }),
        });

        const text = await response.text();

        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('Withdraw Request JSON Parse Error:', e);
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Withdraw Request JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Get Withdraw Request History API Error:', error);
        throw error;
    }
};


export const updateBankDetails = async (details) => {
    try {
        const body = JSON.stringify({
            user_id: details.user_id,
            username: details.username,
            action: details.action,
            bank_name: details.bank_name,
            ac_holder_name: details.ac_holder_name,
            ac_number: details.ac_number,
            ifsc_code: details.ifsc_code,
            upi: details.upi,
            paytm: details.paytm,
            google_pay: details.google_pay,
            phone_pay: details.phone_pay,
        });


        const response = await fetch(`${API_BASE_URL}/website/OtherDetailes/paymentDetailesUpdate.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: body,
        });

        const text = await response.text();


        try {
            const data = JSON.parse(text);
            if (data && (data.status === true || data.status === 'true' || data.status === 'success')) {
                // Return latest bank details on success
                const latestData = await getBankDetails(details.user_id, details.username);
                return {
                    status: true,
                    message: data.message || 'Updated successfully',
                    ...(latestData.data || latestData)
                };
            }
            return data;
        } catch (e) {
            console.error('Update Bank Details JSON Parse Error:', e);
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                if (data && (data.status === true || data.status === 'true' || data.status === 'success')) {
                    const latestData = await getBankDetails(details.user_id, details.username);
                    return {
                        status: true,
                        message: data.message || 'Updated successfully',
                        ...(latestData.data || latestData)
                    };
                }
                return data;
            }
            throw new Error('Invalid Update Bank Details JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Update Bank Details API Error:', error);
        throw error;
    }
};


export const getBankDetails = async (userId, username) => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/OtherDetailes/BankDetailesAddAndGet.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                username: username,
            }),
        });

        const text = await response.text();

        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('Get/Insert Bank Details JSON Parse Error:', e);
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Bank Details JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Get Bank Details API Error:', error);
        throw error;
    }
};

// Deprecated: getBankDetails1 is now synonymous with getBankDetails
export const getBankDetails1 = getBankDetails;


export const getUserProfile = async (userId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/OtherDetailes/myProfile.php?user_id=${userId}`);

        const text = await response.text();

        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('Profile JSON Parse Error:', e);
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Profile JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Get Profile API Error:', error);
        throw error;
    }
};


//All Games

export const getSingleDigitGame = async (UserId, Username, Numbers, Amounts, market_name, market_id, session) => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/Reguler/insert/BetDataInsertSingleAnk.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "user_id": UserId,
                "username": Username,
                "numbers": Numbers,
                "amounts": Amounts,
                "market_name": market_name,
                "market_id": market_id,
                "session": session
            }),
        });

        const text = await response.text();

        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('Place Bet JSON Parse Error:', e);
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Place Bet JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Place Bet API Error:', error);
        throw error;
    }
};


export const JodiGame = async (UserId, Username, Numbers, Amounts, market_name, market_id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/Reguler/insert/BetDataInsertJodi.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "user_id": UserId,
                "username": Username,
                "numbers": Numbers,
                "amounts": Amounts,
                "market_name": market_name,
                "market_id": market_id,
            }),
        });

        const text = await response.text();

        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('Place Bet JSON Parse Error:', e);
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Place Bet JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Place Bet API Error:', error);
        throw error;
    }
};



export const SinglePatti = async (UserId, Username, Numbers, Amounts, market_name, market_id, session) => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/Reguler/insert/BetDataInsertSinglePatti.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "user_id": UserId,
                "username": Username,
                "numbers": Numbers,
                "amounts": Amounts,
                "market_name": market_name,
                "market_id": market_id,
                "session": session
            }),
        });

        const text = await response.text();

        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('Place Bet JSON Parse Error:', e);
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Place Bet JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Place Bet API Error:', error);
        throw error;
    }
};



export const DoublePatti = async (UserId, Username, Numbers, Amounts, market_name, market_id, session) => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/Reguler/insert/BetDataInsertDoublePatti.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "user_id": UserId,
                "username": Username,
                "numbers": Numbers,
                "amounts": Amounts,
                "market_name": market_name,
                "market_id": market_id,
                "session": session
            }),
        });

        const text = await response.text();

        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('Place Bet JSON Parse Error:', e);
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Place Bet JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Place Bet API Error:', error);
        throw error;
    }
};



export const TriplePatti = async (UserId, Username, Numbers, Amounts, market_name, market_id, session) => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/Reguler/insert/BetDataInsertTriplePatti.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "user_id": UserId,
                "username": Username,
                "numbers": Numbers,
                "amounts": Amounts,
                "market_name": market_name,
                "market_id": market_id,
                "session": session
            }),
        });

        const text = await response.text();

        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('Place Bet JSON Parse Error:', e);
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Place Bet JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Place Bet API Error:', error);
        throw error;
    }
};


export const spdptp = async (UserId, Username, Bids, market_name, market_id, total_amount) => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/Reguler/insert/BetDataInsert_SP_DP_TP.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "user_id": UserId,
                "username": Username,
                "bids": Bids,
                "market_name": market_name,
                "market_id": market_id,
                "total_amount": total_amount
            }),
        });

        const text = await response.text();

        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('Place Bet JSON Parse Error:', e);
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Place Bet JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Place Bet API Error:', error);
        throw error;
    }
};



export const placeSPMotorBet = async (UserId, Username, Bids, market_name, market_id, total_amount, pana_name) => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/Reguler/insert/BetDataInsertSP_Motor.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "user_id": UserId,
                "username": Username,
                "bids": Bids,
                "market_id": market_id,
                "market_name": market_name,
                "total_amount": total_amount,
                "pana_name": pana_name
            }),
        });

        const text = await response.text();

        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('Place Bet JSON Parse Error:', e);
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Place Bet JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Place Bet API Error:', error);
        throw error;
    }
};


export const placeDPMotorBet = async (UserId, Username, Bids, market_name, market_id, total_amount) => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/Reguler/insert/BetDataInsertDP_Motor.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "user_id": UserId,
                "username": Username,
                "bids": Bids,
                "market_id": market_id,
                "market_name": market_name,
                "total_amount": total_amount,
            }),
        });

        const text = await response.text();

        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('Place Bet JSON Parse Error:', e);
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Place Bet JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Place Bet API Error:', error);
        throw error;
    }
};


export const placeOddEvenBet = async (UserId, Username, Bids, market_name, market_id, total_amount) => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/Reguler/insert/BetDataInsertOddEven.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "user_id": UserId,
                "username": Username,
                "bids": Bids,
                "market_id": market_id,
                "market_name": market_name,
                "total_amount": total_amount,
            }),
        });

        const text = await response.text();

        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('Place Bet JSON Parse Error:', e);
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Place Bet JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Place Bet API Error:', error);
        throw error;
    }
};


export const placeRedJodiBet = async (UserId, Username, Bids, market_name, market_id, total_amount) => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/Reguler/insert/BetDataInsertRedJodi.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "user_id": UserId,
                "username": Username,
                "bids": Bids,
                "market_id": market_id,
                "market_name": market_name,
                "total_amount": total_amount,
            }),
        });

        const text = await response.text();

        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('Place Bet JSON Parse Error:', e);
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Place Bet JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Place Bet API Error:', error);
        throw error;
    }
};


export const placeHalfSangamABet = async (UserId, Username, Bids, market_name, market_id, total_amount, session, pana_name) => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/Reguler/insert/BetDataInsertHalfSangamA.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "user_id": UserId,
                "username": Username,
                "bids": Bids,
                "market_id": market_id,
                "market_name": market_name,
                "total_amount": total_amount,
                "session": session,
                "pana_name": pana_name
            }),
        });

        const text = await response.text();

        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('Place Bet JSON Parse Error:', e);
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Place Bet JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Place Bet API Error:', error);
        throw error;
    }
};


export const placeHalfSangamBBet = async (UserId, Username, Bids, market_name, market_id, total_amount, session, pana_name) => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/Reguler/insert/BetDataInsertHalfSangamB.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "user_id": UserId,
                "username": Username,
                "bids": Bids,
                "market_id": market_id,
                "market_name": market_name,
                "total_amount": total_amount,
                "session": session,
                "pana_name": pana_name
            }),
        });

        const text = await response.text();

        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('Place Bet JSON Parse Error:', e);
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Place Bet JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Place Bet API Error:', error);
        throw error;
    }
};


export const placeFullSangamBet = async (UserId, Username, Bids, market_name, market_id, total_amount, open_closed) => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/Reguler/insert/BetDataInsertFullSangam.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "user_id": UserId,
                "username": Username,
                "bids": Bids,
                "market_id": market_id,
                "market_name": market_name,
                "total_amount": total_amount,
                "open_closed": open_closed,
                "pana_name": "Full Sangam"
            }),
        });

        const text = await response.text();

        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('Place Bet JSON Parse Error:', e);
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Place Bet JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Place Bet API Error:', error);
        throw error;
    }
};


export const addfund = async (UserId, Username, total_amount) => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/OtherDetailes/BalanceAdd.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "user_id": UserId,
                "username": Username,
                "amount": total_amount
            }),
        });

        const text = await response.text();

        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('Add Fund JSON Parse Error:', e);
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Add Fund JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Add Fund API Error:', error);
        throw error;
    }
};

export const withdrawfund = async (UserId, Username, total_amount, typeofpay) => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/OtherDetailes/BalanceWithdrawal.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "user_id": UserId,
                "username": Username,
                "request_amount": total_amount,
                "request_payment_method": typeofpay
            }),
        });

        const text = await response.text();

        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('Withdraw Fund JSON Parse Error:', e);
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Withdraw Fund JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Withdraw Fund API Error:', error);
        throw error;
    }
};


//ps startline Dashboard


export const starlinegetMarkets = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/Starlines/read/market.php`);
        const rawText = await response.text();

        try {
            const data = JSON.parse(rawText);
            return data;
        } catch (e) {
            console.error('Markets JSON Parse Error:', e);
            const jsonMatch = rawText.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Markets JSON: ' + rawText.substring(0, 50));
        }
    } catch (error) {
        console.error('Get Markets API Error:', error);
        throw error;
    }
};


//ps startline Games

export const starlineSingleDigit = async (user_id, username, numbers, amounts, market_name, market_id, session, session_time) => {

    try {

        const response = await fetch(`${API_BASE_URL}/website/Starlines/insert/BetDataInsertSingleAnk.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "user_id": user_id,
                "username": username,
                "numbers": numbers,
                "amounts": amounts,
                "market_name": market_name,
                "market_id": market_id,
                "session": session,
                "session_time": session_time
            }),
        });
        const rawText = await response.text();

        try {
            const data = JSON.parse(rawText);
            return data;
        } catch (e) {
            console.error('Markets JSON Parse Error:', e);
            const jsonMatch = rawText.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Markets JSON: ' + rawText.substring(0, 50));
        }

    } catch (error) {
        console.error('Get Markets API Error:', error);
        throw error;
    }

}


export const StarLineSinglePanaGame = async (user_id, username, numbers, amounts, market_name, market_id, session, session_time) => {

    try {

        const response = await fetch(`${API_BASE_URL}/website/Starlines/insert/BetDataInsertSinglePatti.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "user_id": user_id,
                "username": username,
                "numbers": numbers,
                "amounts": amounts,
                "market_name": market_name,
                "market_id": market_id,
                "session": session,
                "session_time": session_time
            }),
        });
        const rawText = await response.text();

        try {
            const data = JSON.parse(rawText);
            return data;
        } catch (e) {
            console.error('Markets JSON Parse Error:', e);
            const jsonMatch = rawText.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Markets JSON: ' + rawText.substring(0, 50));
        }

    } catch (error) {
        console.error('Get Markets API Error:', error);
        throw error;
    }

}


export const StarlineDoublePana = async (user_id, username, numbers, amounts, market_name, market_id, session, session_time) => {

    try {
        const response = await fetch(`${API_BASE_URL}/website/Starlines/insert/BetDataInsertDoublePatti.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "user_id": user_id,
                "username": username,
                "numbers": numbers,
                "amounts": amounts,
                "market_name": market_name,
                "market_id": market_id,
                "session": session,
                "session_time": session_time
            })
        });
        const rawText = await response.text();

        try {
            const data = JSON.parse(rawText);
            return data;
        } catch (e) {
            console.error('Markets JSON Parse Error:', e);
            const jsonMatch = rawText.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Markets JSON: ' + rawText.substring(0, 50));
        }

    } catch (error) {
        console.error('Get Markets API Error:', error);
        throw error;
    }

}


export const StarLineTripplePana = async (user_id, username, numbers, amounts, market_name, market_id, session, session_time) => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/Starlines/insert/BetDataInsertTriplePatti.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "user_id": user_id,
                "username": username,
                "numbers": numbers,
                "amounts": amounts,
                "market_name": market_name,
                "market_id": market_id,
                "session": session,
                "session_time": session_time
            }),
        });
        const rawText = await response.text();

        try {
            const data = JSON.parse(rawText);
            return data;
        } catch (e) {
            console.error('Markets JSON Parse Error:', e);
            const jsonMatch = rawText.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Markets JSON: ' + rawText.substring(0, 50));
        }

    } catch (error) {
        console.error('Get Markets API Error:', error);
        throw error;
    }
}


export const StarlineSPDPTP = async (UserId, Username, Bids, market_name, market_id, total_amount, session_time) => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/Starlines/insert/BetDataInsert_SP_DP_TP.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "user_id": UserId,
                "username": Username,
                "bids": Bids,
                "market_name": market_name,
                "market_id": market_id,
                "total_amount": total_amount,
                "session_time": session_time
            }),
        });

        const rawText = await response.text();

        try {
            const data = JSON.parse(rawText);
            return data;
        } catch (e) {
            console.error('Markets JSON Parse Error:', e);
            const jsonMatch = rawText.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Markets JSON: ' + rawText.substring(0, 50));
        }
    } catch (error) {
        console.error('Get Markets API Error:', error);
        throw error;
    }
}


export const StarlineSPMotor = async (userId, username, bids, totalAmount, marketName, marketId, session, sessionTime) => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/Starlines/insert/BetDataInsertSP_Motor.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "user_id": userId,
                "username": username,
                "bids": bids,
                "total_amount": totalAmount,
                "market_name": marketName,
                "market_id": marketId,
                "session": session,
                "session_time": sessionTime
            }),
        });

        const rawText = await response.text();

        try {
            const data = JSON.parse(rawText);
            return data;
        } catch (e) {
            console.error('Markets JSON Parse Error:', e);
            const jsonMatch = rawText.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Markets JSON: ' + rawText.substring(0, 50));
        }
    } catch (error) {
        console.error('Get Markets API Error:', error);
        throw error;
    }
}


export const StarlineDpMotar = async (userId, username, bids, totalAmount, marketName, marketId, session, sessionTime) => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/Starlines/insert/BetDataInsertDP_Motor.php`, {

            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "user_id": userId,
                "username": username,
                "bids": bids,
                "total_amount": totalAmount,
                "market_name": marketName,
                "market_id": marketId,
                "session": session,
                "session_time": sessionTime
            })


        });
        const rawText = await response.text();

        try {
            const data = JSON.parse(rawText);
            return data;
        } catch (e) {
            console.error('Markets JSON Parse Error:', e);
            const jsonMatch = rawText.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Markets JSON: ' + rawText.substring(0, 50));
        }
    } catch (error) {
        console.error('Get Markets API Error:', error);
        throw error;
    }
}


export const StarlineEvenOdd = async (userId, username, bids, totalAmount, marketName, marketId, session, sessionTime) => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/Starlines/insert/BetDataInsertOddEven.php`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "user_id": userId,
                "username": username,
                "bids": bids,
                "total_amount": totalAmount,
                "market_name": marketName,
                "market_id": marketId,
                "session": session,
                "session_time": sessionTime
            })
        });
        const rawText = await response.text();

        try {
            const data = JSON.parse(rawText);
            return data;
        } catch (e) {
            console.error('Markets JSON Parse Error:', e);
            const jsonMatch = rawText.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Markets JSON: ' + rawText.substring(0, 50));
        }
    } catch (error) {
        console.error('Get Markets API Error:', error);
        throw error;
    }
}


// ps jackpot 


export const psJackpotMarket = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/Jackpot/read/market.php`, {

        });
        const rawText = await response.text();

        try {
            const data = JSON.parse(rawText);
            return data;
        } catch (e) {
            console.error('Markets JSON Parse Error:', e);
            const jsonMatch = rawText.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Markets JSON: ' + rawText.substring(0, 50));
        }
    } catch (error) {
        console.error('Get Markets API Error:', error);
        throw error;
    }
}



// Jackpot Games

export const JackpotSingleGame = async (userId, username, number, amounts, market_name, marketId, session, session_time) => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/Jackpot/insert/BetDataInsertSingleAnk.php`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "user_id": userId,
                "username": username,
                "numbers": number,
                "amounts": amounts,
                "market_name": market_name,
                "market_id": marketId,
                "session": session,
                "session_time": session_time
            })
        });
        const rawText = await response.text();

        try {
            const data = JSON.parse(rawText);
            return data;
        } catch (e) {
            console.error('Markets JSON Parse Error:', e);
            const jsonMatch = rawText.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Markets JSON: ' + rawText.substring(0, 50));
        }
    } catch (error) {
        console.error('Get Markets API Error:', error);
        throw error;
    }
}

export const JackpotJodiGame = async (userId, username, number, amounts, market_name, marketId, session, session_time) => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/Jackpot/insert/BetDataInsertJodi.php`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "user_id": userId,
                "username": username,
                "numbers": number,
                "amounts": amounts,
                "market_name": market_name,
                "market_id": marketId,
                "session": session,
                "session_time": session_time
            })
        });
        const rawText = await response.text();

        try {
            const data = JSON.parse(rawText);
            return data;
        } catch (e) {
            console.error('Markets JSON Parse Error:', e);
            const jsonMatch = rawText.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Markets JSON: ' + rawText.substring(0, 50));
        }
    } catch (error) {
        console.error('Get Markets API Error:', error);
        throw error;
    }
}

//ps starline history 


export const getStarlineResults = async (market_id, date = null) => {
    try {
        const body = { "market_id": market_id };
        if (date) {
            body["date"] = date;
        }

        const response = await fetch(`${API_BASE_URL}/website/Starlines/read/Results.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const text = await response.text();
        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Results JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Get Starline Results API Error:', error);
        throw error;
    }
};


export const psJackpotResult = async (marketId = null) => {

    try {
        const body = {};
        if (marketId) {
            body.market_id = marketId.toString();
        }
        const response = await fetch(`${API_BASE_URL}/website/Jackpot/read/Results.php`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
        const rawText = await response.text();

        try {
            const data = JSON.parse(rawText);
            return data;
        } catch (e) {
            console.error('Markets JSON Parse Error:', e);
            const jsonMatch = rawText.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Markets JSON: ' + rawText.substring(0, 50));
        }
    } catch (error) {
        console.error('Get Markets API Error:', error);
        throw error;
    }

}


export const result = async (market_id, date = null) => {
    try {
        const body = { "market_id": market_id };
        if (date) {
            body["date"] = date;
        }

        const response = await fetch(`${API_BASE_URL}/website/Reguler/read/Results.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const text = await response.text();

        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('Result JSON Parse Error:', e);
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Result JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Result API Error:', error);
        throw error;
    }
};

//datevise result
export const dateViseResult = async (DATE) => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/Reguler/read/TodayResults.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "date": DATE,
                "current_datee": DATE
            }),
        });
        const text = await response.text();
        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('Result JSON Parse Error:', e);
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Result JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Result API Error:', error);
        throw error;
    }
}

export const dateviseResultPJackpot = async (DATE) => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/Jackpot/read/TodayResults.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "date": DATE,
                "current_datee": DATE
            }),
        });
        const text = await response.text();
        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('Result JSON Parse Error:', e);
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Result JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Result API Error:', error);
        throw error;
    }
}


export const dateviseResultPStarline = async (DATE) => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/Starlines/read/TodayResults.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "date": DATE,
                "current_datee": DATE
            }),
        });
        const text = await response.text();
        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('Result JSON Parse Error:', e);
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Result JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Result API Error:', error);
        throw error;
    }
}

// Game Rates

export const getMarketRate = async () => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/website/Reguler/read/marketRate.php`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Market Rate API Error:", error);
        throw error;
    }
};


export const getJackPot = async () => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/website/Jackpot/read/marketRate.php`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Jackpot API Error:", error);
        throw error;
    }
};


export const sarline = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/Starlines/read/marketRate.php`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        }
        );

        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Jackpot API Error:", error);
        throw error;
    }
}

export const changePassword = async (userId, oldPass, newPass, confirmPass) => {
    try {
        const response = await fetch(`${API_BASE_URL}/userLogin/ChangePassword.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                old_pass: oldPass,
                new_pass: newPass,
                confirm_pass: confirmPass,
            }),
        });

        const text = await response.text();
        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('Change Password JSON Parse Error:', e);
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Change Password JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Change Password API Error:', error);
        throw error;
    }
};

export const sendOtp = async (mobile) => {
    try {
        let fcmToken = null;
        try {
            fcmToken = await registerForPushNotificationsAsync();
            console.log('[AUTH] FCM Token generated during sendOtp:', fcmToken);
            if (fcmToken) {
                await AsyncStorage.setItem('fcmToken', fcmToken);
            }
        } catch (err) {
            console.error('[AUTH] Token generation failed during sendOtp:', err);
        }

        const response = await fetch(`${API_BASE_URL}/userLogin/send_otp.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mobile: mobile,
                fcm_token: fcmToken,
            }),
        });

        const text = await response.text();
        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Send OTP API Error:', error);
        throw error;
    }
};

export const verifyOtp = async (mobile, otp) => {
    try {
        let fcmToken = null;
        try {
            fcmToken = await AsyncStorage.getItem('fcmToken');
        } catch (e) {
            console.error('[AUTH] Failed to get cached token for verify:', e);
        }

        const response = await fetch(`${API_BASE_URL}/userLogin/verify_otp.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mobile: mobile,
                otp: otp,
                fcm_token: fcmToken,
            }),
        });

        const text = await response.text();
        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Verify OTP API Error:', error);
        throw error;
    }
};


export const LoginWithMPin = async (mobile, password) => {
    try {
        const response = await fetch(`${API_BASE_URL}/userLogin/loginWithPin.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mobile: mobile,
                password: password,
            }),
        });

        const text = await response.text();
        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Login API Error:', error);
        throw error;
    }
};

export const paymentGetWay = async (user_id, username, mobile, amount) => {
    try {

        const response = await fetch(`${API_BASE_URL}/paymentGetWay/deposit.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: user_id,
                username: username,
                mobile: mobile,
                amount: amount,
            }),
        });

        const text = await response.text();
        // console.log('paymentGetWay raw response:', text);
        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            if (response.ok) {
                return { status: true, msg: text };
            }
            throw new Error('Invalid JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error('Payment GetWay API Error:', error);
        throw error;
    }
};


//notifications Api

export const notifications = async (user_id, firstdate, lastdate) => {
    try {
        const response = await fetch(`${API_BASE_URL}/website/OtherDetailes/Notifications.php`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: user_id,
                firstdate: firstdate,
                lastdate: lastdate,
            }),
        });

        const text = await response.text();
        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('Notifications JSON Parse Error:', e);
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Notifications JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error("Notifications API Error:", error);
        throw error;
    }
}

// payment status

export const paymentStatus = async (order_id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/paymentGetWay/PayinStatusCheck.php?order_id=${order_id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "order_id": order_id,
            }),
        });

        const text = await response.text();
        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('Payment Status JSON Parse Error:', e);
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid Payment Status JSON: ' + text.substring(0, 50));
        }
    } catch (error) {
        console.error("Payment Status API Error:", error);
        throw error;
    }
}

// QrcodePayment 

export const QrcodePayment = async (user_id,username,amount,utr_trs_id) => {
    try{
        const response = await fetch(`${API_BASE_URL}/QrPaymentGetWay/QrPaymentAdd.php`,{
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "user_id": user_id,
                "username": username,
                "amount": amount,
                "utr_trs_id": utr_trs_id,
            }),
        });

        const text = await response.text();
        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('QrcodePayment JSON Parse Error:', e);
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid QrcodePayment JSON: ' + text.substring(0, 50));
        }
    }catch(error){
        console.error("QrcodePayment API Error:", error);
        throw error;
    }
}

// UserQrAddPointsRequests HISTORY 

export const UserQrAddPointsRequests = async (user_id) => {
    try{
        const response = await fetch(`${API_BASE_URL}/website/OtherDetailes/UserQrAddPointsRequests.php`,{
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "user_id": user_id,
            }),
        });

        const text = await response.text();
        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('UserQrAddPointsRequests JSON Parse Error:', e);
            const jsonMatch = text.match(/\{.*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid UserQrAddPointsRequests JSON: ' + text.substring(0, 50));
        }
    }catch(error){
        console.error("UserQrAddPointsRequests API Error:", error);
        throw error;
    }
}