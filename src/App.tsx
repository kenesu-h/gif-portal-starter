import React, { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import { Ok, Err, Result } from 'ts-results';
import './App.css';

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const TEST_GIFS = [
	'https://i.giphy.com/media/eIG0HfouRQJQr1wBzz/giphy.webp',
	'https://media3.giphy.com/media/L71a8LW2UrKwPaWNYM/giphy.gif?cid=ecf05e47rr9qizx2msjucl1xyvuu47d7kf25tqt2lvo024uo&rid=giphy.gif&ct=g',
	'https://media4.giphy.com/media/AeFmQjHMtEySooOc8K/giphy.gif?cid=ecf05e47qdzhdma2y3ugn32lkgi972z9mpfzocjj6z1ro4ec&rid=giphy.gif&ct=g',
	'https://i.giphy.com/media/PAqjdPkJLDsmBRSYUp/giphy.webp'
]

declare global {
  interface Window {
    solana: any
  }
}

const App = () => {
  let solana: any;
  let [walletAddr, setWalletAddr] = useState("");

  // Attempts to find if the user has a wallet installed, specifically Phantom.
  function tryFindWallet(): Result<string, string> {
    try {
      if (solana) {
        if (solana.isPhantom) {
          return Ok("Phantom wallet found!");
        } else {
          return Err("Wallet found, but it was not a Phantom wallet.");
        }
      } else {
        return Err("Solana wallet not found! Get a Phantom wallet.");
      }
    } catch (error) {
      return Err((error as Error).message);
    }
  }

  // Attempts to connect to the user's wallet.
  async function tryConnectWallet(
    onlyIfTrusted: boolean
  ): Promise<Result<string, string>> {
    try {
      let response: any;
      if (onlyIfTrusted) {
        response = await solana.connect({ onlyIfTrusted: true });
      } else {
        response = await solana.connect();
      }
      const publicKey: string = response.publicKey.toString();
      setWalletAddr(publicKey);
      return Ok("Connected with Public Key: " + publicKey);
    } catch (error) {
      return Err((error as Error).message);
    }
  }
 
  /* 
   * Things to be done on load, such as:
   * - Finding if the user has a Solana wallet installed (namely Phantom).
   * - Attempting to connect to their wallet, but only if it's trusted.
   */
  async function onLoad() {
    solana = window.solana;
    const found: Result<string, string> = tryFindWallet();
    if (found.ok) {
      console.log(found.val);
      const connected: Result<string, string> = await tryConnectWallet(true);
      console.log(connected.val);
    } else {
      alert(found.val);
    }
  }

  // Attaches onLoad as an event listener.
  useEffect(() => {
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  // Renders the wallet connection button.
  function renderWalletConnect() {
    return <button
      className="cta-button connect-wallet-button"
      onClick={
        async () => {
          const connected: Result<string, string> = await tryConnectWallet(false);
          console.log(connected.val);
        }
      }
    >
      Connect to Wallet
    </button>;
  }

  // Renders the web app's page.
  function render() {
    return (
      <div className="App">
        <div className={walletAddr ? 'authed-container' : 'container'}>
          <div className="container">
            <div className="header-container">
              <p className="header">🖼 GIF Portal</p>
              <p className="sub-text">
                View your GIF collection in the metaverse ✨
              </p>
              <p className="sub-text">
                Something something this is a GIF collection.
              </p>
              {!walletAddr && renderWalletConnect()}
            </div>
            <div className="footer-container">
              <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
              <a
                className="footer-text"
                href={TWITTER_LINK}
                target="_blank"
                rel="noreferrer"
              >{`built on @${TWITTER_HANDLE}`}</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return render();
};

export default App;
