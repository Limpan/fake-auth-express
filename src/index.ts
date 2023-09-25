import express, { Application } from "express";
import pino from "pino-http";
import session from "express-session";
import { csrfSync } from 'csrf-sync';

declare module "express-session" {
  interface SessionData {
    ssn: string;
  }
}

const app: Application = express();
const port = process.env.PORT || 8000;

app.use(pino());
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: "keyboard cat",
    name: "fakeauth",
    resave: false,
    saveUninitialized: false,
  })
);

app.set("view engine", "ejs");

const parseSSN = (s: string) => {
  if (/(19|20)?\d{6}-?\d{4}/.test(s)) {
    return s.replace('-', '').slice(-10);
  }

  throw new Error('Failed to parse SSN.')
};

const { csrfSynchronisedProtection, generateToken } = csrfSync({
  getTokenFromRequest: (req) => {
    return req.body._csrf;
  }, // Used to retrieve the token submitted by the user in a form
});

app.get("/_/login", async (req, res) => {
  const csrfToken = generateToken(req);
  const redirectURL = req.query.url;
  const error = req.query.error;

  res.render("login", { csrfToken, redirectURL, error });
});

app.post("/_/login", csrfSynchronisedProtection, async (req, res) => {
  if (req.body.ssn) {
    try {
      req.session.ssn = parseSSN(req.body.ssn);
      await req.session.save();
    } catch {
      return res.redirect(302, `/_/login?url=${req.body.url}&error=invalid`)
    }

    const url = req.body.url && req.body.url !== '' ? req.body.url : '/';
    return res.redirect(302, url);
  }

  res.status(400).end();
});

app.get("/_/logout", async (req, res) => {
  req.session.ssn = null;
  await req.session.save();

  res.redirect('/');
});

app.get('/_/verify', (req, res) => {
  if (!req.session.ssn) {
    return res.redirect(302, `/_/login/?url=${req.headers['x-forwarded-uri']}`);
  }

  req.log.info({ session: req.session });

  res.header("X-Remote-User", req.session.ssn);
  res.status(200);
  res.end();
});

app.listen(port, () => {
  console.log(`Server is running at port ${port}.`);
});
