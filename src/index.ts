import express, { Application } from "express";
import pino from "pino-http";
import session from "express-session";

declare module "express-session" {
  interface SessionData {
    ssn: string;
  }
}

const app: Application = express();
const port = process.env.PORT || 3000;

app.use(pino());
app.use(
  session({
    secret: "keyboard cat",
    name: "fakeauth",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

app.set("view engine", "ejs");

const parseSSN = (s: string) => {
  return s;
};

app.get("/_/login", async (req, res) => {
  res.render("login", { redirectURL: req.query.url ?? "" });
});

app.post("/_/login", async (req, res) => {
  if (req.body.ssn) {
    req.session.ssn = parseSSN(req.body.ssn);
    await req.session.save();
    req.log.info("User signed in.");

    return res.redirect(302, req.body.url ?? "/");
  }

  res.status(400).end();
});

app.get("/_/logout", async (req, res) => {
  req.session.ssn = null;
  await req.session.save();

  res.render("logout");
});

app.get(/\/(.*)/, (req, res) => {
  if (!req.session.ssn) {
    return res.redirect(302, `/_/login/?url=${req.path}`);
  }

  req.log.info({ session: req.session });

  res.header("X-Remote-User", req.session.ssn);
  res.status(200);
  res.end();
});

app.listen(port, () => {
  console.log(`Server is running at port ${port}.`);
});
