# GraphQL

A modern, interactive profile dashboard for Zone01 Kisumu students, built to help you visualize your coding journey using real data from the Zone01 GraphQL API.

## 🚀 Features

- **Secure Login:** Authenticate with your Zone01 username/email and password.
- **Profile Overview:** See your basic info, XP, level, audit ratio, and project stats.
- **Live Statistics:** Interactive SVG graphs for XP progress and project completion.
- **Recent Activity:** Table of your latest XP transactions.
- **Responsive UI:** Clean, mobile-friendly design using Tailwind CSS.
- **Logout & Refresh:** Secure logout and instant data refresh.

## 🛠️ Technologies

- **Frontend:** HTML, CSS (Tailwind), JavaScript (ES Modules)
- **Data:** GraphQL API ([Zone01 Kisumu](https://learn.zone01kisumu.ke/api/graphql-engine/v1/graphql))
- **Icons:** Font Awesome
- **Static Server:** Go

## 📊 GraphQL Usage

This project demonstrates:
- **Basic queries:** Fetching user info, XP, projects, etc.
- **Nested queries:** Getting related data (e.g., user audits, events).
- **Queries with arguments:** Filtering transactions, projects, and more.

## 📦 Project Structure

```
static/
  script/
    main.js         # App entry point, event listeners, navigation
    auth.js         # Login/logout logic
    profile.js      # Fetch and refresh profile data
    ui.js           # UI updates, error handling, DOM manipulation
    charts.js       # SVG graph and chart rendering
index.html          # Main HTML page
main.go             # Go static file server
README.md           # Project documentation
```

## 📝 How to Use

1. **Clone or Download this Repository**

2. **Serve the Project**
   - **With Go:**  
     ```sh
     go run main.go
     ```
     Then open [http://localhost:8000](http://localhost:8000) in your browser.
   - **Or with Python:**  
     ```sh
     python3 -m http.server
     ```
     Then open [http://localhost:8000](http://localhost:8000).

3. **Login**
   - Use your Zone01 username/email and password.
   - If successful, your profile and stats will load.

4. **Explore**
   - View your XP, project stats, and recent activity.
   - Use the refresh buttons to update your data.
   - Click "Logout" to end your session.

## 🌐 Hosting

The project has been hosted in vercel, the link is as below:
https://graphy-9gfwhtcft-bshisias-projects.vercel.app/



## 🧑‍💻 Author

Built by ***Brian Shisia***

---

**Enjoy visualizing your Zone01 journey!**