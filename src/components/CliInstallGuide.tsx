import { Download, ExternalLink, Github } from 'lucide-react';

const CLI_INSTALL_STEPS = [
  {
    title: 'Fast install',
    description: 'Install the maintained production command from the public Go module.',
    command: 'go install github.com/Kvnbbg/Laura/cmd/laura@latest',
  },
  {
    title: 'Add Go binaries to PATH',
    description: 'Use this when the `laura` command is not found after install.',
    command: 'export PATH="$(go env GOPATH)/bin:$PATH"',
  },
  {
    title: 'Persist the PATH',
    description: 'Keep the command available when a new terminal opens.',
    command: 'printf \'\\nexport PATH="$(go env GOPATH)/bin:$PATH"\\n\' >> ~/.bashrc\nsource ~/.bashrc',
  },
  {
    title: 'Verify the CLI',
    description: 'Confirm the installed command and inspect the supported flags.',
    command: 'laura --version\nlaura --help',
  },
];

const CLI_SOURCE_COMMANDS = [
  'git clone https://github.com/Kvnbbg/Laura.git',
  'cd Laura',
  'go test ./...',
  'go build -o bin/laura ./cmd/laura',
  './bin/laura --help',
];

const CLI_USAGE_COMMANDS = [
  'laura',
  'laura --world css',
  'laura --stats',
  'laura --reset',
  'laura --no-color',
  'laura --bridge --bridge-command "goto add" --bridge-source terminal --bridge-target web',
];

const CommandBlock = ({
  commands,
  label,
}: {
  commands: string | string[];
  label?: string;
}) => {
  const text = Array.isArray(commands) ? commands.join('\n') : commands;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
      {label && (
        <div className="border-b border-slate-800 bg-slate-900/80 px-4 py-2 text-[11px] font-semibold uppercase text-slate-500">
          {label}
        </div>
      )}
      <pre className="overflow-x-auto p-4 text-left text-xs leading-6 text-cyan-100 sm:text-sm">
        <code>{text}</code>
      </pre>
    </div>
  );
};

const CliInstallGuide = () => (
  <section
    id="install-laura-cli"
    className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/20 p-6 shadow-2xl shadow-cyan-950/20 lg:p-10"
  >
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase text-cyan-200">
          <Download className="h-3.5 w-3.5 lucide-animated" />
          Terminal first
        </div>
        <h2 className="text-3xl font-bold text-white">Install Laura CLI</h2>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          Laura is primarily a command-line companion. The web app stays useful
          for discovery, but the production workflow is the Go command in
          <code className="mx-1 rounded bg-slate-800 px-1.5 py-0.5 text-cyan-100">cmd/laura</code>
          with local progress, maintained flags, bridge output, and a clean
          install path.
        </p>
        <div className="mt-6 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <span className="block text-xs font-semibold uppercase text-slate-500">Requires</span>
            <strong className="mt-1 block text-white">Go 1.22+</strong>
            <span className="mt-1 block text-slate-400">No Node install needed for the CLI.</span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <span className="block text-xs font-semibold uppercase text-slate-500">Module</span>
            <strong className="mt-1 block text-white">github.com/Kvnbbg/Laura</strong>
            <span className="mt-1 block text-slate-400">Public source and install target.</span>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href="https://github.com/Kvnbbg/Laura#install-laura-cli"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
          >
            <Github className="h-4 w-4 lucide-animated" />
            <span>Open README guide</span>
          </a>
          <a
            href="https://github.com/Kvnbbg/Laura"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-400 hover:text-cyan-100"
          >
            <ExternalLink className="h-4 w-4 lucide-animated" />
            <span>View public repo</span>
          </a>
        </div>
      </div>

      <div className="space-y-4">
        {CLI_INSTALL_STEPS.map((step) => (
          <article key={step.title} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-3">
              <h3 className="text-base font-semibold text-white">{step.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{step.description}</p>
            </div>
            <CommandBlock commands={step.command} />
          </article>
        ))}
      </div>
    </div>

    <div className="mt-8 grid gap-4 lg:grid-cols-2">
      <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <h3 className="text-lg font-semibold text-white">Build from source</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Use this path when you want to inspect or modify the CLI before
          running it locally.
        </p>
        <div className="mt-4">
          <CommandBlock commands={CLI_SOURCE_COMMANDS} label="source build" />
        </div>
      </article>

      <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <h3 className="text-lg font-semibold text-white">Daily commands</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          These are the main commands to launch Laura, inspect state, reset
          progress, disable color, and emit bridge-safe JSON.
        </p>
        <div className="mt-4">
          <CommandBlock commands={CLI_USAGE_COMMANDS} label="usage" />
        </div>
      </article>
    </div>

    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <h3 className="text-lg font-semibold text-white">Update</h3>
        <div className="mt-4">
          <CommandBlock commands="go install github.com/Kvnbbg/Laura/cmd/laura@latest" />
        </div>
      </article>
      <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <h3 className="text-lg font-semibold text-white">Uninstall</h3>
        <div className="mt-4">
          <CommandBlock commands='rm -f "$(go env GOPATH)/bin/laura" ~/.local/bin/laura' />
        </div>
      </article>
    </div>
  </section>
);

export default CliInstallGuide;
