# Vercel Frontend Deployment Guide

## Step 1: Push Your Code to GitHub

```bash
cd /home/anay/Desktop/Projects/Protego
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## Step 2: Deploy to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "Add New Project"
4. Import your `Protego` repository
5. Configure the project:

### Framework Preset
- Select: **Vite**

### Root Directory
- Set to: `frontend`

### Build Settings
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### Environment Variables
Add this variable:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `http://YOUR_VPS_IP:8000/api` |

**Replace `YOUR_VPS_IP` with your actual VPS IP address!**

Example: If your VPS IP is `123.45.67.89`, use:
```
http://123.45.67.89:8000/api
```

## Step 3: Deploy

Click "Deploy" and wait for the build to complete.

## Step 4: Update Backend CORS

After deployment, Vercel will give you a URL like: `https://protego-xyz.vercel.app`

1. SSH into your VPS:
   ```bash
   ssh anay@YOUR_VPS_IP
   ```

2. Edit the backend .env file:
   ```bash
   nano ~/Protego/backend/.env
   ```

3. Update ALLOWED_ORIGINS:
   ```
   ALLOWED_ORIGINS=https://protego-xyz.vercel.app,https://your-custom-domain.com
   ```

4. Restart the backend:
   ```bash
   sudo systemctl restart protego
   ```

## Step 5: Test Your Deployment

Visit your Vercel URL and test:
- User registration/login
- Start walk session
- Create alerts
- Stop walk session

## Troubleshooting

### Build fails with TypeScript errors
- Check the build logs in Vercel dashboard
- Fix any TypeScript errors locally first
- Push changes and Vercel will auto-redeploy

### API calls fail (CORS errors)
- Make sure you updated ALLOWED_ORIGINS in backend .env
- Verify backend is running: `sudo systemctl status protego`
- Check backend logs: `sudo journalctl -u protego -f`

### API calls timeout
- Ensure VPS port 8000 is open: `sudo ufw allow 8000/tcp`
- Check if gunicorn is running: `curl http://localhost:8000/health`
- Verify VITE_API_URL in Vercel environment variables

## Custom Domain (Optional)

1. In Vercel dashboard, go to Settings > Domains
2. Add your custom domain
3. Update your domain's DNS records as instructed
4. Update backend ALLOWED_ORIGINS with the new domain

## Auto-Deploy on Git Push

Vercel automatically redeploys when you push to the main branch!

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Your site will auto-update in 1-2 minutes.
