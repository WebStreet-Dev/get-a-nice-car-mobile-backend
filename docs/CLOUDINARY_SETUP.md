# Cloudinary Setup for Image Storage

This guide explains how to configure Cloudinary for persistent image storage in production (Dokploy).

## Why Cloudinary?

- ✅ **Persistent Storage**: Images are stored in the cloud, never lost on server restarts
- ✅ **CDN Delivery**: Fast image delivery worldwide
- ✅ **Automatic Optimization**: Images are automatically optimized (WebP, quality)
- ✅ **Free Tier**: 25GB storage + 25GB bandwidth/month (perfect for most apps)
- ✅ **No Docker Volumes Needed**: Works perfectly with Dokploy

## Setup Steps

### 1. Create Cloudinary Account

1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. After signup, you'll see your **Dashboard** with credentials

### 2. Get Your Credentials

From your Cloudinary Dashboard, you'll need:
- **Cloud Name** (e.g., `dxyz1234`)
- **API Key** (e.g., `123456789012345`)
- **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

### 3. Configure in Dokploy

In your Dokploy project settings, add these **Environment Variables**:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_FOLDER=nicecar
```

**Note**: The `CLOUDINARY_FOLDER` is optional (defaults to `nicecar`). It organizes your images in Cloudinary.

### 4. Deploy

After adding the environment variables:
1. Save the configuration in Dokploy
2. Restart your backend service
3. Check logs to confirm: `Cloudinary configured successfully`

## How It Works

### Automatic Fallback

- **If Cloudinary is configured**: Images are uploaded to Cloudinary and local files are deleted
- **If Cloudinary is NOT configured**: Images are stored locally (works for development)

### Image URLs

- **Cloudinary**: Returns URLs like `https://res.cloudinary.com/your-cloud/image/upload/v1234567890/nicecar/image.jpg`
- **Local**: Returns URLs like `https://your-domain.com/uploads/image.jpg`

### Existing Images

- Images already stored locally will continue to work
- New uploads will go to Cloudinary (if configured)
- You can migrate old images later if needed

## Testing

After setup, test by:
1. Uploading an image through the app
2. Check the response - it should include `"storage": "cloudinary"`
3. Verify the URL is a Cloudinary URL (starts with `https://res.cloudinary.com`)

## Troubleshooting

### Images still using local storage?

- Check environment variables are set correctly in Dokploy
- Restart the backend service after adding variables
- Check logs for: `Cloudinary configured successfully` or `Cloudinary not configured`

### Upload fails?

- Verify your Cloudinary credentials are correct
- Check Cloudinary dashboard for upload errors
- Check backend logs for detailed error messages

## Cost

**Free Tier** (sufficient for most apps):
- 25GB storage
- 25GB bandwidth/month
- Unlimited transformations

**Paid Plans** start at $89/month if you exceed free tier.

## Security

- API Secret is sensitive - never commit it to git
- Use environment variables only
- Cloudinary URLs are public (but hard to guess)
