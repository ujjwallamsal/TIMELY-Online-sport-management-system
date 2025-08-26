# 🚀 Simple Setup Guide for IT Students

## **What You Need:**
- Node.js (download from nodejs.org)
- Your Django backend running
- Basic knowledge of React

## **Step 1: Create Environment File**
Create a `.env` file in the `timely-frontend` folder:
```bash
VITE_API_BASE=http://127.0.0.1:8000/api
```

## **Step 2: Install Dependencies**
```bash
cd timely-frontend
npm install
```

## **Step 3: Start Django Backend**
Make sure your Django backend is running:
```bash
cd timely-backend
python manage.py runserver
```

## **Step 4: Start React Frontend**
In a new terminal:
```bash
cd timely-frontend
npm run dev
```

## **Step 5: Open Browser**
Visit: `http://localhost:5173` (or the port shown in terminal)

---

## **What You'll See:**

✅ **Simple & Clean**: Easy-to-understand code structure  
✅ **Real Data**: Events come from your Django database  
✅ **Professional Look**: Clean, modern design  
✅ **Mobile Friendly**: Works on all devices  
✅ **Easy to Modify**: Simple React components  

## **Features Working:**
- 🏟️ **Events List** - Browse all events from database
- 🔍 **Simple Search** - Search by name, sport, venue
- 🎯 **Basic Filters** - Filter by sport type and venue
- 📱 **Responsive Design** - Works on mobile and desktop
- ⚡ **Real-time Data** - Live updates from backend

---

## **Code Structure (Simple):**

```
src/
├── pages/           # Main pages
│   ├── Home.jsx     # Landing page
│   ├── EventsList.jsx # Events listing
│   ├── Dashboard.jsx # User dashboard
│   ├── Matches.jsx  # Match schedule
│   └── Login.jsx    # Login form
├── components/      # Reusable parts
│   └── Navbar.jsx  # Navigation bar
└── lib/            # API functions
    └── api.js      # Backend connection
```

---

## **Troubleshooting:**

**If you see "No events found":**
- Make sure Django backend is running
- Check that you have events in your database
- Verify the API endpoint `/api/public/events/` works

**If you see connection errors:**
- Check that Django is running on port 8000
- Verify the `.env` file has the correct URL
- Make sure CORS is configured in Django

---

## **What Makes This Simple:**

1. **Basic React**: Only uses useState and useEffect
2. **Simple API Calls**: Just fetch() with basic error handling
3. **Clean CSS**: Uses Tailwind CSS classes
4. **No Complex Libraries**: Only React and basic JavaScript
5. **Easy to Understand**: Clear variable names and simple functions

---

**🎉 Your simple sports events app is now running!**

**Perfect for IT students learning React and API integration!**
