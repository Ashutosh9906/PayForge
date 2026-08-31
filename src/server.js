import express from "express";
import db from "./db.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "Payment Infrastructure Platform"
    });
});

app.get("/accounts", (req, res) => {
    db.query("SELECT * FROM accounts", (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                error: "Database query failed"
            });
        }

        res.json(results);
    });
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});