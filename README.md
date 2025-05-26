# Middleware-based Microservices System with Rate Limiting, Auth & Redis

This project simulates a real-world **API Gateway (middleware)** that forwards client requests to **microservices** while controlling **authentication, rate-limiting**, and tracking everything in **Redis**. It includes:

► A **Middleware** server (entry point).  
► Multiple **Microservices** (`creative-analysis`, `data-processor`, etc.).  
► A **Frontend** HTML client to test everything visually.  
► A **Redis** database (using **Upstash Redis**).

---

##  Features

-  Auth token validation (in Redis)
-  **Rate-limiting**: only 5 **active** requests at a time (per global system, not per user).
-  **Admin DB**: Tracks each service’s total requests and last used time.
-  Easy to extend with more microservices.

---

##  Prerequisites

- **Node.js** (v18 or above recommended)
- **npm** (Node package manager)
- **Redis** (we’re using Upstash Redis Cloud)

---

## 📂 Directory Structure
```
nodejs-redis-service/
├── middleware/ # The main gateway (middleware)
│ ├── index.js
│ ├── package.json
│ └── public/ # Frontend (HTML client)
│    └── index.html
├── services/
│ ├── creative-analysis/ # Microservice 1
│ │ ├── index.js
│ │ ├── package.json
│ │ └── ...
│ └── data-processor/ # Microservice 2
│ ├── index.js
│ ├── package.json
│ └── ...
├── .env # Environment variables
└── README.md
```

---

## ⚙️ **Setting up the project**

### 1️⃣ Clone the repository

```bash
git clone https://github.com/yourusername/nodejs-redis-service.git
cd nodejs-redis-service
```
### 2️⃣ Create environment file (.env)
Create a .env file in the root and add your Upstash Redis URL:
```bash
REDIS_URL=rediss://default:<your-redis-password>@handy-boa-40973.upstash.io:6379
Replace <your-redis-password> with your real Upstash Redis password.
```

### 3️⃣ Install dependencies

Install everything for each service:

For the middleware:
```bash
cd middleware
npm install
```
For the creative-analysis microservice:
```bash
cd ../services/creative-analysis
npm install
```
For the data-processor microservice:
```bash
cd ../data-processor
npm install
```
### 4️⃣ Setup Redis (via CLI)
Connect to your Upstash Redis (via redis-cli or web interface):

```bash
redis-cli --tls -u rediss://default:<your-redis-password>@handy-boa-40973.upstash.io:6379
```
Then, run these commands:

```redis
# Set an auth token
SET token:abc123 1

# Allow this token to access creative-analysis and data-processor
SADD token:abc123:services creative-analysis
SADD token:abc123:services data-processor

# Initialize admin tracking keys
SET admin:service:creative-analysis:totalRequests 0
SET admin:service:creative-analysis:lastUsed 0
SET admin:service:data-processor:totalRequests 0
SET admin:service:data-processor:lastUsed 0

# Initialize active request counter
SET activeRequests 0
```

### 5️⃣ Start each microservice
Creative Analysis:
```bash
cd services/creative-analysis
node index.js
```
Data Processor:
```bash
cd ../data-processor
node index.js
```
### 6️⃣ Start the middleware
```bash
cd ../../middleware
node index.js
```
### 7️⃣ Launch the Frontend
Open the public/index.html file directly in your browser.
Or, use a simple VS Code live server plugin to preview it.

🖥️ Using the Frontend UI

1️⃣ Enter your Auth Token (abc123).

2️⃣ Choose the Service (e.g., creative-analysis).

3️⃣ Enter your Payload (e.g., { "query": "Hello World" }).

4️⃣ Click Send Request.

5️⃣ Check status or admin info using the Check Admin Status button.

💡 How it works

► The middleware:

- Authenticates your token (abc123) with Redis.

- Verifies if you can access the requested service.

- Checks if active requests < 5.

- Increments active requests counter (activeRequests).

- Forwards your request to the selected microservice (e.g., creative-analysis).

- Decrements active requests when done.

- Updates admin:service:* data in Redis.

► Each microservice:

- Simulates a processing delay (e.g., 7 seconds).

- Returns a dummy response with timestamp.

► The Admin DB in Redis:

- Tracks how many total requests each service handled (totalRequests).

- Stores the last time it was used (lastUsed).

► Tips for Testing & Debugging
Check active requests in real-time:
```bash
redis-cli --tls -u rediss://default:<your-redis-password>@handy-boa-40973.upstash.io:6379
GET activeRequests
```
If active requests = 5, new requests will show:
```
{ "error": "Rate limit exceeded. Please wait..." }
```