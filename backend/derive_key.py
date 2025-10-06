import os
import sys

# Make editor/run resilient: inject local venv site-packages if pyright/editor isn't using it
here = os.path.dirname(__file__)
for p in (
    os.path.join(here, ".venv", "Lib", "site-packages"),   # Windows
    os.path.join(here, ".venv", "lib", "site-packages"),   # Unix-like
):
    if os.path.isdir(p) and p not in sys.path:
        sys.path.append(p)

# Robust import of tonsdk mnemonic util
try:
    from tonsdk.crypto.mnemonic import mnemonic_to_wallet_key  # type: ignore
except Exception:  # fallback for different package layouts
    from tonsdk.crypto import mnemonic as _mn  # type: ignore
    mnemonic_to_wallet_key = _mn.mnemonic_to_wallet_key

from tonsdk.contract.wallet import Wallets, WalletVersionEnum  # type: ignore

# Paste your 24-word mnemonic between the triple quotes
WORDS = """provide alley dwarf topple lizard bleak fat refuse actor just like dream popular venture skull sort captain lemon hazard census force utility nature spawn""".split()

pub, priv = mnemonic_to_wallet_key(WORDS)
print("PRIVATE_KEY_HEX=", priv.hex())

wallet = Wallets.from_private_key(private_key=priv, version=WalletVersionEnum.v4r2, network="mainnet")
print("ADDRESS_BOUNCEABLE=", wallet.address.to_string(is_bounceable=True, is_url_safe=True))
print("ADDRESS_NON_BOUNCEABLE=", wallet.address.to_string(is_bounceable=False, is_url_safe=True))
