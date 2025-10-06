from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
from dotenv import load_dotenv, set_key
from tonsdk.contract.wallet import Wallets, WalletVersionEnum
from tonsdk.contract.token.ft import JettonWallet
from tonsdk.utils import to_nano
try:
    from tonsdk.crypto.mnemonic import mnemonic_to_wallet_key  # type: ignore
except Exception:  # fallback for different layouts
    mnemonic_to_wallet_key = None  # type: ignore

# Load environment
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"*": {"origins": "*"}})

CONFIG_KEYS = [
    "TON_RPC_URL",
    "HOT_WALLET_PRIVATE_KEY",
    "HOT_WALLET_ADDRESS",
    "DOGS_JETTON_CONTRACT",
    "HOT_WALLET_MNEMONIC"
]


def get_env(key: str) -> str:
    return os.getenv(key, "")


def update_env(key: str, value: str) -> None:
    os.environ[key] = value
    set_key(".env", key, value)


def init_wallet():
    private_key_hex = get_env("HOT_WALLET_PRIVATE_KEY").strip()
    mnemonic_words = get_env("HOT_WALLET_MNEMONIC").strip()

    if private_key_hex:
        private_key = bytes.fromhex(private_key_hex)
    elif mnemonic_words:
        if not mnemonic_to_wallet_key:
            raise Exception("tonsdk mnemonic helper not available; install tonsdk>=1.0.15")
        words = [w for w in mnemonic_words.replace("\n", " ").split(" ") if w]
        if len(words) not in (24, 12):
            raise Exception("HOT_WALLET_MNEMONIC must contain 12 or 24 words")
        _pub, priv = mnemonic_to_wallet_key(words)  # type: ignore
        private_key = priv
    else:
        raise Exception("Set HOT_WALLET_PRIVATE_KEY or HOT_WALLET_MNEMONIC in .env")

    return Wallets.from_private_key(
        private_key=private_key,
        version=WalletVersionEnum.v4r2,
        network="mainnet"
    )


def send_ton_request(method: str, params: dict):
    rpc_url = get_env("TON_RPC_URL")
    if not rpc_url:
        raise Exception("TON_RPC_URL not set")
    response = requests.post(
        rpc_url,
        json={"jsonrpc": "2.0", "id": 1, "method": method, "params": params},
        headers={"Content-Type": "application/json"},
        timeout=30,
    )
    response.raise_for_status()
    return response.json()


@app.get("/")
def home():
    return jsonify({"status": "OK", "message": "DOGS Payout API is running"})


