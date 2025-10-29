// backend/routes/auth.js
import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";

const router = express.Router();

// ================== GOOGLE AUTH INIT ==================
// Initiates Google OAuth login flow
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// ================== GOOGLE CALLBACK ==================
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}/login`,
    session: false,
  }),
  (req, res) => {
    try {
      if (!req.user) {
        return res.redirect(
          `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=auth_failed`
        );
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: req.user._id, role: req.user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Encode user object for URL
      const userData = encodeURIComponent(JSON.stringify(req.user));

      // Redirect to frontend with token and user info
      const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";
      res.redirect(`${frontendURL}/auth/success?token=${token}&user=${userData}`);
    } catch (err) {
      console.error("❌ Google OAuth Callback Error:", err);
      res.redirect(
        `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=server_error`
      );
    }
  }
);

// ================== LOGOUT ==================
router.get("/logout", (req, res) => {
  try {
    req.logout((err) => {
      if (err) console.error("Logout error:", err);
      res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login`);
    });
  } catch (err) {
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login`);
  }
});

export default router;
