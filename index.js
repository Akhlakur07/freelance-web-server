require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.oijxnxr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    const userCollection = client.db("freeDB").collection("users");

    app.post("/users", async (req, res) => {
      try {
        if (!userCollection) {
          return res.status(503).json({ error: "Database not ready" });
        }

        const {
          name = "",
          email,
          photo = "",
          bio = "",
          authProvider = "password",
        } = req.body || {};
        if (!email) return res.status(400).json({ error: "Email is required" });

        const now = new Date();

        const result = await userCollection.updateOne(
          { email },
          {
            $set: { name, photo, bio, authProvider, updatedAt: now },
            $setOnInsert: { createdAt: now },
          },
          { upsert: true }
        );

        const created = Boolean(result.upsertedCount);
        res.status(created ? 201 : 200).json({ ok: true, created, email });
      } catch (err) {
        // Duplicate key safety net (if createIndex hasn't finished yet)
        if (err.code === 11000) {
          return res
            .status(409)
            .json({ error: "User with this email already exists" });
        }
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (error) {
    console.error("Mongo error:", error);
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
