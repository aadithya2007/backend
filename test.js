require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./Models/UserModel");
const { signToken } = require("./Utils/auth");

async function runSmokeTest() {
  if (!process.env.MONGO_URL) {
    throw new Error("MONGO_URL environment variable is required.");
  }

  const token = signToken({
    id: "smoke-test-user",
    email: "smoke@example.com",
    role: "user",
  });

  if (token.split(".").length !== 3) {
    throw new Error("JWT was not generated in header.payload.signature format.");
  }

  const user = new User({
    firstName: "Smoke",
    lastName: "Test",
    email: "smoke@example.com",
  });

  user.setPassword("Password@123");

  if (!user.isValidPassword("Password@123")) {
    throw new Error("Valid password was rejected.");
  }

  if (user.isValidPassword("Wrong@123")) {
    throw new Error("Invalid password was accepted.");
  }

  await mongoose.connect(process.env.MONGO_URL);
  console.log("Backend smoke test passed.");
}

runSmokeTest()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
