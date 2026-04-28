const crypto = require("crypto");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
      required: true,
    },
    lastName: {
      type: String,
      trim: true,
      required: true,
    },
    name: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);

userSchema.pre("validate", function () {
  this.name = [this.firstName, this.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
});

function hashPassword(
  password,
  salt = crypto.randomBytes(16).toString("hex")
) {
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");

  return `${salt}:${hash}`;
}

userSchema.methods.setPassword = function (password) {
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

  if (!passwordRegex.test(password)) {
    throw new Error(
      "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character."
    );
  }

  this.passwordHash = hashPassword(password);
};

userSchema.methods.isValidPassword = function (password) {
  if (!this.passwordHash || !this.passwordHash.includes(":")) {
    return false;
  }

  const [salt, storedHash] = this.passwordHash.split(":");

  const incomingHash = hashPassword(password, salt).split(":")[1];

  if (storedHash.length !== incomingHash.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(storedHash),
    Buffer.from(incomingHash)
  );
};

userSchema.set("toJSON", {
  transform(_doc, ret) {
    ret.id = ret._id.toString();

    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;

    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
