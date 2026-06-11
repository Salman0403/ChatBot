import express from "express";

const app = express();
const port = 3001;
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World");
});
app.post("/chat", (req, res) => {
  const { message } = req.body;

  console.log("Message", message);

  res.json({ message: "OK" });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
