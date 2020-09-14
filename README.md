# DJBX

## QUICK START
Install node modules
```bash
npm install
```
Prepare the configuration file
```bash
cp .env.example .env
```
Edit the following
```bash
HOST=http://www.example.com
PORT=3000
CLIENT_ID=<your spotify client ID>
CLIENT_SECRET=<your spotify client secret>
```
Get your Spotify's **CLIENT_ID** and **CLIENT SECRET** by registering this app on https://developer.spotify.com/dashboard/
> Don't forget to set the **Redirect URL** to **_HOST:PORT/auth/callback_**

now, spin up the server. 
```bash
npm run dev
```
