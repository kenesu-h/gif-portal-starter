import React, { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import { Ok, Err, Result } from 'ts-results';
import './App.css';
import idl from './idl.json';
import { Connection, PublicKey, clusterApiUrl, Commitment, ConnectionConfig, ConfirmOptions } from '@solana/web3.js';
import { Program, Provider, web3, Idl } from '@project-serum/anchor';
import kp from './keypair.json';

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

const { SystemProgram, Keypair }: any = web3;

const arr: any = Object.values(kp._keypair.secretKey);
const secret: Uint8Array = new Uint8Array(arr);
const baseAccount: any = web3.Keypair.fromSecretKey(secret);

const programID: PublicKey = new PublicKey(idl.metadata.address);
const network: any = clusterApiUrl("devnet");
const opts: { preflightCommitment: string } = {
  preflightCommitment: "processed"
}

const App = () => {
  let solana: any;
  let [walletAddr, setWalletAddr] = useState("");
  let [inputValue, setInputValue] = useState("");
  let [gifList, setGifList] = useState(null as Array<string> | null);

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

  async function tryGetGifList() {
    try {
      const provider: Provider = getProvider();
      const program: Program = new Program(idl as Idl, programID, provider);
      const account: any =
        await program.account.baseAccount.fetch(baseAccount.publicKey);

      console.log("Got the account", account);
      setGifList(account.gifList);
    } catch (error) {
      console.log("Error in tryGetGifList: ", error);
      setGifList(null);
    }
  }

  // Attempts to fetch the list of GIFs when the wallet address changes.
  useEffect(() => {
    if (walletAddr) {
      console.log("Fetching GIF list...");
      tryGetGifList();
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

  function gifToContainer(item: any, index: any) {
    return (
      <div className="gif-item" key={index}>
        <img src={item.gifLink} />
      </div>
    );
  }

  function onInputChange(event: any) {
    const { value } = event.target;
    setInputValue(value);
  }

  function getProvider(): Provider {
    let connection: Connection = new Connection(
      network,
      opts.preflightCommitment as Commitment | ConnectionConfig | undefined
    );
    return new Provider(connection, window.solana, opts.preflightCommitment as ConfirmOptions);
  }

  async function tryCreateGifAccount() {
    try {
      const provider: Provider = getProvider();
      const program: Program = new Program(idl as Idl, programID, provider);
      console.log("ping");
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString());
      await tryGetGifList();
    } catch(error) {
      console.log("Error creating a BaseAccount account:", error);
    }
  }

  async function sendGif() {
    if (inputValue.length > 0) {
      try {
        const provider: Provider = getProvider();
        const program: Program = new Program(idl as Idl, programID, provider);

        await program.rpc.addGif(inputValue, {
          accounts: {
            baseAccount: baseAccount.publicKey,
            user: provider.wallet.publicKey
          }
        });
        console.log("GIF successfully sent to program:", inputValue);

        await tryGetGifList();
      } catch (error) {
        console.log("Error sending GIF:", error);
      }
    } else {
      alert("Empty input, try again.");
    }
  }

  function renderCreateAccount() {
    if (gifList == null) {
      return (
        <button
          className="cta-button submit-gif-button"
          onClick={tryCreateGifAccount}
        >
          Do One-Time Initialization for GIF Program Account
        </button>
      );
    } else {
      return;
    }
  }

  // Renders the GIF input field.
  function renderGifInput() {
    if (gifList == null) {
      return;
    } else {
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
  }

  // Renders the GIF grid.
  function renderGifGrid() {
    if (gifList == null) {
      return;
    } else {
      return (
        <div className="gif-grid">
          {gifList.map((item, index) => gifToContainer(item, index))}
        </div>
      );
    }
  }

  function renderConnectedContainer() {
    return (
      <div className="connected-container">
        {renderCreateAccount()}
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
