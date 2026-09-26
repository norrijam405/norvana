> **Recovery notice (2026-09-26):** This is historical deployment lineage, not proof of a current live deployment. Historical credentials must not be reused. The browser-password Engine Room is disabled on the modernization branch.\n\n# 🚀 Deploy NORVANA to Vercel (Free)

Vercel is the easiest way to deploy Next.js apps. Free tier includes:
- Unlimited deployments
- Automatic HTTPS
- Custom domains
- Serverless functions

## Step 1: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Create a new repository called `norvana`
3. Push your code:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/norvana.git
git push -u origin main
```

## Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click **"Add New Project"**
3. Import your `norvana` repository
4. Add environment variables:
   - `DATABASE_URL` = your PostgreSQL connection string
   - `STRIPE_SECRET_KEY` = your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET` = your webhook secret
5. Click **Deploy**

## Step 3: Set Up Database (Free)

Use **Neon** for free PostgreSQL:

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy your connection string
4. Add it to Vercel as `DATABASE_URL`

## Step 4: Connect Your IONOS Domain

1. In Vercel, go to **Settings → Domains**
2. Add your domain (e.g., `yourdomain.com`)
3. Vercel will show you DNS records to add
4. In IONOS:
   - Go to **Domains & SSL → DNS Settings**
   - Add the records Vercel shows you

## Step 5: Configure Stripe Webhook

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events and copy the signing secret
4. Add to Vercel environment variables

---

Your site will be live at `https://your-project.vercel.app` (free subdomain)
or your custom domain once DNS propagates!
