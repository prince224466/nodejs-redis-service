import express from "express";
const app = express();
app.use(express.json());

app.post("/process", async (req, res) => {
  await new Promise(r => setTimeout(r, 3000)); // simulate delay
  res.json({ service: "insights-generator", payload: req.body.payload, doneAt: new Date() });
});
app.listen(4002, () => console.log("🔎 Insights-generator on 4002"));
