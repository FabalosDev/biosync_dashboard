// server.js
import express from "express";
const app = express();
app.use(express.json());

app.post("/webhook", (req, res) => {
  // handle payload
  res.json({ ok: true });
});

app.listen(3001, () => console.log("API on :3001"));
