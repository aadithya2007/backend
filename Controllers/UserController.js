const User = require("../Models/UserModel");
const { signToken } = require("../Utils/auth");

function buildAuthResponse(user) {
  return {
    user: user.toJSON(),
    token: signToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    }),
  };
}

function normalizeEmail(email = "") {
  return email.trim().toLowerCase();
}

function splitName(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

function buildUserNames({ firstName, lastName, name }) {
  const namesFromFullName = splitName(name);
  const nextFirstName = (firstName || namesFromFullName.firstName || "").trim();
  const nextLastName = (lastName || namesFromFullName.lastName || "").trim();

  return {
    firstName: nextFirstName,
    lastName: nextLastName,
    name: [nextFirstName, nextLastName].filter(Boolean).join(" "),
  };
}

async function registerUser(req, res) {
  try {
    const { firstName, lastName, email, password } = req.body;
    const userNames = buildUserNames({ firstName, lastName });
    const normalizedEmail = normalizeEmail(email);

    if (!userNames.firstName || !userNames.lastName || !normalizedEmail || !password) {
      return res.status(400).json({ message: "First name, last name, email, and password are required." });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const user = new User({ ...userNames, email: normalizedEmail });
    user.setPassword(password);

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      user.role = "admin";
    }

    await user.save();
    res.status(201).json(buildAuthResponse(user));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email already registered." });
    }

    if (error.name === "ValidationError" || error.message.startsWith("Password must contain")) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Could not register user.", error: error.message });
  }
}

async function loginUser(req, res) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");

    if (!user || !user.isValidPassword(password)) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    res.json(buildAuthResponse(user));
  } catch (error) {
    res.status(500).json({ message: "Could not login.", error: error.message });
  }
}

async function getUsers(_req, res) {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch users.", error: error.message });
  }
}

async function createUser(req, res) {
  try {
    const { firstName, lastName, name, email, password, role } = req.body;
    const userNames = buildUserNames({ firstName, lastName, name });
    const normalizedEmail = normalizeEmail(email);

    if (!userNames.name || !normalizedEmail || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    const user = new User({ ...userNames, email: normalizedEmail, role: role || "user" });
    user.setPassword(password);
    await user.save();

    res.status(201).json(user);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email already registered." });
    }

    if (error.name === "ValidationError" || error.message.startsWith("Password must contain")) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Could not create user.", error: error.message });
  }
}

async function updateUser(req, res) {
  try {
    const { firstName, lastName, name, email, password, role } = req.body;
    const user = await User.findById(req.params.id).select("+passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const userNames = buildUserNames({
      firstName: firstName ?? user.firstName,
      lastName: lastName ?? user.lastName,
      name: name ?? user.name,
    });

    user.firstName = userNames.firstName || user.firstName;
    user.lastName = userNames.lastName || user.lastName;
    user.name = userNames.name || user.name;
    user.email = email ? normalizeEmail(email) : user.email;
    user.role = role ?? user.role;

    if (password) {
      user.setPassword(password);
    }

    await user.save();
    res.json(user);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email already registered." });
    }

    if (error.name === "ValidationError" || error.message.startsWith("Password must contain")) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Could not update user.", error: error.message });
  }
}

async function deleteUser(req, res) {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ message: "User deleted." });
  } catch (error) {
    res.status(500).json({ message: "Could not delete user.", error: error.message });
  }
}

module.exports = {
  registerUser,
  loginUser,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};
