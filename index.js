require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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
    const tasksCollection = client.db("freeDB").collection("tasks");

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

    // Get a user by email
    app.get("/users/:email", async (req, res) => {
      try {
        if (!userCollection)
          return res.status(503).json({ error: "Database not ready" });

        const rawEmail = req.params.email;
        if (!rawEmail) return res.status(400).json({ error: "Email required" });

        // Try exact, then lowercase (helps if older records used different casing)
        let doc = await userCollection.findOne({ email: rawEmail });
        if (!doc)
          doc = await userCollection.findOne({ email: rawEmail.toLowerCase() });

        if (!doc) return res.status(404).json({ error: "User not found" });

        const { name, email, photo, bio, authProvider, createdAt, updatedAt } =
          doc;
        return res.json({
          name,
          email,
          photo,
          bio,
          authProvider,
          createdAt,
          updatedAt,
        });
      } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Create a task
    app.post("/tasks", async (req, res) => {
      try {
        if (!tasksCollection)
          return res.status(503).json({ error: "Database not ready" });

        const {
          title,
          category,
          description,
          deadline, // yyyy-mm-dd (string)
          budget,
          userEmail,
          userName,
        } = req.body || {};

        // Basic validation
        if (!title || !String(title).trim())
          return res.status(400).json({ error: "Title is required" });
        if (!category)
          return res.status(400).json({ error: "Category is required" });
        if (!description || !String(description).trim())
          return res.status(400).json({ error: "Description is required" });
        if (!deadline)
          return res.status(400).json({ error: "Deadline is required" });
        if (budget === undefined || budget === null || isNaN(Number(budget)))
          return res.status(400).json({ error: "Budget must be a number" });
        if (!userEmail)
          return res.status(400).json({ error: "User email is required" });

        const deadlineDate = new Date(deadline);
        if (isNaN(deadlineDate.getTime()))
          return res
            .status(400)
            .json({ error: "Deadline must be a valid date" });

        const now = new Date();
        const doc = {
          title: String(title).trim(),
          category,
          description: String(description).trim(),
          deadline: deadlineDate,
          budget: Number(budget),
          author: {
            email: String(userEmail).toLowerCase(),
            name: userName || "",
          },
          status: "open", // initial status
          createdAt: now,
          updatedAt: now,
        };

        const result = await tasksCollection.insertOne(doc);
        res.status(201).json({ ok: true, id: result.insertedId });
      } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // List tasks (optional filters: email, category)
    app.get("/tasks", async (req, res) => {
      try {
        const q = {};
        if (req.query.email)
          q["author.email"] = String(req.query.email).toLowerCase();
        if (req.query.category) q.category = req.query.category;

        const docs = await tasksCollection
          .find(q)
          .sort({ createdAt: -1 })
          .limit(100)
          .toArray();

        // 👇 normalize _id and dates for the frontend
        const tasks = docs.map(({ _id, deadline, ...rest }) => ({
          _id: _id.toString(),
          deadline, // keep as Date if you want; or String(deadline)
          ...rest,
        }));

        res.json(tasks);
      } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // Get single task
    app.get("/tasks/:id", async (req, res) => {
      try {
        const id = req.params.id;
        let doc;
        try {
          doc = await tasksCollection.findOne({ _id: new ObjectId(id) });
        } catch {
          return res.status(400).json({ error: "Invalid task id" });
        }
        if (!doc) return res.status(404).json({ error: "Task not found" });
        res.json(doc);
      } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.delete("/tasks/:id", async (req, res) => {
      try {
        if (!tasksCollection)
          return res.status(503).json({ error: "Database not ready" });

        const id = req.params.id;
        const email = String(req.query.email || "").toLowerCase();
        if (!email) return res.status(400).json({ error: "Email is required" });

        let _id;
        try {
          _id = new ObjectId(id);
        } catch {
          return res.status(400).json({ error: "Invalid task id" });
        }

        const task = await tasksCollection.findOne({ _id });
        if (!task) return res.status(404).json({ error: "Task not found" });

        if ((task.author?.email || "") !== email) {
          return res
            .status(403)
            .json({ error: "Not allowed to delete this task" });
        }

        const { deletedCount } = await tasksCollection.deleteOne({ _id });
        if (!deletedCount)
          return res.status(500).json({ error: "Failed to delete task" });

        return res.json({ ok: true, id });
      } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.patch("/tasks/:id", async (req, res) => {
      try {
        if (!tasksCollection)
          return res.status(503).json({ error: "Database not ready" });

        const email = String(req.query.email || "").toLowerCase();
        if (!email) return res.status(400).json({ error: "Email is required" });

        let _id;
        try {
          _id = new ObjectId(req.params.id);
        } catch {
          return res.status(400).json({ error: "Invalid task id" });
        }

        const existing = await tasksCollection.findOne({ _id });
        if (!existing) return res.status(404).json({ error: "Task not found" });

        if ((existing.author?.email || "") !== email) {
          return res
            .status(403)
            .json({ error: "Not allowed to update this task" });
        }

        const { title, category, description, deadline, budget } =
          req.body || {};

        // Basic validation (mirror of POST /tasks)
        if (!title || !String(title).trim())
          return res.status(400).json({ error: "Title is required" });
        if (!category)
          return res.status(400).json({ error: "Category is required" });
        if (!description || !String(description).trim())
          return res.status(400).json({ error: "Description is required" });
        if (!deadline)
          return res.status(400).json({ error: "Deadline is required" });
        if (budget === undefined || budget === null || isNaN(Number(budget)))
          return res.status(400).json({ error: "Budget must be a number" });

        const deadlineDate = new Date(deadline);
        if (isNaN(deadlineDate.getTime()))
          return res
            .status(400)
            .json({ error: "Deadline must be a valid date" });

        const updateDoc = {
          $set: {
            title: String(title).trim(),
            category,
            description: String(description).trim(),
            deadline: deadlineDate,
            budget: Number(budget),
            updatedAt: new Date(),
          },
        };

        const r = await tasksCollection.updateOne({ _id }, updateDoc);
        if (!r.matchedCount)
          return res.status(404).json({ error: "Task not found" });

        return res.json({ ok: true, id: _id.toString() });
      } catch (e) {
        console.error(e);
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
