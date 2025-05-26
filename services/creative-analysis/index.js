import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

app.post("/", async (req, res) => {
  console.log("🎨 Creative-Analysis received:", req.body);

  // simulate 3s delay
  await new Promise((resolve) => setTimeout(resolve, 3000));

  res.json({
    message: "Creative analysis done.",
    received: req.body,
    doneAt: new Date().toISOString(),
  });
});

app.listen(4000, () => console.log("🎨 Creative-analysis on port 4000"));
