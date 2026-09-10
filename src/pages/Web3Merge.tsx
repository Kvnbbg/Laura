import { useEffect, useState } from 'react';
import { fetchWeb3Merge, FALLBACK_MERGE, Web3MergeSnapshot } from '../services/web3Merge';
import './Web3Merge.scss';

const Web3Merge = () => {
  const [snap, setSnap] = useState<Web3MergeSnapshot>(FALLBACK_MERGE);

  useEffect(() => {
    const controller = new AbortController();
    fetchWeb3Merge(controller.signal).then(setSnap);
    return () => controller.abort();
  }, []);

  return (
    <main className="web3-merge-page">
      <section className="hero card">
        <p className="eyebrow">Laura × COPY × Web3</p>
        <h1>Merge desk</h1>
        <p>
          Laura orchestrates. COPY hunts and papers. Web3 only reports chain health and an
          optional external queue. Custody stays empty on this surface.
        </p>
      </section>

      <section className="planes">
        <article className="card">
          <h2>Laura</h2>
          <p>Preferred CLI: <code>{snap.preferredCli}</code></p>
          <p>Chat plugin: <code>{snap.surfaces.chatPlugin}</code></p>
        </article>
        <article className="card">
          <h2>COPY</h2>
          <p>
            Fellow engine:{' '}
            <a href={snap.fellowEngine.repository} target="_blank" rel="noreferrer">
              {snap.fellowEngine.name}
            </a>
          </p>
          <p>Allowlisted: {snap.fellowEngine.allowlisted.join(', ')}</p>
        </article>
        <article className="card">
          <h2>Web3</h2>
          <p>Posture: {snap.web3.posture}</p>
          <p>Custody: {snap.web3.custody}</p>
          <p>
            Chain: {snap.web3.chain.status} / {snap.web3.chain.chainId}
          </p>
          <p>Queue: {snap.web3.queue}</p>
        </article>
      </section>

      <section className="card">
        <h2>Paper desk</h2>
        <p>{snap.paper.note}</p>
        <p>
          Open {snap.paper.openPositions} · Closed {snap.paper.closedPositions}
        </p>
      </section>

      <section className="card">
        <h2>Refused on this merge</h2>
        <ul>
          {snap.blocked.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </main>
  );
};

export default Web3Merge;
