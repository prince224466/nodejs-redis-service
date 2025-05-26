import express from "express";
import Redis from "ioredis";
import bodyParser from "body-parser";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Redis("rediss://default:AaANAAIjcDFmNjVlNzlkMDBmOWI0YWVjYTY3MGZhNjc5ZTRkYzk5N3AxMA@handy-boa-40973.upstash.io:6379");

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // serve static frontend

const generateAuthToken = () => crypto.randomBytes(16).toString("hex");

app.post("/register", async (req, res) => {
  const { serviceName, serviceUrl, maxRequests } = req.body;

  if (!serviceName || !serviceUrl || !maxRequests) {
    return res.status(400).json({ message: "Missing fields." });
  }

  const authToken = generateAuthToken();
  const key = `service:${serviceName}`;

  await client.hmset(key, { // hmset- set multiple hash fields to multiple values
    authToken,
    serviceUrl,
    maxRequests,
    reqLeft: maxRequests,
    lastReq: 0
  });

  res.json({ serviceName, authToken });
});

const authenticate = async (req, res, next) => {
  const { serviceName } = req.body;
  const authHeader = req.headers["authorization"];
  if (!serviceName || !authHeader) {
    return res.status(401).json({ message: "Missing serviceName or auth token." });
  }
  const key = `service:${serviceName}`;
  const storedToken = await client.hget(key, "authToken");
  if (authHeader !== storedToken) {
    return res.status(403).json({ message: "Invalid token." });
  }
  req.redisKey = key;
  next();
};

app.post("/status", authenticate, async (req, res) => {
  const data = await client.hgetall(req.redisKey); // hgetall - get all the fields and values in a hash
  if (!data || !data.authToken) {
    return res.status(404).json({ message: "Service not found." });
  }
  res.json(data);
});

app.post("/use", authenticate, async (req, res) => {
  const reqLeft = await client.hget(req.redisKey, "reqLeft");
  if (parseInt(reqLeft) <= 0) {
    return res.status(429).json({ message: "Max requests reached." });
  }
  await client.hincrby(req.redisKey, "reqLeft", -1);

  const now = new Date().toISOString();
  await client.hset(req.redisKey, "lastReq", now);

  const data = await client.hgetall(req.redisKey);
  res.json({ message: "Request processed!", data });
});


app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
