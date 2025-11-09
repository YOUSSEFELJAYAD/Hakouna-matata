import { Router } from "express";

const router = Router();

// Auth routes
router.post("/auth/register", (req, res) => {
  res.json({ message: "Register endpoint" });
});

router.post("/auth/login", (req, res) => {
  res.json({ message: "Login endpoint" });
});

// User routes
router.get("/users/me", (req, res) => {
  res.json({ message: "Get current user" });
});

router.put("/users/me", (req, res) => {
  res.json({ message: "Update current user" });
});

// Admin routes
router.get("/admin/users", (req, res) => {
  res.json({ message: "Get all users (admin)" });
});

export default router;
