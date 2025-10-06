# Backend API Documentation

## Overview
This backend serves the TWS Vision platform with user management, task system, withdrawal processing, and configuration management.

## Setup Instructions

### Prerequisites
- Python 3.8+
- pip (Python package manager)

### Installation
```bash
cd backend
pip install -r requirements.txt
```

### Environment Configuration
Create `.env` file in backend folder:
```env
# Database Configuration
DATABASE_PATH=mydatabase2.db
GAME_DATABASE_PATH=game.db
TASK_DATABASE_PATH=Tasks.db
EXAM_DATABASE_PATH=exam.db
DATA_DATABASE_PATH=data.db
INFO_DATABASE_PATH=info.db
WITHDRAW_DATABASE_PATH=withdraw.db

# Telegram Bot Configuration
BOT_TOKEN=your_telegram_bot_token_here
TG_API_URL=https://api.telegram.org/bot

# Server Configuration
FLASK_ENV=production
FLASK_DEBUG=False
PORT=5000
HOST=0.0.0.0

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://yourdomain.com
```

### Running the Server
```bash
# Development
python app.py

# Production (using Gunicorn)
gunicorn -c gunicorn.config.py wsgi:app
```

## Database Schema

### Users Table (mydatabase2.db)
- `UserId` - Primary key
- `Username` - User's Telegram username
- `totalgot` - Total MTWS earned
- `totalcollectabledaily` - Current TWS balance
- `walletid` - User's wallet address
- `Refertotal` - Total referrals
- `invitedby` - Referrer's User ID
- Task completion columns (task1, task2, etc.)

### Info Table (info.db)
- `ratio` - MTWS to TWS conversion rate
- `exchange_rat` - JSON array of exchange rates
- `with_lim` - Minimum withdrawal limit

### Withdrawals Table (withdraw.db)
- `amount` - Withdrawal amount
- `address` - User's wallet address
- `col1` - User ID
- `col2` - Additional data

## API Endpoints

### User Management

#### Get All Users
```http
GET /get_all_user_details
```
**Response:**
```json
[
  {
    "UserId": "123456789",
    "Username": "john_doe",
    "totalgot": 5000,
    "totalcollectabledaily": 150,
    "walletid": "UQCFCaZ4rtUFsp7TbdodgvnjxgrvS7StGGhqDPwJmKWf8NgV",
    "Refertotal": 5,
    "invitedby": "987654321"
  }
]
```

#### Get Single User
```http
GET /get_user?UserId={user_id}
```

#### Add User
```http
POST /add_user
Content-Type: application/json

{
  "UserId": "123456789",
  "Username": "john_doe",
  "invitedby": "987654321"
}
```

#### Update User
```http
POST /update_user
Content-Type: application/json

{
  "UserId": "123456789",
  "totalgot": 6000,
  "walletid": "new_wallet_address"
}
```

### Task Management

#### Get All Tasks
```http
GET /get_user_tasks?userid=1
```
**Response:**
```json
{
  "task_details": [
    {
      "taskid": 1,
      "tasktitle": "Join Telegram",
      "taskreward": 1000,
      "taskimage": "http://localhost:5000/static/images/image.jpg",
      "tasklink": "https://t.me/example"
    }
  ],
  "completed_tasks": "1,2,3"
}
```

#### Add New Task
```http
POST /add_task
Content-Type: multipart/form-data

tasktitle: "New Task"
taskreward: 1000
tasklink: "https://example.com"
taskimage: [file]
```

#### Delete Task
```http
DELETE /remove_task?taskid={task_id}
```

#### Mark Task Complete
```http
POST /mark_task_done
Content-Type: application/json

{
  "userid": "123456789",
  "taskid": 1
}
```

### Withdrawal Management

#### Get Withdrawal Limit
```http
GET /get_withdrawal_limit
```
**Response:**
```json
{
  "withdrawal_limit": "100"
}
```

#### Update Withdrawal Limit
```http
POST /update_withdrawal_limit
Content-Type: application/json

{
  "withdrawal_limit": "200"
}
```

