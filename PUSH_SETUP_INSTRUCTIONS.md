# Manual Installation Steps

Due to PowerShell execution policy restrictions, please run the following command manually:

## Step 1: Install web-push dependency

Open a new terminal (Command Prompt or PowerShell as Administrator) and run:

```bash
cd c:\Users\eduardo.corzo\Documents\Repos\TPVapp\temp-app
npm install web-push --save
```

## Step 2: Generate VAPID keys

After installing web-push, generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```

This will output something like:

```
=======================================

Public Key:
BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBrYTTuN5k0xBQ6Bm0P8

Private Key:
p6YVD2L4SDiJDcK3qBhGwGVyQJhIMpKL8h4dGWZQ5RU

=======================================
```

## Step 3: Add to environment variables

Create or update `.env.local` file in the `temp-app` directory:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<your_public_key_here>
VAPID_PRIVATE_KEY=<your_private_key_here>
VAPID_SUBJECT=mailto:your-email@example.com
```

Replace the values with:

- Your generated public key
- Your generated private key
- Your email address

## Step 4: Restart dev server

```bash
npm run dev
```

---

## Alternative: If npm still doesn't work

1. Open PowerShell as Administrator
2. Run: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`
3. Confirm with 'Y'
4. Try running the npm commands again

---

## Why this is needed

- **web-push**: Library to send push notifications using Web Push Protocol
- **VAPID keys**: Voluntary Application Server Identification - authenticates your server to push services
