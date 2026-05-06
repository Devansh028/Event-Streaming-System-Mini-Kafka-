const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  // TEMP TEST USER
  if (email === "test@example.com" && password === "123456") {
    const token = jwt.sign(
      { email, role: "admin" },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1h" }
    );

    return res.json({ token });
  }

  return res.status(401).json({ message: "Invalid credentials" });
};