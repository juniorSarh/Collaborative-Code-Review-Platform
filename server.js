require("dotenv").config();
const { testConnection } = require("./config/db");
const express = require("express");
const path = require("path");
const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");

const app = express();

app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({success:false, message:"Internal server error"});
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({success:false, message:"Route not found"});
});

const startServer = async () => {
    await testConnection();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Application is running on http://localhost:${PORT}`);  
        });
}   

startServer();
