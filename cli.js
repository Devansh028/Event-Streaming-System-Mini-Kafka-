// Usage: node cli.js orders ORDER_CREATED

const fetch = require("node-fetch");

const [,, topic, type] = process.argv;

const payload = { message: "CLI event" };

fetch("http://localhost:5000/api/publish", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ topic, type, payload })
})
.then(res => res.json())
.then(console.log)
.catch(console.error);
