// server/server.js  (ESM version)
import express from "express";
import cors from "cors";

// (optional) light validation helper
function requireFields(obj, fields) {
  const missing = fields.filter(
    (f) => obj[f] === undefined || obj[f] === null || obj[f] === ""
  );
  if (missing.length) {
    const err = new Error(`Missing required: ${missing.join(", ")}`);
    err.status = 400;
    throw err;
  }
}

const app = express();
app.use(cors());
app.use(express.json());

app.post("/webhook", async (req, res) => {
  try {
    const body = req.body || {};
    const { action, contentType, sheet, row, title, caption, link, snippet } =
      body;

    // basic validation that prevents silent 500s
    requireFields(body, ["action", "contentType", "sheet", "row"]);

    // Normalize contentType you expect server-side
    const ct = String(contentType).toLowerCase(); // "content" | "news" | "dentistry" | "rss"
    const act = String(action).toLowerCase(); // "approve" | "reject"

    console.log("[/webhook] ✅ received", { action: act, ct, sheet, row });

    // TODO: wire your real integrations here (Google Sheets, DB, etc.)
    // Example switch:
    if (act === "approve") {
      // await updateRow(sheet, row, { status: "Approved", approvedAt: new Date().toISOString() });
      // await maybeQueueProduction(ct, { title, caption, link, snippet });
      console.log("→ APPROVE flow for", sheet, "row", row);
    } else if (act === "reject") {
      // await updateRow(sheet, row, { status: "Rejected", rejectedAt: new Date().toISOString() });
      // optional: store feedback/ideas for regeneration
      console.log("→ REJECT flow for", sheet, "row", row);
    } else {
      return res.status(400).json({ ok: false, error: "Unknown action" });
    }

    // Return an explicit success
    res.json({
      ok: true,
      action: act,
      contentType: ct,
      sheet,
      row,
    });
  } catch (err) {
    const status = err?.status || 500;
    console.error("[/webhook] ❌ error:", err?.message || err);
    res.status(status).send(err?.message || "Server error");
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
