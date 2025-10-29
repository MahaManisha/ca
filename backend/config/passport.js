import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

console.log("\n========== PASSPORT CONFIG LOADING ==========");

// ================== ENVIRONMENT VALIDATION ==================
const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

console.log("GOOGLE_CLIENT_ID exists:", !!clientID);
console.log("GOOGLE_CLIENT_SECRET exists:", !!clientSecret);

if (!clientID || !clientSecret) {
  console.error("\n❌ ================================================");
  console.error("❌ Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
  console.error("❌ Google OAuth login will NOT work");
  console.error("❌ Add these to your .env file");
  console.error("❌ ================================================\n");
}

// ================== SERIALIZE/DESERIALIZE ==================
passport.serializeUser((user, done) => {
  console.log("🔐 Serializing user:", user._id);
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log("🔓 Deserializing user:", id);
    const user = await User.findById(id).select("-password");
    done(null, user);
  } catch (error) {
    console.error("❌ Deserialize error:", error);
    done(error, null);
  }
});

// ================== CONFIGURE GOOGLE STRATEGY ==================
const configureGoogleStrategy = () => {
  if (!clientID || !clientSecret) {
    console.log("⚠️  Skipping Google OAuth Strategy configuration (credentials missing)");
    return false;
  }

  try {
    passport.use(
      new GoogleStrategy(
        {
          clientID: clientID,
          clientSecret: clientSecret,
          callbackURL: process.env.GOOGLE_CALLBACK_URL,
          scope: ["profile", "email"],
          passReqToCallback: false,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            console.log("\n=== Google OAuth Callback ===");
            console.log("📧 Email:", profile.emails?.[0]?.value);
            console.log("👤 Name:", profile.displayName);
            console.log("🆔 Google ID:", profile.id);

            // Validate email exists
            if (!profile.emails || profile.emails.length === 0) {
              console.error("❌ No email found in Google profile");
              return done(null, false, { 
                message: "No email found in your Google account" 
              });
            }

            const email = profile.emails[0].value;

            // Validate @nec.edu.in domain
            if (!email.endsWith("@nec.edu.in")) {
              console.log("❌ Invalid email domain:", email);
              return done(null, false, {
                message: "Please use your @nec.edu.in email address",
              });
            }

            // Check if user already exists
            let user = await User.findOne({ email });

            if (user) {
              console.log("✅ Existing user found:", user.email);
              
              // Update Google ID if not set
              if (!user.googleId) {
                user.googleId = profile.id;
                await user.save();
                console.log("✅ Added Google ID to existing user");
              }
              
              // Update photo if user doesn't have one
              if (!user.photo || user.photo === "") {
                const googlePhoto = profile.photos?.[0]?.value;
                if (googlePhoto) {
                  user.photo = googlePhoto;
                  await user.save();
                  console.log("✅ Updated user photo from Google");
                }
              }

              return done(null, user);
            }

            // Create new user
            console.log("📝 Creating new user...");
            
            // Generate unique username from email
            let username = email.split("@")[0];
            
            // Check if username exists, append number if needed
            let usernameExists = await User.findOne({ username });
            let counter = 1;
            while (usernameExists) {
              username = `${email.split("@")[0]}_${counter}`;
              usernameExists = await User.findOne({ username });
              counter++;
            }

            const newUser = await User.create({
              username: username,
              name: profile.displayName || username,
              email: email,
              googleId: profile.id,
              photo: profile.photos?.[0]?.value || "",
              role: "user",
              // No password needed for Google OAuth users
            });

            console.log("✅ New user created:", newUser.email);
            return done(null, newUser);

          } catch (error) {
            console.error("❌ Google OAuth Error:", error);
            return done(error, null);
          }
        }
      )
    );
    
    console.log("✅ Google OAuth Strategy registered successfully");
    console.log("========================================\n");
    return true;
  } catch (error) {
    console.error("❌ Error configuring Google Strategy:", error);
    return false;
  }
};

// Execute configuration
const isConfigured = configureGoogleStrategy();

// Export both passport and configuration status
export default passport;
export { isConfigured };