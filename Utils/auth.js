const crypto = require("crypto");

const TOKEN_SECRET = process.env.JWT_SECRET;

if (!TOKEN_SECRET) {
  throw new Error("JWT_SECRET environment variable is required.");
}

const TOKEN_EXPIRES_IN_SECONDS = 7 * 24 * 60 * 60;

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function createSignature(data) {
  return crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(data)
    .digest("base64url");
}

function signToken(payload) {
  const now = Math.floor(Date.now() / 1000);

  const header = base64UrlEncode({
    alg: "HS256",
    typ: "JWT",
  });

  const body = base64UrlEncode({
    ...payload,
    iat: now,
    exp: now + TOKEN_EXPIRES_IN_SECONDS,
  });

  const data = `${header}.${body}`;
  const signature = createSignature(data);

  return `${data}.${signature}`;
}

function verifyToken(token) {
  if (!token || token.split(".").length !== 3) {
    return null;
  }

  const [header, body, signature] = token.split(".");

  const expectedSignature = createSignature(
    `${header}.${body}`
  );

  if (
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    );

    if (
      payload.exp &&
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : "";

  const user = verifyToken(token);

  if (!user) {
    return res.status(401).json({
      message: "Please login first.",
    });
  }

  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Admin access required.",
      });
    }

    next();
  });
}

module.exports = {
  signToken,
  requireAuth,
  requireAdmin,
};