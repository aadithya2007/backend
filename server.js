const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: [
      "https://vegimart12.netlify.app",
      "http://localhost:3001",
    ],
    credentials: true,
  })
);


const userRoutes = require("./Routers/UserRoutes");
const productRoutes = require("./Routers/ProductRoutes");
const categoryRoutes = require("./Routers/CategoryRoutes");

app.get("/", (_req, res) => {
  res.json({ message: "VegiMart API is running." });
});

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`server is running on port number ${port}`);
});

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
