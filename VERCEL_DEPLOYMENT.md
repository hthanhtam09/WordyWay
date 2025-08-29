# Vercel Deployment Guide

## Fixing "API Languages Not Found" Error

This guide will help you resolve the API languages not found error when deploying to Vercel.

## Prerequisites

1. MongoDB Atlas account with a cluster set up
2. Vercel account
3. Your project connected to Vercel

## Step 1: Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add the following environment variable:

```
Name: MONGODB_URI
Value: mongodb+srv://username:password@cluster.mongodb.net/pronounce?retryWrites=true&w=majority
Environment: Production, Preview, Development
```

**Important**: Replace `username`, `password`, and `cluster.mongodb.net` with your actual MongoDB Atlas credentials.

## Step 2: Verify Environment Variables

After setting the environment variable:

1. Go to **Deployments** tab
2. Click on the latest deployment
3. Check the **Build Logs** to ensure no environment variable errors

## Step 3: Test the API

Once deployed, test your API endpoints:

1. **Health Check**: `https://your-domain.vercel.app/api/health`
2. **Languages API**: `https://your-domain.vercel.app/api/languages`
3. **Vocabulary API**: `https://your-domain.vercel.app/api/vocabulary`

## Step 4: Common Issues and Solutions

### Issue: "MONGODB_URI environment variable is required"

**Solution**: Ensure the environment variable is set in Vercel dashboard and redeploy.

### Issue: "Database connection failed"

**Solution**:

- Verify your MongoDB Atlas cluster is accessible
- Check if your IP is whitelisted in MongoDB Atlas
- Ensure the connection string is correct

### Issue: Build fails during deployment

**Solution**:

- Check that all environment variables are set
- Verify the MongoDB connection string format
- Check build logs for specific error messages

## Step 5: Monitor and Debug

1. **Vercel Function Logs**: Check function logs in Vercel dashboard
2. **MongoDB Atlas**: Monitor connection attempts in MongoDB Atlas
3. **API Testing**: Use tools like Postman or curl to test endpoints

## Environment Variables Reference

| Variable      | Description                          | Required      |
| ------------- | ------------------------------------ | ------------- |
| `MONGODB_URI` | MongoDB connection string            | Yes           |
| `NODE_ENV`    | Environment (production/development) | No (auto-set) |
| `VERCEL_ENV`  | Vercel environment                   | No (auto-set) |

## Testing Locally

Before deploying, test locally:

```bash
# Copy environment variables
cp .env.example .env.local

# Update .env.local with your MongoDB URI
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pronounce?retryWrites=true&w=majority

# Run development server
npm run dev

# Test API endpoints
curl http://localhost:3002/api/health
curl http://localhost:3002/api/languages
```

## Support

If you continue to experience issues:

1. Check Vercel build logs
2. Verify MongoDB Atlas connectivity
3. Test API endpoints locally first
4. Check environment variable configuration

## Security Notes

- Never commit `.env.local` to version control
- Use MongoDB Atlas IP whitelisting for production
- Consider using MongoDB Atlas VPC peering for enhanced security