#### Get All Withdrawals
```http
GET /get_withdrawals
```
**Response:**
```json
{
  "withdrawals": [
    {
      "id": 1,
      "amount": "150",
      "address": "UQCFCaZ4rtUFsp7TbdodgvnjxgrvS7StGGhqDPwJmKWf8NgV",
      "user_id": "123456789",
      "col2": ""
    }
  ]
}
```

#### Request Withdrawal
```http
POST /request_withdrawal
Content-Type: application/json

{
  "amount": "150",
  "address": "UQCFCaZ4rtUFsp7TbdodgvnjxgrvS7StGGhqDPwJmKWf8NgV",
  "user_id": "123456789"
}
```

#### Process Withdrawal
```http
DELETE /delete_withdrawal?withdrawal_id={id}&user_id={user_id}
```

### Configuration Management

#### Get Conversion Ratio
```http
GET /get_ratio
```
**Response:**
```json
{
  "ratio": "1000"
}
```

#### Update Conversion Ratio
```http
POST /update_ratio
Content-Type: application/json

{
  "ratio": "1500"
}
```

#### Get Exchange Rates
```http
GET /get_exchange_rates
```
**Response:**
```json
{
  "exchange_rates": [
    [10, 1],
    [30, 2],
    [100, 5]
  ]
}
```

#### Add Exchange Rate
```http
POST /add_exchange_rate
Content-Type: application/json

{
  "tws_amount": 50,
  "ton_amount": 3
}
```

#### Update Exchange Rate
```http
PUT /update_exchange_rate
Content-Type: application/json

{
  "index": 0,
  "tws_amount": 15,
  "ton_amount": 1
}
```

#### Delete Exchange Rate
```http
DELETE /delete_exchange_rate?index={index}
```

#### Set All Exchange Rates
```http
POST /set_exchange_rates
Content-Type: application/json

{
  "exchange_rates": [
    [20, 1],
    [50, 2],
    [150, 5]
  ]
}
```

### Game Management

#### Get/Add Gamer
```http
POST /gamer
Content-Type: application/json

{
  "GamerId": "123456789"
}
```

#### Update Gamer
```http
POST /update_gamer
Content-Type: application/json

{
  "GamerId": "123456789",
  "hookspeed": 2,
  "multiplier": 1.5
}
```

### Payment Integration

#### Create Invoice
```http
POST /invoice
Content-Type: application/json

{
  "UserId": "123456789",
  "Stars": 100
}
```

#### Update Spins
```http
POST /update_spins
Content-Type: application/json

{
  "UserId": "123456789",
  "SpinsToAdd": 10
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `400` - Bad Request (missing/invalid parameters)
- `404` - Not Found
- `500` - Internal Server Error

Error responses include:
```json
{
  "error": "Error message description"
}
```

## Security Notes

- All endpoints validate input parameters
- SQL injection protection through parameterized queries
- CORS enabled for frontend domains
- Telegram WebApp data validation (when enabled)

## Production Deployment

### Using Gunicorn
```bash
gunicorn -c gunicorn.config.py wsgi:app
```

### Using Docker
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["gunicorn", "-c", "gunicorn.config.py", "wsgi:app"]
```

### Environment Variables for Production
```env
FLASK_ENV=production
FLASK_DEBUG=False
DATABASE_PATH=/data/mydatabase2.db
BOT_TOKEN=your_production_bot_token
ALLOWED_ORIGINS=https://yourdomain.com
```

## Monitoring & Logs

- Application logs to console
- Database connection retry logic
- Error tracking for failed operations
- Performance monitoring recommended for production

## Backup Strategy

Regular backup of database files:
- `mydatabase2.db` - User data
- `info.db` - Configuration
- `withdraw.db` - Withdrawal records
- `Tasks.db` - Task data

## Support

For technical issues:
1. Check application logs
2. Verify database file permissions
3. Ensure all environment variables are set
4. Test API endpoints individually

