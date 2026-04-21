# How to Disable Email Confirmation in Supabase

## Option 1: Via Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard
2. Select your project: **loroqofccuuaitfpqerz**
3. Go to **Authentication** → **Providers** → **Email**
4. Toggle OFF **"Confirm email"**
5. Click **Save**

## Option 2: Allow immediate access without confirmation

If you want to keep email confirmation enabled but allow users to access the app immediately:

The current code already handles this - users can access the dashboard after signup even before confirming email, as long as the session is created.

## Testing After Setup

1. Sign up with a test account
2. You should be immediately redirected to `/dashboard`
3. Your subscription should show as "active"
4. You can enter scores and participate in draws
