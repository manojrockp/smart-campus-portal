# 🌤️ Cloudinary Integration Setup

## Step 1: Create Cloudinary Account
1. Go to https://cloudinary.com/users/register/free
2. Sign up for free account
3. Get your credentials from Dashboard:
   - Cloud Name
   - API Key  
   - API Secret

## Step 2: Install Cloudinary SDK

### Backend (Firebase Functions)
```bash
cd api
npm install cloudinary multer
```

### Frontend
```bash
cd frontend
npm install cloudinary-react
```

## Step 3: Environment Variables

Add to Firebase Functions config:
```bash
firebase functions:config:set cloudinary.cloud_name="your_cloud_name"
firebase functions:config:set cloudinary.api_key="your_api_key"
firebase functions:config:set cloudinary.api_secret="your_api_secret"
```

## Step 4: Benefits
- ✅ 25GB free storage
- ✅ Image/video transformations
- ✅ CDN delivery
- ✅ No billing required
- ✅ Perfect for assignments, documents, profile pics

## Step 5: Usage
- Upload assignments → Cloudinary
- Store URLs in Firestore
- Display with transformations (resize, optimize)

Ready to integrate! 🚀