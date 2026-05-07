# Deployment Guide

This guide will help you deploy your Baby Gender Reveal website to various hosting platforms.

## 🚀 Quick Deployment Options

### 1. Vercel (Recommended)
Vercel is the easiest and most recommended option for this project.

#### Automatic Deployment
1. Push your code to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will automatically detect it's a static site
6. Click "Deploy"

#### Manual Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
vercel --prod
```

#### Custom Domain (Optional)
1. In Vercel dashboard, go to Project Settings
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as instructed

### 2. Netlify
Netlify is another excellent option for static sites.

#### Drag & Drop
1. Go to [netlify.com](https://netlify.com)
2. Drag your entire project folder onto the deployment area
3. Wait for deployment to complete

#### Git Integration
1. Connect your GitHub repository
2. Netlify will auto-detect settings
3. Click "Deploy site"

#### Custom Configuration
Create `netlify.toml` file:
```toml
[build]
  publish = "."

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
```

### 3. GitHub Pages
Free hosting for public repositories.

#### Setup
1. Go to your GitHub repository
2. Click "Settings"
3. Scroll to "GitHub Pages"
4. Source: Deploy from a branch
5. Branch: main / (root)
6. Save

#### Access
Your site will be available at:
`https://yourusername.github.io/baby-gender-reveal/`

### 4. Traditional Web Hosting
For cPanel, Plesk, or similar hosting.

#### Steps
1. Compress project folder as ZIP
2. Upload to public_html or www directory
3. Extract files
4. Ensure index.html is in root

## 🔧 Pre-Deployment Checklist

### ✅ Required Files
Make sure you have all these files:
- `index.html` - Main landing page
- `admin.html` - Admin dashboard
- `reveal.html` - Reveal experience
- `css/` folder with all CSS files
- `js/` folder with all JavaScript files
- `vercel.json` - Vercel configuration
- `README.md` - Documentation

### ✅ File Structure Verification
```
project/
├── index.html
├── admin.html
├── reveal.html
├── css/
│   ├── style.css
│   ├── admin.css
│   └── reveal.css
├── js/
│   ├── app.js
│   ├── admin.js
│   └── reveal.js
├── assets/
│   ├── images/
│   ├── music/
│   └── icons/
├── vercel.json
├── README.md
└── .gitignore
```

### ✅ Test Locally
Before deploying:
1. Open `index.html` in browser
2. Test all navigation links
3. Test admin login (admin/admin123)
4. Create a test user
5. Test reveal experience with generated code
6. Test on mobile devices

## 🌐 Domain Configuration

### Custom Domain Setup

#### Vercel
1. Go to Project Settings > Domains
2. Add your domain (e.g., `yourdomain.com`)
3. Configure DNS:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```

#### Netlify
1. Go to Site settings > Domain management
2. Add custom domain
3. Configure DNS:
   ```
   Type: CNAME
   Name: @
   Value: your-site.netlify.app
   ```

#### GitHub Pages
1. Create `CNAME` file in root
2. Add your domain: `yourdomain.com`
3. Configure DNS:
   ```
   Type: CNAME
   Name: @
   Value: yourusername.github.io
   ```

## 🔒 HTTPS/SSL Setup

### Automatic SSL
- Vercel: Automatic HTTPS certificates
- Netlify: Automatic HTTPS certificates
- GitHub Pages: Automatic HTTPS certificates

### Manual SSL (Traditional Hosting)
1. Obtain SSL certificate (Let's Encrypt recommended)
2. Install certificate in hosting control panel
3. Force HTTPS redirect

## 📊 Analytics Integration

### Google Analytics
Add to `index.html` before `</head>`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Plausible Analytics
Add to `index.html` before `</head>`:
```html
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/plausible.js"></script>
```

## 🎯 Performance Optimization

### Image Optimization
- Use WebP format when possible
- Compress images before upload
- Add lazy loading for large images

### Caching Configuration
The `vercel.json` file includes optimal caching headers:
- CSS/JS: 1 year cache
- Images: 1 year cache
- HTML: No cache (dynamic content)

### Compression
Most platforms automatically gzip compress:
- HTML files
- CSS files
- JavaScript files
- Text-based assets

## 🔍 SEO Optimization

### Meta Tags
Update meta tags in `index.html`:
```html
<meta name="description" content="Beautiful baby gender reveal website with interactive animations">
<meta property="og:title" content="Baby Gender Reveal - Magical Moments">
<meta property="og:description" content="Create magical gender reveal moments">
<meta property="og:image" content="https://yourdomain.com/preview-image.jpg">
<meta property="og:url" content="https://yourdomain.com">
```

### Sitemap
Create `sitemap.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yourdomain.com/</loc>
    <lastmod>2024-01-01</lastmod>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://yourdomain.com/admin</loc>
    <lastmod>2024-01-01</lastmod>
    <priority>0.5</priority>
  </url>
</urlset>
```

## 🚨 Troubleshooting

### Common Issues

#### 404 Errors
- Check file paths in HTML
- Ensure case sensitivity matches
- Verify all files are uploaded

#### CSS Not Loading
- Check CSS file paths
- Verify MIME types on server
- Clear browser cache

#### JavaScript Errors
- Check browser console for errors
- Verify JS file paths
- Test in different browsers

#### Admin Login Not Working
- Clear browser cache/sessionStorage
- Check credentials: admin/admin123
- Verify admin.js is loading

#### Reveal Code Not Working
- Check localStorage is enabled
- Verify user was created in admin
- Test with demo code: DEMO123

### Debug Mode
Add to browser console:
```javascript
// Check if users exist
console.log(localStorage.getItem('babyRevealUsers'));

// Check current session
console.log(sessionStorage.getItem('adminLoggedIn'));

// Test reveal code
console.log(new URLSearchParams(window.location.search).get('code'));
```

## 📱 Mobile Testing

### Testing Tools
- Chrome DevTools (Device Mode)
- BrowserStack
- Actual mobile devices

### Common Mobile Issues
- Touch interactions not working
- Viewport scaling problems
- Performance issues

## 🔄 Continuous Deployment

### GitHub Actions
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### Environment Variables
Set up in your hosting platform:
- `VERCEL_TOKEN`
- `ORG_ID`
- `PROJECT_ID`

## 📈 Monitoring

### Uptime Monitoring
- Uptime Robot
- Pingdom
- Statuspage

### Performance Monitoring
- Google PageSpeed Insights
- GTmetrix
- WebPageTest

## 🎉 Post-Deployment

### First Steps After Deployment
1. Test all functionality
2. Set up analytics
3. Configure domain (if using custom)
4. Set up monitoring
5. Share with users!

### Regular Maintenance
- Update content as needed
- Monitor performance
- Check analytics
- Update dependencies (if any)
- Backup data regularly

---

Need help? Check the main [README.md](README.md) or create an issue in the repository.
