import React, { useEffect, useState } from 'react';

const Wallet = ({ setAccount, setBalance }) => {
    const [connectedAccount, setConnectedAccount] = useState('');

    useEffect(() => {
        const connectWallet = async () => {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const account = accounts[0];
                setConnectedAccount(account);
                setAccount(account);
            } catch (error) {
                console.error("Failed to connect wallet:", error);
            }
        };

        if (window.ethereum) {
            connectWallet();
        }
    }, [setAccount, setBalance]);

    return (
        <div>
            {connectedAccount ? (
                <p>Connected Account: {connectedAccount}</p>
            ) : (
                <button onClick={() => window.ethereum.request({ method: 'eth_requestAccounts' })}>
                    Connect Wallet
                </button>
            )}
        </div>
    );
};

export default Wallet;
