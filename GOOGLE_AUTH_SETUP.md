# Google OAuth Setup Guide

## Overview
This expense tracker app now includes a login page with Google OAuth authentication. Follow the steps below to set it up.

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click on the project dropdown at the top
3. Click "NEW PROJECT"
4. Enter a project name (e.g., "Expense Tracker")
5. Click "CREATE"
6. Wait for the project to be created

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it and press "ENABLE"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "CREATE CREDENTIALS" > "OAuth client ID"
3. If prompted to create a consent screen first:
   - Click "CONFIGURE CONSENT SCREEN"
   - Select "External" user type
   - Click "CREATE"
   - Fill in the required fields:
     - App name: "Expense Tracker"
     - User support email: Your email
     - Developer contact: Your email
   - Click "SAVE AND CONTINUE"
   - Click "SAVE AND CONTINUE" on the next screens
4. Go back to Credentials and click "CREATE CREDENTIALS" > "OAuth client ID"
5. Select "Web application"
6. Add Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google/` (with trailing slash)
7. If deploying, also add:
   - `https://yourdomain.com/api/auth/callback/google`
8. Click "CREATE"
9. Copy the Client ID and Client Secret

## Step 4: Update Environment Variables

1. Open `.env.local` in the project root
2. Replace the values:
   ```
   GOOGLE_CLIENT_ID=your_client_id_from_step3
   GOOGLE_CLIENT_SECRET=your_client_secret_from_step3
   NEXTAUTH_SECRET=generate_a_secret_below
   ```

3. Generate a NEXTAUTH_SECRET by running in terminal:
   ```bash
   openssl rand -base64 32
   ```
   Copy the output and paste it as the NEXTAUTH_SECRET value

## Step 5: Restart the Development Server

1. Stop the current dev server (Ctrl+C)
2. Run:
   ```bash
   npm run dev
   ```
3. Open http://localhost:3000 in your browser

## Step 6: Test the Login

1. You should be redirected to the login page
2. Click "Sign in with Google"
3. Follow the Google sign-in flow
4. After signing in, you'll be redirected to the expense tracker dashboard

## Features

✅ Google OAuth login
✅ Automatic redirect to login if not authenticated
✅ User profile display in header
✅ Sign out functionality
✅ Protected routes with middleware
✅ Persistent session

## Troubleshooting

### "Redirect URI mismatch" error
- Make sure you've added the exact redirect URI in Google OAuth settings
- For local development: `http://localhost:3000/api/auth/callback/google`

### Page keeps redirecting to login
- Make sure `.env.local` has all three values filled in
- Restart the dev server after updating `.env.local`

### "NEXTAUTH_SECRET not provided"
- Generate a secret using the command in Step 4
- Add it to `.env.local`

## For Production Deployment

1. Update `NEXTAUTH_URL` in `.env.local` to your production domain
2. Add the production redirect URI to Google OAuth settings:
   `https://yourdomain.com/api/auth/callback/google`
3. Use a strong, randomly generated NEXTAUTH_SECRET
4. Deploy with these environment variables set in your hosting platform

## File Structure

New files added:
- `src/app/login/page.tsx` - Login page with Google sign-in button
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth.js configuration
- `src/app/providers.tsx` - Session provider wrapper
- `src/middleware.ts` - Route protection middleware
- `src/components/UserMenu.tsx` - User profile and sign-out menu
- `.env.local` - Environment variables (update with your credentials)
