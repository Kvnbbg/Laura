import {
  BadgeCheck,
  Blocks,
  BookOpen,
  Bot,
  ExternalLink,
  Globe2,
  LockKeyhole,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './OpenSource.scss';

type IconComponent = typeof ShieldCheck;

interface SurfaceItem {
  title: string;
  description: string;
  Icon: IconComponent;
}

const runtimeSurfaces: SurfaceItem[] = [
  {
    title: 'Terminal forge',
    description:
      'Laura keeps the fast path in the terminal: inspect sources, compose bot briefs, and ship reviewed automation without hiding the moving parts.',
    Icon: Terminal,
  },
  {
    title: 'Web interface',
    description:
      'The React app gives non-terminal users a readable control surface for routes, docs, launch links, and guided MoltBot creation.',
    Icon: Globe2,
  },
  {
    title: 'MoltBots',
    description:
      'Bots are treated like small, reviewable products: one purpose, explicit data boundaries, and a clear publishing destination.',
    Icon: Bot,
  },
  {
    title: 'Public knowledge layer',
    description:
      'Techandstream.com and MoltBook.com receive public summaries, approved links, and safe metadata instead of private repository state.',
    Icon: BookOpen,
  },
];

const guardrails: SurfaceItem[] = [
  {
    title: 'No secrets in content',
    description:
      'Pages, docs, plugins, and generated summaries must use placeholders or public links only. Runtime credentials stay server-side.',
    Icon: LockKeyhole,
  },
  {
    title: 'Truthful capability claims',
    description:
      'If a bot cannot safely access or perform an action in production, the public UI must not imply that it can.',
    Icon: BadgeCheck,
  },
  {
    title: 'Reviewed publishing path',
    description:
      'MoltBook and Techandstream copy should be generated from approved artifacts, then reviewed before it becomes public.',
    Icon: ShieldCheck,
  },
];

const kissBlocks = [
  'Card',
  'Accordion',
  'Modal',
  'Drawer',
  'Toast',
  'Skeleton',
  'Badge',
  'Table',
  'Pagination',
  'Breadcrumb',
];

const workflowSteps = [
  'Choisir un objectif court pour le MoltBot.',
  'Limiter les sources aux contenus publics et approuves.',
  'Generer le brief depuis Laura terminal ou Laura web.',
  'Verifier les claims, les liens, les donnees et le ton.',
  'Publier le resume sur Techandstream.com ou MoltBook.com.',
];

const OpenSource = () => {
  return (
    <main className="open-source-page">
      <section className="open-source-hero">
        <div className="open-source-copy">
          <p className="eyebrow">Open-source safe forge</p>
          <h1>Laura craft les MoltBots pour Techandstream</h1>
          <p className="hero-lede">
            Laura transforme le repo french-dev-ai-tools et les sources publiques approuvees
            en MoltBots lisibles, pilotables depuis le terminal ou le web, puis racontables
            sur Techandstream.com et MoltBook.com sans exposer de secrets.
          </p>
          <div className="open-source-actions" aria-label="Open source actions">
            <Link className="btn btn-primary" to="/chat">
              Craft a MoltBot
            </Link>
            <a className="btn btn-secondary" href="https://techandstream.com" target="_blank" rel="noreferrer noopener">
              Techandstream
              <ExternalLink aria-hidden="true" size={16} />
            </a>
            <a className="btn btn-outline" href="https://moltbook.com" target="_blank" rel="noreferrer noopener">
              MoltBook
              <ExternalLink aria-hidden="true" size={16} />
            </a>
          </div>
        </div>

        <aside className="open-source-terminal" aria-label="MoltBot terminal preview">
          <div className="terminal-bar">
            <span />
            <span />
            <span />
          </div>
          <pre>
            <code>{`laura moltbot new techandstream
source: french-dev-ai-tools/public
mode: safe-leaks
output: reviewed web + terminal brief`}</code>
          </pre>
        </aside>
      </section>

      <section className="open-source-section" aria-labelledby="runtime-title">
        <div className="section-heading">
          <p className="eyebrow">Tier gating to publishing</p>
          <h2 id="runtime-title">One repo, one visible workflow</h2>
          <p>
            The implementation path stays narrow: gate features by tier, connect Stripe
            pages, surface the route in navigation, then review the public experience.
          </p>
        </div>

        <div className="surface-grid">
          {runtimeSurfaces.map(({ title, description, Icon }) => (
            <article className="surface-card" key={title}>
              <Icon aria-hidden="true" className="surface-icon" size={26} />
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="open-source-section open-source-split" aria-labelledby="guardrails-title">
        <div className="guardrails-panel">
          <p className="eyebrow">Security guardrails</p>
          <h2 id="guardrails-title">Open source, not open secrets</h2>
          <p>
            "Safe leaks" means public-safe release notes, approved metadata, and
            sanitized technical context. It does not mean exposing private tokens,
            private user data, non-public admin routes, or unreviewed automation.
          </p>
        </div>

        <div className="guardrails-list">
          {guardrails.map(({ title, description, Icon }) => (
            <article className="guardrail-item" key={title}>
              <Icon aria-hidden="true" size={22} />
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="open-source-section ui-vocabulary" aria-labelledby="ui-title">
        <div>
          <p className="eyebrow">KISS UI vocabulary</p>
          <h2 id="ui-title">Building blocks for Laura pages</h2>
          <p>
            Keep the interface boring in the right places: reusable primitives,
            predictable states, and no resurrected legacy experiments unless they
            are actively reviewed.
          </p>
        </div>
        <div className="block-list" aria-label="Laura UI building blocks">
          {kissBlocks.map((block) => (
            <span key={block}>{block}</span>
          ))}
        </div>
      </section>

      <section className="open-source-section blog-panel" aria-labelledby="blog-title">
        <div className="blog-heading">
          <Blocks aria-hidden="true" size={28} />
          <div>
            <p className="eyebrow">Post en novlangue moderne</p>
            <h2 id="blog-title">Laura, MoltBots et la forge Techandstream</h2>
          </div>
        </div>

        <div className="blog-body">
          <p>
            Avec Laura, le bot n&apos;est plus une boite noire. C&apos;est un objet
            compose, relu, versionne. Comme un bot Telegram en Python, mais avec
            deux portes: le terminal pour les mains rapides, l&apos;interface web pour
            les equipes qui veulent voir, cadrer et publier.
          </p>
          <p>
            Dans la realite du projet, Laura travaille avec french-dev-ai-tools:
            un socle open source, des pages publiques, des routes de publication,
            et une discipline simple. Ce qui sort vers Techandstream.com ou
            MoltBook.com doit etre comprehensible, utile, et nettoye de tout secret.
          </p>
          <p>
            Le MoltBot devient alors un mini-produit: un role clair, des sources
            approuvees, une promesse honnete, et un chemin de revue. On ne vend pas
            une magie vague; on fabrique une capacite exploitable, publiee proprement.
          </p>
        </div>

        <ol className="workflow-list">
          {workflowSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
    </main>
  );
};

export default OpenSource;
