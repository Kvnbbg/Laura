# Laura pilots rustFX

Laura is a Go CLI. rustFX is the Rust engine for chains, coins, and the Web3 catalog.
COPY remains the paper market loop. The operator stays on Ubuntu or any terminal;
Laura suggests or builds, and does not pipe unsigned installers blindly.

```text
terminal (Ubuntu / other)
    -> laura          # Go, preferred
        -> rustfx-web3    # Rust engine (status, coins)
        -> copy           # paper / hunt sibling
        -> web merge desk # /web3
```

## Install path Laura may print

```bash
# reviewed by the operator
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
git clone https://github.com/Kvnbbg/rustFX.git
cd rustFX
cargo build -p rustfx-web3 --release
export PATH="$PWD/target/release:$PATH"
rustfx-web3 status
```

From Laura chat:

```text
/run rustfx check
/run rustfx build
/run rustfx status
/run rustfx coins
```

`LAURA_RUSTFX_REPO` points at the checkout. `LAURA_RUSTFX_BIN` overrides the binary.
