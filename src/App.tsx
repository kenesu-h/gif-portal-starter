import React, { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import { Ok, Err, Result } from 'ts-results';
import './App.css';

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const TEST_GIFS = [ 
  'https://media.giphy.com/media/YM9AALM1SVdwk/giphy.gif',
  'https://media.giphy.com/media/UA37k37K4KoGA/giphy.gif',
  // The one below is a bit too big...
  // 'https://media.giphy.com/media/U6gxHdER2IaY9g0ItP/giphy-downsized-large.gif',
  'https://media.giphy.com/media/12YlcIDRmrdMNq/giphy.gif',
  'https://media.giphy.com/media/P4JdJzavfXop0znasj/giphy.gif'
]

declare global {
  interface Window {
    solana: any
  }
}

const App = () => {
  let solana: any;
  let [walletAddr, setWalletAddr] = useState("");
  let [inputValue, setInputValue] = useState("");
  let [gifList, setGifList] = useState([] as Array<string>);

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
      await tryConnectWallet(true);
    } else {
      alert(found.val);
    }
  }

  // Attaches onLoad as an event listener.
  useEffect(() => {
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  // Attempts to fetch the list of GIFs when the wallet address changes.
  useEffect(() => {
    if (walletAddr) {
      console.log("Fetching GIF list...");
      setGifList(TEST_GIFS);
    }
  }, [walletAddr]);

  // Renders the wallet connection container.
  function renderWalletConnect() {
    return (
      <button
        className="cta-button connect-wallet-button"
        onClick={
          async () => {
            const connected: Result<string, string> = await tryConnectWallet(false);
            console.log(connected.val);
          }
        }
      >
        Connect to Wallet
      </button>
    );
  }

  function gifToContainer(gif: string) {
    return (
      <div className="gif-item" key={gif}>
        <img src={gif} alt={gif} />
      </div>
    );
  }

  function onInputChange(event: any) {
    const { value } = event.target;
    setInputValue(value);
  }

  async function sendGif() {
    if (inputValue.length > 0) {
      console.log("GIF link:", inputValue);
    } else {
      console.log("Empty input, try again.");
    }
  }

  // Renders the GIF input field.
  function renderGifInput() {
    return (
      <form
        onSubmit={
          (event) => {
            event.preventDefault();
            sendGif();
          }
        }
      >
        <input
          type="text"
          placeholder="Enter GIF link."
          value={inputValue}
          onChange={onInputChange}
        />
        <button type="submit" className="cta-button submit-gif-button">
          Submit
        </button>
      </form>
    );
  }

  // Renders the GIF grid.
  function renderGifGrid() {
    return (
      <div className="gif-grid">
        {gifList.map(gifToContainer)}
      </div>
    );
  }

  function renderConnectedContainer() {
    return (
      <div className="connected-container">
        {renderGifInput()}
        {renderGifGrid()}
      </div>
    );
  }

  // Renders the web app's page.
  function render() {
    return (
      <div className="App">
        <div className={walletAddr ? 'authed-container' : 'container'}>
          <div className="container">
            <div className="header-container">
              <p className="header">Kenesu's Pokémon GIF Portal</p>
              <p className="sub-text">
                A collection of Pokémon GIFs in the Solana blockchain.
              </p>
              {!walletAddr && renderWalletConnect()}
              {walletAddr && renderConnectedContainer()}
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
