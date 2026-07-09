import { ExternalLink, Github, TerminalSquare } from 'lucide-react';
import CliInstallGuide from '../components/CliInstallGuide';

const InstallCli = () => {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 pb-20">
      <section className="relative overflow-hidden pt-20 pb-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/25 via-slate-950 to-slate-950" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-200">
            <TerminalSquare className="h-3.5 w-3.5 lucide-animated" />
            CLI install
          </div>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Install Laura as a terminal-first AI companion.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
            Use this page when you want the maintained Go command, not just the
            React preview. It covers the fast install, local source build, PATH
            setup, verification, update, uninstall, and bridge-safe terminal
            commands.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
              href="https://github.com/Kvnbbg/Laura#install-laura-cli"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-4 w-4 lucide-animated" />
              README install section
            </a>
            <a
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-400 hover:text-cyan-100"
              href="https://github.com/Kvnbbg/Laura"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 lucide-animated" />
              Public repository
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <CliInstallGuide />
      </div>
    </main>
  );
};

export default InstallCli;
