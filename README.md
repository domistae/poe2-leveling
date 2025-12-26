# POE2 Campaign Guide

Complete Path of Exile 2 campaign walkthrough with all permanent rewards, skill points, and optimal pathing for Acts 1-4.

## Features

- ✓ **Checkbox Progress Tracking** - Click to mark steps complete
- 💾 **Auto-Save** - Progress saves to browser localStorage
- 📤 **Export/Import** - Transfer progress between devices with shareable codes
- 🎯 **Permanent Rewards** - All skill points, spirit bonuses, and unlocks highlighted
- ⚡ **Optimal Pathing** - Efficient waypoint routing to minimize backtracking
- 📱 **Mobile-Friendly** - Responsive sidebar layout

## Files

```
index.html           - Landing page with act selection
poe2_act1_guide.html - Act 1: Clearfell → Ogham Manor
poe2_act2_guide.html - Act 2: Vastiri Desert → Dreadnought
poe2_act3_guide.html - Act 3: Utzaal → Ziggurat
poe2_act4_guide.html - Act 4: Keth → Nightmare of the King
```

---

## 🚀 GitHub Pages Deployment

### Step 1: Create GitHub Account (if needed)
Go to [github.com](https://github.com) and sign up for a free account.

### Step 2: Create a New Repository

1. Click the **+** icon in the top right → **New repository**
2. Name it something like `poe2-guide` or `poe2-leveling`
3. Make it **Public** (required for free GitHub Pages)
4. Check **"Add a README file"** (optional but recommended)
5. Click **Create repository**

### Step 3: Upload Your Files

**Option A: Web Upload (easiest)**
1. In your repository, click **Add file** → **Upload files**
2. Drag and drop all 5 HTML files:
   - `index.html`
   - `poe2_act1_guide.html`
   - `poe2_act2_guide.html`
   - `poe2_act3_guide.html`
   - `poe2_act4_guide.html`
3. Click **Commit changes**

**Option B: Git Command Line**
```bash
git clone https://github.com/YOUR_USERNAME/poe2-guide.git
cd poe2-guide
# Copy all HTML files here
git add .
git commit -m "Add POE2 campaign guide"
git push
```

### Step 4: Enable GitHub Pages

1. Go to your repository → **Settings** tab
2. Scroll down to **Pages** in the left sidebar
3. Under **Source**, select **Deploy from a branch**
4. Choose **main** branch and **/ (root)** folder
5. Click **Save**
6. Wait 1-2 minutes for deployment

### Step 5: Access Your Site

Your guide will be live at:
```
https://YOUR_USERNAME.github.io/poe2-guide/
```

For example, if your username is `dominique` and repo is `poe2-guide`:
```
https://dominique.github.io/poe2-guide/
```

---

## 🌐 Custom Domain (Optional)

If you purchased a domain like `poe2-campaign.com`:

### Step 1: Add Domain in GitHub
1. Go to repository **Settings** → **Pages**
2. Under **Custom domain**, enter your domain (e.g., `poe2-campaign.com`)
3. Click **Save**

### Step 2: Configure DNS at Your Registrar

Add these DNS records at your domain registrar (Porkbun, Namecheap, etc.):

**For apex domain (poe2-campaign.com):**
```
Type: A
Name: @
Value: 185.199.108.153
       185.199.109.153
       185.199.110.153
       185.199.111.153
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: YOUR_USERNAME.github.io
```

### Step 3: Wait for DNS Propagation
DNS changes can take 15 minutes to 48 hours to propagate. Once complete, your site will be accessible at your custom domain with free HTTPS.

---

## 📤 Progress Export/Import System

### How It Works

1. **Local Storage**: Progress saves automatically to your browser
2. **Export**: Click "📤 Export Progress" → copies a code to clipboard like:
   ```
   PoE2_eyJwb2UyLWFjdDEtZnVsbC12MiI6WyIxIiwiMiIsIjMiXX0=
   ```
3. **Import**: Click "📥 Import Progress" → paste code → restores all checkboxes

### Sharing Progress

- Export codes contain progress for **all acts**
- Can be shared with friends to sync progress
- Works across different browsers/devices

---

## 📝 Updating Content

To update the guides after patches:

1. Edit the HTML files locally
2. Go to your repository → **Add file** → **Upload files**
3. Upload the updated files (will overwrite existing)
4. Click **Commit changes**
5. GitHub Pages will auto-deploy within minutes

---

## License

Free to use and modify. Made for the Path of Exile 2 community.
