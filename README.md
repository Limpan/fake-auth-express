# Fake Authenticator

This is a small application for use in development. It is intended to be used
as a replacement to a proper authenticated proxy during development.

The fake authenticator has two endpoints `/_/login` and `/_/verify`. The
reverse proxy that wants to use the fake authenticator calls the `/_/verify`
endpoint. If the user is authenticated it responds with http status 200, or
else responds with a redirect (302) to `/_/login` which will initiate the sign
in procedure.

## Usage

Build the container:

```shell
podman build -t fakeauth:latest .
```

Once built, the container image can be started with:

```shell
podman run -p 8000:8000 fakeauth:latest
```

## Caddy

To run caddy locally with the provided example configuration run `caddy run`.
This will run the caddy server on port 4000 and proxy the service on port
3000 while authenticating with the service on port 8000.