@app.post("/withdraw")
def withdraw():
    try:
        data = request.get_json(force=True) or {}
        user_address = data.get("address")
        amount = float(data.get("amount") or 0)

        if not user_address or amount <= 0:
            return jsonify({"error": "Invalid address or amount"}), 400

        wallet = init_wallet()

        jetton_contract = get_env("DOGS_JETTON_CONTRACT")
        if not jetton_contract:
            return jsonify({"error": "DOGS_JETTON_CONTRACT not configured"}), 500

        amount_nano = int(amount * 1e9)

        jetton_wallet = JettonWallet(address=wallet.address, provider=None)
        payload = jetton_wallet.create_transfer_body(
            amount=amount_nano,
            destination=user_address,
            response_address=wallet.address,
            forward_amount=int(0.02 * 1e9),
            forward_payload=b"DOGS Auto Payment",
        )

        transfer_msg = wallet.create_transfer_message(
            to_addr=jetton_contract,
            amount=to_nano("0.05", "ton"),
            seqno=wallet.seqno,
            payload=payload,
        )

        rpc_resp = send_ton_request("sendBoc", {
            "boc": transfer_msg["message"].to_boc(False).hex()
        })

        return jsonify({
            "status": "success",
            "tx_hash": rpc_resp.get("result", ""),
            "to": user_address,
            "amount": amount,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.get("/get_config")
def get_config():
    admin_password = request.args.get("password")
    if admin_password != os.getenv("ADMIN_PASSWORD"):
        return jsonify({"error": "Unauthorized"}), 403
    return jsonify({k: get_env(k) for k in CONFIG_KEYS})


@app.post("/update_config")
def update_config():
    data = request.get_json(force=True) or {}
    admin_password = data.get("password")
    if admin_password != os.getenv("ADMIN_PASSWORD"):
        return jsonify({"error": "Unauthorized"}), 403
    updated = {}
    for k, v in data.items():
        if k in CONFIG_KEYS and isinstance(v, str):
            update_env(k, v)
            updated[k] = v
    return jsonify({"updated": updated, "message": "Configuration updated successfully"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

# --- imports ------------------------------------------------------
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import sqlite3, time, os, json, uuid, traceback, hmac, hashlib, requests   # ← added json
from urllib.parse import parse_qsl
from datetime import datetime
from dateutil.relativedelta import relativedelta


app = Flask(__name__)
CORS(
    app,
    resources={r"/*": {"origins": "*"}},            # allow every origin
    supports_credentials=True,                      # keep cookies if you ever need them
    allow_headers="*"                               # accept any custom header (e.g. X-Telegram-Init-Data)
)


# Paths to SQLite database files
DATABASE = 'mydatabase2.db'
GAME_DATABASE = 'game.db'
task_database = 'Tasks.db'
EXAM_DATABASE = 'exam.db'  # Added for exam.db
DATA_DATABASE = 'data.db'  # Added for data.db

if not os.path.exists('static/images'):
    os.makedirs('static/images')

# Function to get a database connection
def get_db_connection(db_path):
    """
    Establish a connection to the SQLite database.
    Args:
        db_path (str): Path to the database file.
    Returns:
        sqlite3.Connection: SQLite connection object.
    """
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    return conn

# Function to get a connection to data.db
def get_data_db_connection():
    """
    Establish a connection to the data.db SQLite database.
    Returns:
        sqlite3.Connection: SQLite connection object for data.db.
    """
    return get_db_connection(DATA_DATABASE)

# Retry logic for handling SQLite locked errors
def execute_query_with_retry(conn, query, params=()):
    max_retries = 5
    for attempt in range(max_retries):
        try:
            cursor = conn.cursor()
            cursor.execute(query, params)
            conn.commit()
            return cursor
        except sqlite3.OperationalError as e:
            if "database is locked" in str(e):
                print(f"Database is locked, retrying... ({attempt + 1}/{max_retries})")
                time.sleep(1)  # Wait before retrying
            else:
                raise
    raise sqlite3.OperationalError("Failed to execute query after multiple retries")

# Function to validate Telegram WebApp initData
def validate_telegram_init_data(init_data: str) -> bool:
    bot_token = '7846799651:AAGOt2D3udtnh9Aos0haWQUfiRIUVTbefwg'
    if not bot_token:
        print("Bot token is missing")
        return False

    # Log the raw init_data received
    print("Received initData:", init_data)

    parsed_data = dict(parse_qsl(init_data, keep_blank_values=True))
    init_data_hash = parsed_data.pop("hash", None)
    if not init_data_hash:
        print("Hash is missing in initData")
        return False

    # Log the parsed data
    print("Parsed initData:", parsed_data)

    # Generate the secret key using HMAC-SHA256 of bot_token with "WebAppData" as the key
    secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()

    data_check_string = "\n".join(
        [f"{k}={v}" for k, v in sorted(parsed_data.items())]
    )

    # Log the data check string
    print("Data check string:", data_check_string)

    calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    # Log the calculated hash and the hash from initData
    print("Calculated hash:", calculated_hash)
    print("Hash from initData:", init_data_hash)

    # Compare hashes
    is_valid = hmac.compare_digest(init_data_hash, calculated_hash)
    print("Hash comparison result:", is_valid)

    if not is_valid:
        return False

    # Verify the auth_date to prevent replay attacks
    auth_date = int(parsed_data.get('auth_date', 0))
    current_time = int(time.time())
    if current_time - auth_date > 86400:  # 24 hours validity
        print("Auth date is too old")
        return False

    return True

# # Middleware to verify Telegram initData before processing any request
# @app.before_request
# def verify_telegram_init_data():
#     # Allow OPTIONS requests to pass through for CORS preflight
#     if request.method == 'OPTIONS':
#         return

#     # Bypass validation for requests coming from http://localhost:5173/ or http://localhost:8082
#     referer = request.headers.get('Referrer', '')
#     origin = request.headers.get('Origin', '')
#     if 'localhost:5173' in referer or 'localhost:5173' in origin or 'localhost:8082' in referer or 'localhost:8082' in origin:
#         return

#     # Exclude certain routes from Telegram initData verification
#     if request.endpoint not in ['download_db', 'static','get_all_user_details','add_task','get_user_tasks']:
#         init_data = request.headers.get('X-Telegram-Init-Data')
#         if not init_data or not validate_telegram_init_data(init_data):
#             return jsonify({'error': 'Invalid Telegram initData'}), 403

# Existing Endpoints ...
BOT_TOKEN  = os.getenv(
    "BOT_TOKEN",
    "7825508263:AAHAnj6smWWY-2JYMhNh6NfFifsjkcDifz8"   # ← replace in prod
)
TG_API_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"

# Stars price table
PRICE_PER_SPIN = 1            # default: 1 ⭐ each
DISCOUNTS = {                 # custom packs (spins : stars)
    5:  5,
    10: 9,
    50: 40,
}

# make sure Spin column exists once on startup
def ensure_column_spins():
    conn = sqlite3.connect(DATABASE)
    cur  = conn.cursor()
    cur.execute("PRAGMA table_info(Users)")
    cols = [c[1] for c in cur.fetchall()]
    if "SpinsLeft" not in cols:
        cur.execute("ALTER TABLE Users ADD COLUMN SpinsLeft INTEGER DEFAULT 0")
        conn.commit()
    conn.close()
ensure_column_spins()

# ───────────────────── helpers: DB + retry wrapper ─────────────────
def get_db_connection(db_path):
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def execute_query_with_retry(conn, query, params=()):
    for _ in range(5):
        try:
            cur = conn.cursor()
            cur.execute(query, params)
            conn.commit()
            return cur
        except sqlite3.OperationalError as e:
            if "database is locked" in str(e):
                time.sleep(1)
            else:
                raise
    raise sqlite3.OperationalError("Failed after retries")

def get_data_db_connection():
    return get_db_connection(DATA_DATABASE)

# ────────────────────── Telegram initData checker ──────────────────
def validate_telegram_init_data(init_data: str) -> bool:
    if not BOT_TOKEN:
        return False
    parsed = dict(parse_qsl(init_data, keep_blank_values=True))
    their_hash = parsed.pop("hash", None)
    if not their_hash:
        return False
    secret = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
    data_check = "\n".join(f"{k}={v}" for k, v in sorted(parsed.items()))
    calc_hash = hmac.new(secret, data_check.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(calc_hash, their_hash):
        return False
    auth_date = int(parsed.get("auth_date", 0))
    return time.time() - auth_date <= 86400  # 24h

# ─────────────────────────── NEW ENDPOINTS ─────────────────────────
# ───────────────────────── /invoice (updated) ─────────────────────────
@app.route("/invoice", methods=["POST"])
def create_invoice():
    """
    Body  (one of):
       { "UserId": "<tg id>", "Stars": <int> }      # pay exactly this many stars
       { "UserId": "<tg id>", "Spins": <int> }      # old behaviour – still works
    Returns:
       { "invoiceLink": "https://t.me/…" }
    """
    data = request.get_json(force=True)

    uid   = data.get("UserId")
    stars_param = data.get("Stars")      # new param
    spins_param = data.get("Spins")      # legacy param

    # ── basic validation ──────────────────────────────────────────────
    if not uid:
        return jsonify({"error": "UserId is required"}), 400

    if stars_param is not None:
        try:
            stars = int(stars_param)
            if stars <= 0:
                raise ValueError
        except ValueError:
            return jsonify({"error": "Stars must be a positive integer"}), 400

    elif spins_param is not None:
        try:
            spins = int(spins_param)
            if spins <= 0:
                raise ValueError
        except ValueError:
            return jsonify({"error": "Spins must be a positive integer"}), 400
        # keep your old discount logic
        stars = DISCOUNTS.get(spins, spins * PRICE_PER_SPIN)
    else:
        return jsonify({"error": "Either Stars or Spins must be supplied"}), 400

    # Stars use cents-like minor units on Telegram invoices
    amount_in_units = stars * 1
    payload = json.dumps({"uid": uid, "stars": stars, "ts": int(time.time())})

    resp = requests.post(
        TG_API_URL + "/createInvoiceLink",
        json={
            "title":          f"{stars} Stars",
            "description":    "Spin Wheel – digital goods",
            "payload":        payload,
            "provider_token": "",           # empty → Stars
            "currency":       "XTR",
            "prices":         [{"label": f"{stars} Stars", "amount": amount_in_units}],
            "start_parameter": "buy_stars"
        },
        timeout=10
    ).json()

    if not resp.get("ok"):
        return jsonify({"error": resp.get("description", "Telegram error")}), 502

    return jsonify({"invoiceLink": resp["result"]}), 200


@app.route("/update_spins", methods=["POST"])
def update_spins():
    """
    Body: { "UserId": "<tg id>", "SpinsToAdd": <int> }
    """
    data = request.get_json(force=True)
    uid  = data.get("UserId")
    add  = int(data.get("SpinsToAdd", 0))

    if not uid or add <= 0:
        return jsonify({"error": "UserId and positive SpinsToAdd required"}), 400

    try:
        conn = get_db_connection(DATABASE)
        execute_query_with_retry(
            conn,
            "UPDATE Users SET SpinsLeft = COALESCE(SpinsLeft,0) + ? WHERE UserId = ?",
            (add, str(uid))
        )
        return jsonify({"message": f"+{add} spins credited"}), 200
    except sqlite3.Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/add_user', methods=['POST'])
def add_user():
    # Log request headers to understand if all necessary headers are present
    print("Request Headers:", request.headers)

    # Log the incoming JSON data
    data = request.json
    print("Received Data:", data)

    # Extracting data from the request
    user_id = data.get('UserId')
    username = data.get('Username')

    # Check if required fields are present, otherwise return an error
    if not user_id or not username:
        print("Missing UserId or Username in request")
        return jsonify({'error': 'UserId and Username are required'}), 400

    try:
        # Get a connection to the database
        conn = get_db_connection(DATABASE)
        print("Database connection established")

        # Check if the user already exists
        query_check = "SELECT * FROM Users WHERE UserId = ?"
        user_exists = execute_query_with_retry(conn, query_check, (str(user_id),)).fetchone()

        if user_exists:
            # Log if the user already exists
            print(f"User {user_id} already exists in the database")
            return jsonify({'message': 'User already exists'}), 200

        # If the user doesn't exist, insert a new user with default values
        query_insert = """
        INSERT INTO Users (
            UserId, totalgot, invitedby, miningstarttime, timeinminute, rate, 
            youtube, instagram, discord, telegram, X, facebook, Username, 
            dailycombotime, dailyclaimedtime, alreadydailyclaimed, walletid
        ) VALUES (
            ?, 0, ?, '0', '180', '0', NULL, NULL, NULL, NULL, NULL, NULL, ?, 0, 0, 0, NULL
        )
        """
        execute_query_with_retry(conn, query_insert, (str(user_id), str(data.get('invitedby')), str(username)))
        print(f"User {user_id} added successfully with default values")
        return jsonify({'message': 'User added successfully with default values'}), 201

    except sqlite3.Error as e:
        # Log the error to understand what went wrong
        print(f"SQLite Error: {e}")
        return jsonify({'error': str(e)}), 500

    finally:
        # Ensure the database connection is closed
        if conn:
            conn.close()
            print("Database connection closed")


@app.route('/get_user', methods=['GET'])
def get_user():
    user_id = request.args.get('UserId')
    if not user_id:
        return jsonify({'error': 'UserId is required'}), 400

    try:
        conn = get_db_connection(DATABASE)

        # Retrieve user from database
        query = "SELECT * FROM Users WHERE UserId = ?"
        cursor = execute_query_with_retry(conn, query, (str(user_id),))
        user = cursor.fetchone()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        user_dict = dict(user)  # Convert row to dictionary
        return jsonify({'data': user_dict}), 200

    except sqlite3.Error as e:
        print(f"SQLite Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route('/get_invitations', methods=['GET'])
def get_invitations():
    user_id = request.args.get('UserId')
    if not user_id:
        return jsonify({'error': 'UserId is required'}), 400

    try:
        conn = get_db_connection(DATABASE)

        # First, get the referrewarded value for the user
        reward_query = "SELECT referrewarded FROM Users WHERE UserId = ?;"
        reward_cursor = execute_query_with_retry(conn, reward_query, (str(user_id),))
        refer_rewarded = reward_cursor.fetchone()
        if refer_rewarded:
            refer_rewarded_value = refer_rewarded['referrewarded']
        else:
            refer_rewarded_value = None

        # Next, find users invited by the given user_id
        query = """
        SELECT Username, totalgot FROM Users 
        WHERE invitedby = ? AND UserId != invitedby;
        """
        cursor = execute_query_with_retry(conn, query, (str(user_id),))
        users = cursor.fetchall()

        if not users and refer_rewarded_value is None:
            return jsonify({'error': 'No invitations or referrewarded value found'}), 404

        users_list = [dict(user) for user in users]
        # Add the referrewarded value only once for the requester
        result = {
            'invitations': users_list,
            'referrewarded': refer_rewarded_value
        }

        return jsonify(result), 200

    except sqlite3.Error as e:
        print(f"SQLite Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route('/update_user', methods=['POST'])
def update_user():
    data = request.json
    user_id = data.get('UserId')

    if not user_id:
        return jsonify({'error': 'UserId is required'}), 400

    # Exclude UserId from update fields and prepare the SQL query
    update_data = {k: v for k, v in data.items() if k != 'UserId'}
    if not update_data:
        return jsonify({'error': 'No data provided for update'}), 400

    set_clause = ', '.join([f"{key} = ?" for key in update_data.keys()])
    values = list(update_data.values())

    try:
        conn = get_db_connection(DATABASE)

        # Update user in the database
        query = f"UPDATE Users SET {set_clause} WHERE UserId = ?"
        cursor = execute_query_with_retry(conn, query, values + [str(user_id)])

        if cursor.rowcount == 0:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({'message': 'User updated successfully'}), 200

    except sqlite3.Error as e:
        print(f"SQLite Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()


# ID-based creation date logic
entries = [[1000000, 1380326400], [2768409, 1383264000], [7679610, 1388448000], [11538514, 1391212000], [15835244, 1392940000], [23646077, 1393459000], [38015510, 1393632000], [44634663, 1399334000], [46145305, 1400198000], [54845238, 1411257000], [63263518, 1414454000], [101260938, 1425600000], [101323197, 1426204000], [103151531, 1433376000], [103258382, 1432771000], [109393468, 1439078000], [111220210, 1429574000], [112594714, 1439683000], [116812045, 1437696000], [122600695, 1437782000], [124872445, 1439856000], [125828524, 1444003000], [130029930, 1441324000], [133909606, 1444176000], [143445125, 1448928000], [148670295, 1452211000], [152079341, 1453420000], [157242073, 1446768000], [171295414, 1457481000], [181783990, 1460246000], [222021233, 1465344000], [225034354, 1466208000], [278941742, 1473465000], [285253072, 1476835000], [294851037, 1479600000], [297621225, 1481846000], [328594461, 1482969000], [337808429, 1487707000], [341546272, 1487782000], [352940995, 1487894000], [369669043, 1490918000], [400169472, 1501459000], [616816630, 1529625600], [681896077, 1532821500], [727572658, 1543708800], [796147074, 1541371800], [925078064, 1563290000], [928636984, 1581513420], [1054883348, 1585674420], [1057704545, 1580393640], [1145856008, 1586342040], [1227964864, 1596127860], [1382531194, 1600188120], [1658586909, 1613148540], [1660971491, 1613329440], [1692464211, 1615402500], [1719536397, 1619293500], [1721844091, 1620224820], [1772991138, 1617540360], [1807942741, 1625520300], [1893429550, 1622040000], [1972424006, 1631669400], [1974255900, 1634000000], [2030606431, 1631992680], [2041327411, 1631989620], [2078711279, 1634321820], [2104178931, 1638353220], [2120496865, 1636714020], [2123596685, 1636503180], [2138472342, 1637590800], [3318845111, 1618028800], [4317845111, 1620028800], [5162494923, 1652449800], [5186883095, 1648764360], [5304951856, 1656718440], [5317829834, 1653152820], [5318092331, 1652024220], [5336336790, 1646368100], [5362593868, 1652024520], [5387234031, 1662137700], [5396587273, 1648014800], [5409444610, 1659025020], [5416026704, 1660925460], [5465223076, 1661710860], [5480654757, 1660926300], [5499934702, 1662130740], [5513192189, 1659626400], [5522237606, 1654167240], [5537251684, 1664269800], [5559167331, 1656718560], [5568348673, 1654642200], [5591759222, 1659025500], [5608562550, 1664012820], [5614111200, 1661780160], [5666819340, 1664112240], [5684254605, 1662134040], [5684689868, 1661304720], [5707112959, 1663803300], [5756095415, 1660925940], [5772670706, 1661539140], [5778063231, 1667477640], [5802242180, 1671821040], [5853442730, 1674866100], [5859878513, 1673117760], [5885964106, 1671081840], [5982648124, 1686941700], [6020888206, 1675534800], [6032606998, 1686998640], [6057123350, 1676198350], [6058560984, 1686907980], [6101607245, 1686830760], [6108011341, 1681032060], [6132325730, 1692033840], [6182056052, 1687870740], [6279839148, 1688399160], [6306077724, 1692442920], [6321562426, 1688486760], [6364973680, 1696349340], [6386727079, 1691696880], [6429580803, 1692082680], [6527226055, 1690289160], [6813121418, 1698489600], [6865576492, 1699052400], [6925870357, 1701192327]]
entries.sort(key=lambda x: x[0])  # Sort the entries by ID

def predict_creation_date(id: int) -> datetime:
    """Predicts the creation date for a given ID."""
    if id <= entries[0][0]:
        return datetime.fromtimestamp(entries[0][1])
    for i in range(1, len(entries)):
        if entries[i-1][0] <= id <= entries[i][0]:
            t = (id - entries[i-1][0]) / (entries[i][0] - entries[i-1][0])
            reg_time = int(entries[i-1][1] + t * (entries[i][1] - entries[i-1][1]))
            return datetime.fromtimestamp(reg_time)
    return datetime.fromtimestamp(entries[-1][1])


@app.route('/get_user_ranking', methods=['GET'])
def get_user_ranking():
    try:
        conn = get_db_connection(DATABASE)
        cursor = conn.cursor()

        # Extract user ID from the request parameters (not from init_data)
        user_id = request.args.get('UserId', None)
        if not user_id:
            return jsonify({'error': 'UserId is required'}), 400

        # Query to select all users, ordered by totalgot desc
        cursor.execute("""
            SELECT UserId, Username, totalgot
            FROM Users
            ORDER BY totalgot DESC
            LIMIT 100
        """)
        top_users = cursor.fetchall()
        if not top_users:
            return jsonify({'error': 'No users found'}), 404

        top_users_list = [
            {'rank': i + 1, 'username': u['Username'], 'totalgot': u['totalgot']}
            for i, u in enumerate(top_users)
        ]

        cursor.execute("""
            SELECT UserId, Username, totalgot
            FROM Users
            WHERE UserId = ?
        """, (user_id,))
        requested_user_data = cursor.fetchone()

        if not requested_user_data:
            requested_user = {'error': 'User not found'}
        else:
            cursor.execute("""
                SELECT COUNT(*) AS Rank
                FROM Users
                WHERE totalgot > ?
            """, (requested_user_data['totalgot'],))
            rank = cursor.fetchone()['Rank'] + 1
            requested_user = {
                'position': rank,
                'username': requested_user_data['Username'],
                'totalgot': requested_user_data['totalgot']
            }

        cursor.execute("SELECT COUNT(*) as TotalUsers FROM Users")
        total_users = cursor.fetchone()['TotalUsers']
        formatted_total = f"{total_users / 1000:.3f}k"

        response = {
            'requested_user': requested_user,
            'top_users': top_users_list,
            'total_users': formatted_total
        }
        return jsonify(response), 200

    except sqlite3.Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.route('/get_creation_month_count', methods=['GET'])
def get_creation_month_count():
    try:
        user_id = int(request.args.get('userid'))
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid or missing user ID'}), 400

    creation_date = predict_creation_date(user_id)
    if not creation_date:
        return jsonify({'error': 'User not found or creation date unavailable'}), 404

    current_date = datetime.now()
    delta = relativedelta(current_date, creation_date)
    total_months = delta.years * 12 + delta.months

    if total_months < 12:
        reward = 30000
    elif 12 <= total_months < 24:
        reward = 50000
    elif 24 <= total_months < 36:
        reward = 60000
    elif 36 <= total_months < 48:
        reward = 70000
    elif 48 <= total_months < 60:
        reward = 80000
    else:
        reward = 100000

    total_years = round(total_months / 12.0, 1)
    return jsonify({
        'user_id': user_id,
        'years': total_years,
        'months': total_months,
        'reward': reward
    })


@app.route('/check_telegram_status', methods=['GET'])
def check_telegram_status():
    user_id = request.args.get('user_id')
    chat_id = request.args.get('chat_id')
    print(f"Received user_id: {user_id}, chat_id: {chat_id}")

    if not user_id or not chat_id:
        return jsonify({'error': 'User ID and Chat ID are required'}), 400

    bot_token = '7846799651:AAGOt2D3udtnh9Aos0haWQUfiRIUVTbefwg'
    url = f'https://api.telegram.org/bot{bot_token}/getChatMember?chat_id={chat_id}&user_id={user_id}'
    response = requests.get(url)
    if response.ok:
        data = response.json()
        print("Response from Telegram API:", data)
        if data.get('ok') and 'result' in data and 'status' in data['result']:
            if data['result']['status'] in ['member', 'administrator', 'creator']:
                return jsonify({'status': '1'})
        return jsonify({'status': '0'})
    else:
        return jsonify({'error': 'Failed to connect to Telegram API'}), 500


@app.route('/download_db', methods=['GET'])
def download_db():
    """
    Endpoint to download the database file.
    """
    try:
        return send_file(DATABASE, as_attachment=True, download_name='mydatabase2.db')
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/update_all', methods=['POST'])
def update_all():
    """
    Update a specified column with a given value for all rows in the Users table of mydatabase2.db.
    Expects JSON input with:
      - "column": the name of the column to update
      - "value": the new value to set for that column
    """
    data = request.json
    column = data.get('column')
    value = data.get('value')

    if not column or value is None:
        return jsonify({'error': 'Both "column" and "value" are required.'}), 400

    allowed_columns = {
        "UserId", "totalgot", "invitedby", "miningstarttime", "timeinminute", "rate",
        "youtube", "instagram", "discord", "telegram", "X", "facebook", "Username",
        "dailycombotime", "dailyclaimedtime", "alreadydailyclaimed", "walletid",
        "Refertotal", "referrewarded", "task1", "task2", "task7", "task14",
        "task10", "task11", "task12", "task17", "xid", "Invite5Friends", "totalcollectabledaily","totalcollectabledaily ","claimedtotal"
    }
    if column not in allowed_columns:
        return jsonify({'error': 'Invalid column name.'}), 400

    try:
        conn = get_db_connection(DATABASE)
        query = f"UPDATE Users SET {column} = ?"
        execute_query_with_retry(conn, query, (value,))
        return jsonify({'message': f'Column "{column}" updated to "{value}" for all rows successfully.'}), 200
    except sqlite3.Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route('/gamer', methods=['POST'])
def get_or_add_gamer():
    """
    Retrieve gamer details if exists, otherwise add the gamer to the database.
    Args:
        GamerId (int): Gamer ID to retrieve or add.
    Returns:
        Response with gamer details.
    """
    data = request.json
    gamer_id = data.get('GamerId')

    if not gamer_id:
        return jsonify({'error': 'GamerId is required'}), 400

    try:
        conn = get_db_connection(GAME_DATABASE)

        query_check = "SELECT * FROM gamers WHERE userid = ?"
        cursor = execute_query_with_retry(conn, query_check, (gamer_id,))
        gamer = cursor.fetchone()

        if gamer:
            gamer_dict = dict(gamer)
            return jsonify({'data': gamer_dict}), 200

        query_insert = """
        INSERT INTO gamers (userid, hookspeed, multiplier, hookspeedtime, multipliertime, startime, starmultiplier)
        VALUES (?, 1, 1, 0, 0, 0, 1)
        """
        execute_query_with_retry(conn, query_insert, (gamer_id,))

        cursor = execute_query_with_retry(conn, query_check, (gamer_id,))
        gamer = cursor.fetchone()
        gamer_dict = dict(gamer)

        return jsonify({'data': gamer_dict}), 201

    except sqlite3.Error as e:
        print(f"SQLite Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route('/update_gamer', methods=['POST'])
def update_gamer():
    """
    Update multiple column values for a gamer based on GamerId.
    Args:
        GamerId (int): Gamer ID to update.
        Fields to update (optional): hookspeed, multiplier, hookspeedtime, multipliertime, startime, starmultiplier.
    Returns:
        Response with success message or error message.
    """
    data = request.json
    gamer_id = data.get('GamerId')

    if not gamer_id:
        return jsonify({'error': 'GamerId is required'}), 400

    update_data = {k: v for k, v in data.items() if k != 'GamerId'}
    if not update_data:
        return jsonify({'error': 'No data provided for update'}), 400

    set_clause = ', '.join([f"{key} = ?" for key in update_data.keys()])
    values = list(update_data.values())

    try:
        conn = get_db_connection(GAME_DATABASE)
        query = f"UPDATE gamers SET {set_clause} WHERE userid = ?"
        cursor = execute_query_with_retry(conn, query, values + [gamer_id])

        if cursor.rowcount == 0:
            return jsonify({'error': 'Gamer not found'}), 404

        return jsonify({'message': 'Gamer updated successfully'}), 200

    except sqlite3.Error as e:
        print(f"SQLite Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route('/increase_totalgot', methods=['POST'])
def increase_totalgot():
    """
    Increase the totalgot value for a user based on UserId.
    Args:
        UserId (int): User ID to update.
        Amount (int): Amount to increase totalgot by.
    Returns:
        Response with success message or error message.
    """
    data = request.json
    user_id = data.get('UserId')
    amount = data.get('Amount')

    if not user_id or amount is None:
        return jsonify({'error': 'UserId and Amount are required'}), 400

    try:
        conn = get_db_connection(DATABASE)
        query_select = "SELECT totalgot FROM Users WHERE UserId = ?"
        cursor = execute_query_with_retry(conn, query_select, (user_id,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        new_total = user['totalgot'] + amount
        query_update = "UPDATE Users SET totalgot = ? WHERE UserId = ?"
        execute_query_with_retry(conn, query_update, (new_total, user_id))

        return jsonify({'message': 'Total got updated successfully', 'totalgot': new_total}), 200

    except sqlite3.Error as e:
        print(f"SQLite Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()


# IMPORTANT: Ensure Taskdetails table has "taskid INTEGER PRIMARY KEY AUTOINCREMENT"
# so each new task gets a brand-new ID. This prevents ID collisions with old tasks.
@app.route('/add_task', methods=['POST'])
def add_task():
    try:
        # Retrieve image file from request
        file = request.files.get('taskimage')
        task_title = request.form.get('tasktitle')
        task_reward = request.form.get('taskreward')
        task_link = request.form.get('tasklink')

        # Ensure all fields are provided
        if not task_title or not task_reward or not file or not task_link:
            return jsonify({'error': 'tasktitle, taskreward, taskimage, and tasklink are required'}), 400

        # Save the image file if present
        if file:
            extension = file.filename.rsplit('.', 1)[1].lower()
            filename = f"{uuid.uuid4()}.{extension}"
            file_path = os.path.join('static/images', filename)
            file.save(file_path)

            # Generate a URL to access the image dynamically
            task_image_url = f"{request.url_root.rstrip('/')}/static/images/{filename}"

            conn = get_db_connection(task_database)

            # Insert the task into Taskdetails with autoincrementing taskid
            query_insert = """
            INSERT INTO Taskdetails (tasktitle, taskreward, taskimage, tasklink)
            VALUES (?, ?, ?, ?)
            """
            cursor = execute_query_with_retry(conn, query_insert, (task_title, task_reward, task_image_url, task_link))
            task_id = cursor.lastrowid if cursor else None

            return jsonify({'message': 'Task added successfully', 'taskid': task_id}), 201

        else:
            return jsonify({'error': 'Image file is required'}), 400
    except Exception as e:
        print(f"Unexpected error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/remove_task', methods=['DELETE'])
def remove_task():
    """
    Removes the specified task from Taskdetails AND cleans up Taskdone so no user 
    is left with this taskid in their 'tasks' string.
    """
    task_id = request.args.get('taskid')
    if not task_id:
        return jsonify({'error': 'taskid is required'}), 400

    try:
        conn = get_db_connection(task_database)

        # 1. Delete from Taskdetails
        query_delete = "DELETE FROM Taskdetails WHERE taskid = ?"
        cursor = execute_query_with_retry(conn, query_delete, (task_id,))

        if cursor.rowcount == 0:
            return jsonify({'error': 'Task not found'}), 404

        # 2. Also remove this taskid from users' Taskdone records
        query_taskdone = "SELECT userid, tasks FROM Taskdone"
        td_cursor = conn.cursor()
        td_cursor.execute(query_taskdone)
        all_user_tasks = td_cursor.fetchall()

        for row in all_user_tasks:
            tasks_str = row['tasks'] or ""
            tasks_list = tasks_str.split(',') if tasks_str else []
            # Filter out the removed task_id
            updated_tasks_list = [tid for tid in tasks_list if tid != task_id]

            if len(updated_tasks_list) < len(tasks_list):
                # We actually removed something -> update the row
                new_str = ",".join(updated_tasks_list)
                update_td_query = "UPDATE Taskdone SET tasks = ? WHERE userid = ?"
                execute_query_with_retry(conn, update_td_query, (new_str, row['userid']))

        return jsonify({'message': 'Task removed successfully'}), 200

    except sqlite3.Error as e:
        print(f"SQLite Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route('/mark_task_done', methods=['POST'])
def mark_task_done():
    data = request.json
    user_id = data.get('userid')
    task_id = data.get('taskid')

    if not user_id or not task_id:
        return jsonify({'error': 'userid and taskid are required'}), 400

    try:
        conn = get_db_connection(task_database)

        # Check if user already has a Taskdone row
        query_check = "SELECT * FROM Taskdone WHERE userid = ?"
        user_tasks = execute_query_with_retry(conn, query_check, (user_id,)).fetchone()

        if not user_tasks:
            # Create new entry with the single taskid
            query_insert = """
            INSERT INTO Taskdone (userid, tasks)
            VALUES (?, ?)
            """
            execute_query_with_retry(conn, query_insert, (user_id, task_id))
            return jsonify({'message': 'User added and task marked as done'}), 201

        existing_tasks = user_tasks['tasks'] or ""
        existing_tasks_list = existing_tasks.split(',') if existing_tasks else []

        if str(task_id) not in existing_tasks_list:
            updated_tasks = f"{existing_tasks},{task_id}" if existing_tasks else str(task_id)
            query_update = "UPDATE Taskdone SET tasks = ? WHERE userid = ?"
            execute_query_with_retry(conn, query_update, (updated_tasks, user_id))
            return jsonify({'message': 'Task marked as done for existing user'}), 200
        else:
            return jsonify({'message': 'Task already marked as done'}), 200

    except sqlite3.Error as e:
        print(f"SQLite Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route('/get_user_tasks', methods=['GET'])
def get_user_tasks():
    user_id = request.args.get('userid')
    if not user_id:
        return jsonify({'error': 'userid is required'}), 400

    try:
        conn = get_db_connection(task_database)

        # Retrieve all tasks from Taskdetails
        query_task_details = "SELECT * FROM Taskdetails"
        task_details_cursor = execute_query_with_retry(conn, query_task_details)
        task_details = task_details_cursor.fetchall()
        task_details_list = [dict(task) for task in task_details]

        # Retrieve user's completed tasks
        query_task_done = "SELECT * FROM Taskdone WHERE userid = ?"
        task_done_cursor = execute_query_with_retry(conn, query_task_done, (user_id,))
        user_tasks = task_done_cursor.fetchone()

        completed_task_ids = user_tasks['tasks'] if user_tasks else None

        response = {
            'task_details': task_details_list,
            'completed_tasks': completed_task_ids
        }
        return jsonify(response), 200

    except sqlite3.Error as e:
        print(f"SQLite Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route('/get_all_user_details', methods=['GET'])
def get_all_user_details():
    try:
        user_conn = get_db_connection(DATABASE)
        game_conn = get_db_connection(GAME_DATABASE)
        task_conn = get_db_connection(task_database)

        # Get all users
        user_query = """
            SELECT 
                UserId, 
                Username, 
                Refertotal, 
                totalgot, 
                invitedby, 
                referrewarded,
                task1, 
                task2, 
                X, 
                task7, 
                task14, 
                task10, 
                task11, 
                task12, 
                task17,
                xid,
                Invite5Friends,
                totalcollectabledaily
            FROM Users
        """
        user_cursor = user_conn.execute(user_query)
        users = user_cursor.fetchall()

        # hookspeed + multiplier from gamers
        game_query = "SELECT userid, hookspeed, multiplier FROM gamers"
        game_cursor = game_conn.execute(game_query)
        gamer_data = {
            str(row['userid']): {'hookspeed': row['hookspeed'], 'multiplier': row['multiplier']}
            for row in game_cursor.fetchall()
        }

        # tasks from Taskdone
        task_query = "SELECT userid, tasks FROM Taskdone"
        task_cursor = task_conn.execute(task_query)
        task_data = {
            str(row['userid']): row['tasks']
            for row in task_cursor.fetchall()
        }

        result = []
        for user in users:
            uid_str = str(user['UserId'])
            user_details = {
                'UserId': uid_str,
                'Username': user['Username'],
                'Refertotal': user['Refertotal'],
                'totalgot': user['totalgot'],
                'referrewarded': user['referrewarded'],
                'invitefby': user['invitedby'],
                'hookspeed': gamer_data.get(uid_str, {}).get('hookspeed', None),
                'multiplier': gamer_data.get(uid_str, {}).get('multiplier', None),
                'tasks': task_data.get(uid_str, None),

                # Existing Task Columns
                'task1': user['task1'],
                'task2': user['task2'],
                'X': user['X'],
                'task7': user['task7'],
                'task14': user['task14'],
                'task10': user['task10'],
                'task11': user['task11'],
                'task12': user['task12'],
                'task17': user['task17'],

                # New Columns
                'xid': user['xid'],
                'Invite5Friends': user['Invite5Friends'],
                'totalcollectabledaily': user['totalcollectabledaily'],
            }
            result.append(user_details)

        return jsonify(result), 200

    except sqlite3.Error as e:
        print(f"SQLite Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if user_conn:
            user_conn.close()
        if game_conn:
            game_conn.close()
        if task_conn:
            task_conn.close()


# === New Section: Endpoints for exam.db ===

def get_exam_db_connection():
    """
    Establish a connection to the exam.db SQLite database.
    """
    return get_db_connection(EXAM_DATABASE)

@app.route('/number', methods=['POST'])
def create_questions():
    """
    Create a specified number of questions in the Exam table.
    Expects JSON input with 'number_of_questions'.
    """
    data = request.json
    number_of_questions = data.get('number_of_questions')

    if not isinstance(number_of_questions, int) or number_of_questions <= 0:
        return jsonify({'error': 'Valid "number_of_questions" is required and must be a positive integer.'}), 400

    try:
        conn = get_exam_db_connection()
        cursor = conn.cursor()

        for i in range(1, number_of_questions + 1):
            try:
                cursor.execute(
                    "INSERT INTO Exam (ques_no, ques, ans) VALUES (?, ?, ?)",
                    (i, '', '')
                )
            except sqlite3.IntegrityError:
                print(f"ques_no {i} already exists. Skipping insertion.")
                continue

        conn.commit()
        return jsonify({'message': f'{number_of_questions} questions created successfully.'}), 201

    except sqlite3.Error as e:
        print(f"SQLite Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/ques_ans', methods=['POST'])
def update_question_answer():
    """
    Update the question and answer for a specific ques_no in the Exam table.
    Expects JSON input with 'ques_no', 'ques', and 'ans'.
    """
    data = request.json
    ques_no = data.get('ques_no')
    ques = data.get('ques')
    ans = data.get('ans')

    if not isinstance(ques_no, int) or ques_no <= 0:
        return jsonify({'error': '"ques_no" must be a positive integer.'}), 400
    if not isinstance(ques, str) or not ques.strip():
        return jsonify({'error': '"ques" is required and must be a non-empty string.'}), 400
    if not isinstance(ans, str) or not ans.strip():
        return jsonify({'error': '"ans" is required and must be a non-empty string.'}), 400

    try:
        conn = get_exam_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM Exam WHERE ques_no = ?", (ques_no,))
        existing_question = cursor.fetchone()
        if not existing_question:
            return jsonify({'error': f'Question with ques_no {ques_no} does not exist.'}), 404

        cursor.execute(
            "UPDATE Exam SET ques = ?, ans = ? WHERE ques_no = ?",
            (ques, ans, ques_no)
        )
        conn.commit()
        return jsonify({'message': f'Question {ques_no} updated successfully.'}), 200

    except sqlite3.Error as e:
        print(f"SQLite Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/get_all_questions', methods=['GET'])
def get_all_questions():
    """
    Retrieve all questions from the Exam table.
    """
    try:
        conn = get_exam_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT ques_no, ques, ans FROM Exam")
        questions = cursor.fetchall()

        questions_list = [dict(question) for question in questions]
        return jsonify({'questions': questions_list}), 200

    except sqlite3.Error as e:
        print(f"SQLite Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/get_no', methods=['GET'])
def get_no():
    """
    Retrieve the 'ques' and 'ans' for a specific ques_no.
    Expects query parameter 'ques_no'.
    """
    ques_no = request.args.get('ques_no')
    if not ques_no:
        return jsonify({'error': 'ques_no is required'}), 400

    try:
        ques_no = int(ques_no)
        if ques_no <= 0:
            raise ValueError
    except ValueError:
        return jsonify({'error': '"ques_no" must be a positive integer.'}), 400

    try:
        conn = get_exam_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT ques, ans FROM Exam WHERE ques_no = ?", (ques_no,))
        question = cursor.fetchone()
        if not question:
            return jsonify({'error': f'Question with ques_no {ques_no} does not exist.'}), 404

        question_dict = dict(question)
        return jsonify({'ques_no': ques_no, 'ques': question_dict['ques'], 'ans': question_dict['ans']}), 200

    except sqlite3.Error as e:
        print(f"SQLite Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/erase_all', methods=['DELETE'])
def erase_all():
    """
    Erase all questions from the Exam table in exam.db,
    set 'claimedtotal' to NULL in mydatabase2.db's Users table,
    and set 'participant' and 'tba' to NULL in data.db's Data table.
    """
    try:
        exam_conn = get_exam_db_connection()
        exam_cursor = exam_conn.cursor()
        exam_cursor.execute("DELETE FROM Exam")
        exam_conn.commit()
        print("All questions from Exam table have been erased.")

        users_conn = get_db_connection(DATABASE)
        users_cursor = users_conn.cursor()
        users_cursor.execute("UPDATE Users SET claimedtotal = NULL")
        users_conn.commit()
        print("'claimedtotal' column in Users table has been set to NULL.")

        data_conn = get_data_db_connection()
        data_cursor = data_conn.cursor()
        data_cursor.execute("UPDATE Data SET participant = NULL, tba = NULL")
        data_conn.commit()
        print("'participant' and 'tba' columns in Data table have been set to NULL.")

        return jsonify({
            'message': 'All data has been erased successfully.',
            'details': {
                'Exam_table_erased': True,
                'claimedtotal_reset': True,
                'participant_reset': True,
                'tba_reset': True
            }
        }), 200

    except sqlite3.Error as e:
        print(f"SQLite Error during erase_all: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if 'exam_conn' in locals():
            exam_conn.close()
            print("Closed exam.db connection.")
        if 'users_conn' in locals():
            users_conn.close()
            print("Closed mydatabase2.db connection.")
        if 'data_conn' in locals():
            data_conn.close()
            print("Closed data.db connection.")

@app.route('/get_ques', methods=['GET'])
def get_question_text():
    ques_no = request.args.get('ques_no')
    if not ques_no:
        return jsonify({'error': 'ques_no is required'}), 400
    try:
        ques_no = int(ques_no)
        if ques_no <= 0:
            raise ValueError
    except ValueError:
        return jsonify({'error': '"ques_no" must be a positive integer.'}), 400

    try:
        conn = get_exam_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT ques FROM Exam WHERE ques_no = ?", (ques_no,))
        question = cursor.fetchone()
        if not question:
            return jsonify({'error': f'Question with ques_no {ques_no} does not exist.'}), 404
        return jsonify({'ques_no': ques_no, 'ques': question['ques']}), 200
    except sqlite3.Error as e:
        print(f"SQLite Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/compare_answer', methods=['POST'])
def compare_answer():
    data = request.json
    ques_no = data.get('ques_no')
    input_text = data.get('input_text')
    if not ques_no or not input_text:
        return jsonify({'error': 'ques_no and input_text are required'}), 400
    try:
        ques_no = int(ques_no)
        if ques_no <= 0:
            raise ValueError
    except ValueError:
        return jsonify({'error': '"ques_no" must be a positive integer.'}), 400

    try:
        conn = get_exam_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT ans FROM Exam WHERE ques_no = ?", (ques_no,))
        answer = cursor.fetchone()
        if not answer:
            return jsonify({'error': f'Answer for ques_no {ques_no} does not exist.'}), 404

        normalized_answer = ' '.join(answer['ans'].strip().lower().split())
        normalized_input = ' '.join(input_text.strip().lower().split())
        result = 1 if normalized_answer == normalized_input else 0
        return jsonify({'result': result}), 200
    except sqlite3.Error as e:
        print(f"SQLite Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

# === Endpoints for data.db ===
@app.route('/write_datas', methods=['POST'])
def write_datas():
    """
    Write data to the Data table in data.db.
    Accepts 1-8 parameters: prep_time, exam_time, number, fee, participant, link, title, tba.
    Only the provided parameters will be updated.
    """
    data = request.json
    prep_time = data.get('prep_time')
    exam_time = data.get('exam_time')
    number = data.get('number')
    fee = data.get('fee')
    participant = data.get('participant')
    link = data.get('link')
    title = data.get('title')
    tba = data.get('tba')

    fields_to_update = {}
    if prep_time is not None:
        fields_to_update['prep_time'] = prep_time
    if exam_time is not None:
        fields_to_update['exam_time'] = exam_time
    if number is not None:
        fields_to_update['number'] = number
    if fee is not None:
        fields_to_update['fee'] = fee
    if participant is not None:
        fields_to_update['participant'] = participant
    if link is not None:
        fields_to_update['link'] = link
    if title is not None:
        fields_to_update['title'] = title
    if tba is not None:
        fields_to_update['tba'] = tba

    if not fields_to_update:
        return jsonify({'error': 'At least one parameter is required.'}), 400

    try:
        conn = get_data_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM Data")
        row_count = cursor.fetchone()[0]

        if row_count == 0:
            columns = ', '.join(fields_to_update.keys())
            placeholders = ', '.join(['?'] * len(fields_to_update))
            values = list(fields_to_update.values())
            query = f"INSERT INTO Data ({columns}) VALUES ({placeholders})"
            execute_query_with_retry(conn, query, values)
            return jsonify({'message': 'Data inserted successfully.'}), 201
        else:
            set_clause = ', '.join([f"{key} = ?" for key in fields_to_update.keys()])
            values = list(fields_to_update.values())
            query = f"UPDATE Data SET {set_clause}"
            execute_query_with_retry(conn, query, values)
            return jsonify({'message': 'Data updated successfully.'}), 200

    except sqlite3.Error as e:
        print(f"SQLite Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/get_datas', methods=['GET'])
def get_datas():
    """
    Retrieve all data from the Data table in data.db.
    Now includes prep_time, exam_time, number, fee, participant, link, title, and tba.
    """
    try:
        conn = get_data_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT prep_time, exam_time, number, fee, participant, link, title, tba FROM Data LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return jsonify({'error': 'No data found.'}), 404

        data = {
            'prep_time': row['prep_time'],
            'exam_time': row['exam_time'],
            'number': row['number'],
            'fee': row['fee'],
            'participant': row['participant'],
            'link': row['link'],
            'title': row['title'],
            'tba': row['tba']
        }
        return jsonify({'data': data}), 200

    except sqlite3.Error as e:
        print(f"SQLite Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/inc_part', methods=['POST'])
def increment_participant():
    try:
        conn = get_data_db_connection()
        cursor = conn.cursor()

        # Increment the participant count by 1, treating NULL as 0
        cursor.execute("UPDATE Data SET participant = COALESCE(participant, 0) + 1")
        conn.commit()

        cursor.execute("SELECT participant FROM Data LIMIT 1")
        updated_row = cursor.fetchone()
        updated_participant = updated_row['participant'] if updated_row else None

        if updated_participant is not None:
            return jsonify({
                'message': 'Participant count incremented successfully.',
                'participant': updated_participant
            }), 200
        else:
            cursor.execute("INSERT INTO Data (participant) VALUES (1)")
            conn.commit()
            return jsonify({
                'message': 'Participant count initialized and incremented successfully.',
                'participant': 1
            }), 201

    except sqlite3.Error as e:
        print(f"SQLite Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/delete_user', methods=['DELETE'])
def delete_user():
    """
    Delete a user from the mydatabase2.db database.
    The entire row for the specified user will be removed.
    This endpoint does not affect any other databases.
    """
    user_id = request.args.get('UserId')
    if not user_id:
        return jsonify({'error': 'UserId is required'}), 400

    try:
        conn = get_db_connection(DATABASE)
        cursor = conn.cursor()

        check_query = "SELECT * FROM Users WHERE UserId = ?"
        user = execute_query_with_retry(conn, check_query, (user_id,)).fetchone()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        delete_query = "DELETE FROM Users WHERE UserId = ?"
        cursor = execute_query_with_retry(conn, delete_query, (user_id,))

        if cursor.rowcount == 0:
            return jsonify({'error': 'Failed to delete user'}), 500

        return jsonify({'message': 'User deleted successfully'}), 200

    except sqlite3.Error as e:
        print(f"SQLite Error during user deletion: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

# ───────────────────────── WEEKLY / MONTHLY LEADERBOARD ─────────────────────────
# Columns used:
#   • task33  – snapshot of totalgot at last weekly reset
#   • task34  – snapshot of totalgot at last monthly reset
#
# If either column does NOT exist yet the first helper below will create it with
#   DEFAULT 0 so your app never crashes.

def _ensure_snapshot_columns():
    conn = sqlite3.connect(DATABASE, check_same_thread=False)
    cur  = conn.cursor()
    cur.execute("PRAGMA table_info(Users)")
    columns = {c[1] for c in cur.fetchall()}
    added = False
    if "task33" not in columns:
        cur.execute("ALTER TABLE Users ADD COLUMN task33 INTEGER DEFAULT 0")
        added = True
    if "task34" not in columns:
        cur.execute("ALTER TABLE Users ADD COLUMN task34 INTEGER DEFAULT 0")
        added = True
    if added:
        conn.commit()
    conn.close()

_ensure_snapshot_columns()

# ───────── RESET ENDPOINTS ─────────
@app.route('/reset_week', methods=['POST'])
def reset_week():
    """Snapshot current totalgot into task33 for all users."""
    try:
        conn = get_db_connection(DATABASE)
        execute_query_with_retry(conn,
            "UPDATE Users SET task33 = COALESCE(totalgot, 0)"
        )
        return jsonify({'message': 'Weekly snapshot stored in task33'}), 200
    except sqlite3.Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn: conn.close()

@app.route('/reset_month', methods=['POST'])
def reset_month():
    """Snapshot current totalgot into task34 for all users."""
    try:
        conn = get_db_connection(DATABASE)
        execute_query_with_retry(conn,
            "UPDATE Users SET task34 = COALESCE(totalgot, 0)"
        )
        return jsonify({'message': 'Monthly snapshot stored in task34'}), 200
    except sqlite3.Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn: conn.close()

# ───────── GENERIC RANKING HELPER ─────────
def _get_time_ranking(field_snap, user_id):
    """
    field_snap: 'task33'→weekly, 'task34'→monthly
    score = totalgot - COALESCE(field_snap,0)
    """
    conn   = get_db_connection(DATABASE)
    cursor = conn.cursor()

    # 1. leaderboard top-100
    cursor.execute(f"""
        SELECT UserId, Username,
               totalgot - COALESCE({field_snap},0) AS score
        FROM   Users
        ORDER  BY score DESC
        LIMIT  100
    """)
    top = cursor.fetchall()
    top_list = [
        {'rank': i+1, 'username': r['Username'], 'score': max(r['score'], 0)}
        for i, r in enumerate(top)
    ]

    # 2. requested user
    cursor.execute(f"""
        SELECT Username,
               totalgot - COALESCE({field_snap},0) AS score
        FROM   Users
        WHERE  UserId = ?
    """, (user_id,))
    me = cursor.fetchone()
    if not me:
        me_dict = {'error': 'User not found'}
    else:
        cursor.execute(f"""
            SELECT COUNT(*) AS better
            FROM   Users
            WHERE  (totalgot - COALESCE({field_snap},0)) > ?
        """, (me['score'],))
        rank_num = cursor.fetchone()['better'] + 1
        me_dict  = {
            'position': rank_num,
            'username': me['Username'],
            'score': max(me['score'], 0)
        }

    # 3. total user count
    cursor.execute("SELECT COUNT(*) AS cnt FROM Users")
    total_users = cursor.fetchone()['cnt']
    formatted_total = f"{total_users/1000:.3f}k"

    conn.close()
    return {
        'requested_user': me_dict,
        'top_users':      top_list,
        'total_users':    formatted_total
    }

# ───────── FETCH ENDPOINTS ─────────
@app.route('/get_weekly', methods=['GET'])
def get_weekly():
    user_id = request.args.get('UserId')
    if not user_id:
        return jsonify({'error': 'UserId is required'}), 400
    try:
        data = _get_time_ranking('task33', user_id)
        return jsonify(data), 200
    except sqlite3.Error as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_monthly', methods=['GET'])
def get_monthly():
    user_id = request.args.get('UserId')
    if not user_id:
        return jsonify({'error': 'UserId is required'}), 400
    try:
        data = _get_time_ranking('task34', user_id)
        return jsonify(data), 200
    except sqlite3.Error as e:
        return jsonify({'error': str(e)}), 500

# ──────────────────── make sure Users.xid exists ───────────────────
def ensure_column_xid():
    conn = sqlite3.connect(DATABASE, check_same_thread=False)
    cur  = conn.cursor()
    cur.execute("PRAGMA table_info(Users)")
    if "xid" not in {c[1] for c in cur.fetchall()}:
        cur.execute("ALTER TABLE Users ADD COLUMN xid INTEGER DEFAULT 0")
        conn.commit()
    conn.close()

ensure_column_xid()

# ────────────────────────── /increase_xp endpoint ──────────────────────────
@app.route('/increase_xp', methods=['POST'])
def increase_xp():
    """
    Body JSON → { "UserId": "<tg id>", "Amount": <int> }
    Adds <Amount> to the user's XP balance stored in column `xid`.
    NULL in xid is treated as 0.
    """
    data = request.json
    user_id = data.get('UserId')
    amount  = data.get('Amount')

    if not user_id or amount is None:
        return jsonify({'error': 'UserId and Amount are required'}), 400
    try:
        amount = int(amount)
        if amount <= 0:
            raise ValueError
    except ValueError:
        return jsonify({'error': 'Amount must be a positive integer'}), 400

    try:
        conn = get_db_connection(DATABASE)

        # fetch current XP (treat NULL as 0)
        cur = execute_query_with_retry(conn,
              "SELECT COALESCE(xid, 0) AS xp FROM Users WHERE UserId = ?",
              (str(user_id),))
        row = cur.fetchone()
        if not row:
            return jsonify({'error': 'User not found'}), 404

        new_xp = row['xp'] + amount

        # update XP
        execute_query_with_retry(conn,
              "UPDATE Users SET xid = ? WHERE UserId = ?",
              (new_xp, str(user_id)))

        return jsonify({
            'message': f'XP increased by {amount}',
            'xid': new_xp
        }), 200

    except sqlite3.Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()
            

# === Endpoints for info.db (Single Row Approach) ===
INFO_DATABASE = 'info.db'
WITHDRAW_DATABASE = 'withdraw.db'

def get_info_db_connection():
    """
    Establish a connection to the info.db SQLite database.
    """
    return get_db_connection(INFO_DATABASE)

def get_withdraw_db_connection():
    """
    Establish a connection to the withdraw.db SQLite database.
    """
    return get_db_connection(WITHDRAW_DATABASE)

def ensure_info_row_exists():
    """
    Ensure there's at least one row in the info table with default values.
    """
    try:
        conn = get_info_db_connection()
        cursor = conn.cursor()
        
        # Check if any row exists
        cursor.execute("SELECT COUNT(*) FROM info")
        count = cursor.fetchone()[0]
        
        if count == 0:
            # Insert default row
            cursor.execute("""
                INSERT INTO info (ratio, exchange_rat, with_lim) 
                VALUES ('1000', '[[10,1],[30,2],[100,5],[250,10],[500,15],[1000,25]]', '100')
            """)
            conn.commit()
            print("Default info row created")
        
        conn.close()
    except sqlite3.Error as e:
        print(f"Error ensuring info row exists: {e}")

# Initialize default row on startup
ensure_info_row_exists()

# Ratio management endpoints
@app.route('/get_ratio', methods=['GET'])
def get_ratio():
    """
    Get the current conversion ratio from info.db.
    """
    try:
        conn = get_info_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT ratio FROM info LIMIT 1")
        result = cursor.fetchone()
        
        if result and result[0]:
            return jsonify({'ratio': result[0]}), 200
        else:
            return jsonify({'ratio': '1000'}), 200  # Default ratio
            
    except sqlite3.Error as e:
        print(f"SQLite Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/update_ratio', methods=['POST'])
def update_ratio():
    """
    Update the conversion ratio in info.db.
    Expects JSON input with 'ratio'.
    """
    data = request.json
    ratio = data.get('ratio')
    
    if not ratio:
        return jsonify({'error': 'ratio is required'}), 400
    
    try:
        conn = get_info_db_connection()
        cursor = conn.cursor()
        
        # Update the single row
        cursor.execute("UPDATE info SET ratio = ?", (str(ratio),))
        conn.commit()
        
        return jsonify({'message': f'Ratio updated to {ratio}'}), 200
        
    except sqlite3.Error as e:
        print(f"SQLite Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

# Exchange rates management endpoints
@app.route('/get_exchange_rates', methods=['GET'])
def get_exchange_rates():
    """
    Get all exchange rates from info.db.
    """
    try:
        conn = get_info_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT exchange_rat FROM info LIMIT 1")
        result = cursor.fetchone()
        
        if result and result[0]:
            try:
                exchange_rates = json.loads(result[0])
                return jsonify({'exchange_rates': exchange_rates}), 200
            except json.JSONDecodeError:
                return jsonify({'exchange_rates': []}), 200
        else:
            return jsonify({'exchange_rates': []}), 200
        
    except sqlite3.Error as e:
        print(f"SQLite Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/add_exchange_rate', methods=['POST'])
def add_exchange_rate():
    """
    Add a new exchange rate to info.db.
    Expects JSON input with 'tws_amount' and 'ton_amount'.
    """
    data = request.json
    tws_amount = data.get('tws_amount')
    ton_amount = data.get('ton_amount')
    
    if not tws_amount or not ton_amount:
        return jsonify({'error': 'tws_amount and ton_amount are required'}), 400
    
    try:
        conn = get_info_db_connection()
        cursor = conn.cursor()
        
        # Get existing exchange rates
        cursor.execute("SELECT exchange_rat FROM info LIMIT 1")
        result = cursor.fetchone()
        
        existing_rates = []
        if result and result[0]:
            try:
                existing_rates = json.loads(result[0])
            except json.JSONDecodeError:
                existing_rates = []
        
        # Add new rate
        new_rate = [tws_amount, ton_amount]
        existing_rates.append(new_rate)
        
        # Update the single row
        cursor.execute("UPDATE info SET exchange_rat = ?", (json.dumps(existing_rates),))
        conn.commit()
        
        return jsonify({'message': f'Exchange rate added: {tws_amount} TWS = {ton_amount} TON', 'exchange_rates': existing_rates}), 200
        
    except sqlite3.Error as e:
        print(f"SQLite Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/update_exchange_rate', methods=['PUT'])
def update_exchange_rate():
    """
    Update an existing exchange rate in info.db.
    Expects JSON input with 'index', 'tws_amount', and 'ton_amount'.
    """
    data = request.json
    index = data.get('index')
    tws_amount = data.get('tws_amount')
    ton_amount = data.get('ton_amount')
    
    if index is None or not tws_amount or not ton_amount:
        return jsonify({'error': 'index, tws_amount and ton_amount are required'}), 400
    
    try:
        conn = get_info_db_connection()
        cursor = conn.cursor()
        
        # Get existing exchange rates
        cursor.execute("SELECT exchange_rat FROM info LIMIT 1")
        result = cursor.fetchone()
        
        if not result or not result[0]:
            return jsonify({'error': 'No exchange rates found'}), 404
        
        try:
            existing_rates = json.loads(result[0])
        except json.JSONDecodeError:
            return jsonify({'error': 'Invalid exchange rates format'}), 400
        
        if index < 0 or index >= len(existing_rates):
            return jsonify({'error': 'Invalid index'}), 400
        
        # Update the rate at the specified index
        existing_rates[index] = [tws_amount, ton_amount]
        
        # Update the single row
        cursor.execute("UPDATE info SET exchange_rat = ?", (json.dumps(existing_rates),))
        conn.commit()
        
        return jsonify({'message': f'Exchange rate updated at index {index}: {tws_amount} TWS = {ton_amount} TON', 'exchange_rates': existing_rates}), 200
        
    except sqlite3.Error as e:
        print(f"SQLite Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/delete_exchange_rate', methods=['DELETE'])
def delete_exchange_rate():
    """
    Delete an exchange rate from info.db.
    Expects query parameter 'index'.
    """
    index = request.args.get('index')
    
    if index is None:
        return jsonify({'error': 'index is required'}), 400
    
    try:
        index = int(index)
    except ValueError:
        return jsonify({'error': 'index must be a number'}), 400
    
    try:
        conn = get_info_db_connection()
        cursor = conn.cursor()
        
        # Get existing exchange rates
        cursor.execute("SELECT exchange_rat FROM info LIMIT 1")
        result = cursor.fetchone()
        
        if not result or not result[0]:
            return jsonify({'error': 'No exchange rates found'}), 404
        
        try:
            existing_rates = json.loads(result[0])
        except json.JSONDecodeError:
            return jsonify({'error': 'Invalid exchange rates format'}), 400
        
        if index < 0 or index >= len(existing_rates):
            return jsonify({'error': 'Invalid index'}), 400
        
        # Remove the rate at the specified index
        deleted_rate = existing_rates.pop(index)
        
        # Update the single row
        cursor.execute("UPDATE info SET exchange_rat = ?", (json.dumps(existing_rates),))
        conn.commit()
        
        return jsonify({'message': f'Exchange rate deleted: {deleted_rate[0]} TWS = {deleted_rate[1]} TON', 'exchange_rates': existing_rates}), 200
        
    except sqlite3.Error as e:
        print(f"SQLite Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/set_exchange_rates', methods=['POST'])
def set_exchange_rates():
    """
    Set all exchange rates at once in info.db.
    Expects JSON input with 'exchange_rates' array.
    """
    data = request.json
    exchange_rates = data.get('exchange_rates')
    
    if not exchange_rates or not isinstance(exchange_rates, list):
        return jsonify({'error': 'exchange_rates array is required'}), 400
    
    try:
        conn = get_info_db_connection()
        cursor = conn.cursor()
        
        # Update the single row
        cursor.execute("UPDATE info SET exchange_rat = ?", (json.dumps(exchange_rates),))
        conn.commit()
        
        return jsonify({'message': f'Exchange rates updated successfully', 'exchange_rates': exchange_rates}), 200
        
    except sqlite3.Error as e:
        print(f"SQLite Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

# Withdrawal limit endpoints
@app.route('/get_withdrawal_limit', methods=['GET'])
def get_withdrawal_limit():
    """
    Get the withdrawal limit from info.db.
    """
    try:
        conn = get_info_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT with_lim FROM info LIMIT 1")
        result = cursor.fetchone()
        
        if result and result[0]:
            return jsonify({'withdrawal_limit': result[0]}), 200
        else:
            return jsonify({'withdrawal_limit': '100'}), 200  # Default limit
            
    except sqlite3.Error as e:
        print(f"SQLite Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/update_withdrawal_limit', methods=['POST'])
def update_withdrawal_limit():
    """
    Update the withdrawal limit in info.db.
    Expects JSON input with 'withdrawal_limit'.
    """
    data = request.json
    withdrawal_limit = data.get('withdrawal_limit')
    
    if not withdrawal_limit:
        return jsonify({'error': 'withdrawal_limit is required'}), 400
    
    try:
        conn = get_info_db_connection()
        cursor = conn.cursor()
        
        # Update the single row
        cursor.execute("UPDATE info SET with_lim = ?", (str(withdrawal_limit),))
        conn.commit()
        
        return jsonify({'message': f'Withdrawal limit updated to {withdrawal_limit}'}), 200
        
    except sqlite3.Error as e:
        print(f"SQLite Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

# Withdrawal request endpoints
@app.route('/request_withdrawal', methods=['POST'])
def request_withdrawal():
    """
    Create a withdrawal request in withdraw.db.
    Expects JSON input with 'amount', 'address', and 'user_id'.
    """
    data = request.json
    amount = data.get('amount')
    address = data.get('address')
    user_id = data.get('user_id')
    
    if not amount or not address or not user_id:
        return jsonify({'error': 'amount, address, and user_id are required'}), 400
    
    try:
        conn = get_withdraw_db_connection()
        cursor = conn.cursor()
        
        # Insert new withdrawal request (store user_id in col1)
        cursor.execute("""
            INSERT INTO withdrawals (amount, address, col1, col2) 
            VALUES (?, ?, ?, ?)
        """, (str(amount), str(address), str(user_id), ''))
        conn.commit()
        
        return jsonify({'message': f'Withdrawal request created for {amount} TWS'}), 200
        
    except sqlite3.Error as e:
        print(f"SQLite Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/get_withdrawals', methods=['GET'])
def get_withdrawals():
    """
    Get all withdrawal requests from withdraw.db.
    """
    try:
        conn = get_withdraw_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, amount, address, col1, col2 FROM withdrawals ORDER BY id DESC")
        results = cursor.fetchall()
        
        withdrawals = []
        for result in results:
            withdrawals.append({
                'id': result[0],
                'amount': result[1],
                'address': result[2],
                'user_id': result[3],  # col1 stores user_id
                'col2': result[4]
            })
        
        return jsonify({'withdrawals': withdrawals}), 200
        
    except sqlite3.Error as e:
        print(f"SQLite Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/delete_withdrawal', methods=['DELETE'])
def delete_withdrawal():
    """
    Delete a withdrawal request from withdraw.db and reset user's TWS balance to 0.
    Expects query parameters 'withdrawal_id' and 'user_id'.
    """
    withdrawal_id = request.args.get('withdrawal_id')
    user_id = request.args.get('user_id')
    
    if not withdrawal_id or not user_id:
        return jsonify({'error': 'withdrawal_id and user_id are required'}), 400
    
    try:
        withdrawal_id = int(withdrawal_id)
    except ValueError:
        return jsonify({'error': 'withdrawal_id must be a number'}), 400
    
    try:
        # Start transaction
        withdraw_conn = get_withdraw_db_connection()
        users_conn = get_db_connection(DATABASE)
        
        # Check if withdrawal exists
        withdraw_cursor = withdraw_conn.cursor()
        withdraw_cursor.execute("SELECT amount, address FROM withdrawals WHERE id = ?", (withdrawal_id,))
        withdrawal = withdraw_cursor.fetchone()
        
        if not withdrawal:
            return jsonify({'error': 'Withdrawal request not found'}), 404
        
        # Delete the withdrawal request
        withdraw_cursor.execute("DELETE FROM withdrawals WHERE id = ?", (withdrawal_id,))
        withdraw_conn.commit()
        
        # Reset user's TWS balance to 0
        users_cursor = users_conn.cursor()
        users_cursor.execute("UPDATE Users SET totalcollectabledaily = '0' WHERE UserId = ?", (str(user_id),))
        users_conn.commit()
        
        return jsonify({
            'message': f'Withdrawal request #{withdrawal_id} processed and user balance reset to 0',
            'withdrawal_amount': withdrawal[0],
            'withdrawal_address': withdrawal[1]
        }), 200
        
    except sqlite3.Error as e:
        print(f"SQLite Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if withdraw_conn:
            withdraw_conn.close()
        if users_conn:
            users_conn.close()

if __name__ == "__main__":
    app.run(debug=True, threaded=True)
