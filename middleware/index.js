import express from "express";
import Redis from "ioredis";
import axios from "axios";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

const redis = new Redis("rediss://default:AaANAAIjcDFmNjVlNzlkMDBmOWI0YWVjYTY3MGZhNjc5ZTRkYzk5N3AxMA@handy-boa-40973.upstash.io:6379");

// Helper to simulate 3s delay in microservices
const simulateServiceDelay = async () => {
  return new Promise((resolve) => setTimeout(resolve, 3000));
};

app.post("/request", async (req, res) => {
  const { authToken, service, payload } = req.body;

  if (!authToken || !service || !payload) {
    return res.status(400).json({ error: "Missing authToken, service, or payload" });
  }

  // 1️⃣ Check active requests globally
  const activeRequests = parseInt(await redis.get("admin:activeRequests")) || 0;

  if (activeRequests >= 5) {
    // Calculate estimated wait time (assume 3s for each active request)
    const estimatedWait = 3000; // 3s per request (as each service has a 3s delay)
    return res.status(429).json({
      error: "Rate limit reached. Please wait before retrying.",
      waitTime: estimatedWait / 1000 + " seconds",
    });
  }

  // 2️⃣ Increment active request count
  await redis.incr("admin:activeRequests");

  try {
    // 3️⃣ Forward to service
    const serviceUrl = `http://localhost:4000/`; // assuming creative-analysis for testing

    // simulate delay in service itself
    const response = await axios.post(serviceUrl, { payload });

    // 4️⃣ Update admin DB (service stats)
    const serviceKey = `admin:service:${service}`;
    await redis.hset(serviceKey, "lastUsed", new Date().toISOString());
    await redis.hincrby(serviceKey, "totalRequests", 1);

    res.json({
      message: "Request completed!",
      data: {
        service,
        payload,
        doneAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Service error:", error);
    res.status(500).json({ error: "Service error" });
  } finally {
    // 5️⃣ Decrement active request count
    await redis.decr("admin:activeRequests");
  }
});

app.get("/admin-status", async (req, res) => {
  const activeRequests = parseInt(await redis.get("admin:activeRequests")) || 0;

  // Get stats for all services
  const keys = await redis.keys("admin:service:*");
  const services = {};
  for (const key of keys) {
    const data = await redis.hgetall(key);
    services[key] = data;
  }

  res.json({
    activeRequests,
    services,
  });
});

app.listen(3000, () => {
  console.log("🚀 Middleware running at http://localhost:3000");
});
