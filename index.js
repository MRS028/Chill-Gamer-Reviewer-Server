const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.q3w3t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const reviewCollection = client.db("ReviewDB").collection("newReview");

    const watchlistCollection = client.db("ReviewDB").collection("watchlist");

    app.get("/allReviews", async (req, res) => {
      const cursor = reviewCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/allReviews", async (req, res) => {
      const newReview = req.body;
      console.log(newReview);
      const result = await reviewCollection.insertOne(newReview);
      res.send(result);
    });

    app.put("/allReviews/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedReview = req.body;
      const reviewUpdated = {
        $set: {
          gameCover: updatedReview.gameCover,
          gameTitle: updatedReview.gameTitle,
          publishingYear: updatedReview.publishingYear,
          reviewDescription: updatedReview.reviewDescription,
          rating: updatedReview.rating,
          genre: updatedReview.genre,
        },
      };
      const result = await reviewCollection.updateOne(filter, reviewUpdated);

      res.send(result);
    });
    // Get top-rated games
    app.get("/highestRatedGames", async (req, res) => {
        try {
          const topGames = await reviewCollection
            .find({})
            .sort({ rating: -1 }) 
            .limit(6) 
            .toArray();
          const sanitizedGames = topGames.map((game) => ({
            ...game,
            rating: Number(game.rating) || 0,
          }));
      
          res.send(sanitizedGames);
        } catch (error) {
          console.error("Error fetching highest-rated games:", error);
          res.status(500).send({ message: "Server error" });
        }
      });
      

    //  watchlist
    app.post("/watchlist", async (req, res) => {
      try {
        const newWatchList = req.body;
        console.log(newWatchList);

        const existingGame = await watchlistCollection.findOne({
          gameTitle: newWatchList.gameTitle,
          userEmail: newWatchList.userEmail,
        });
        if (existingGame) {
          return res
            .status(400)
            .send({ message: "This game is already in your watchlist." });
        }

        const result = await watchlistCollection.insertOne(newWatchList);
        res.status(201).send(result);
      } catch (error) {
        console.error("Error adding to watchlist:", error);
        res.status(500).send({ message: "Server error occurred." });
      }
    });

    app.get("/allReviews/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };

      const result = await reviewCollection.findOne(query);
      res.send(result);
    });

    // Delete Operation for reviews

    app.delete("/allReviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await reviewCollection.deleteOne(query);

      res.send(result);
    });
    //watchlist data add
    app.get("/watchlist", async (req, res) => {
      const cursor = watchlistCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    //watchlist data deleted
    app.delete("/watchlist/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await watchlistCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Chill Gamer Server is running...");
});

app.listen(port, () => {
  console.log(`Chill gamer server is running on port ${port}`);
});
