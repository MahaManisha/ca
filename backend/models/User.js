import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [50, "Username must be less than 50 characters"],
      match: [
        /^[a-zA-Z0-9._\-\s]+$/,
        "Username can only contain letters, numbers, spaces, dots, hyphens, and underscores",
      ],
    },

    name: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          return v.endsWith("@nec.edu.in");
        },
        message: "Email must be a valid @nec.edu.in address",
      },
    },

    password: {
      type: String,
      required: function () {
        // Password is only required if user doesn't have googleId
        return !this.googleId;
      },
      minlength: [6, "Password must be at least 6 characters long"],
    },

    contact: {
      type: String,
      trim: true,
      default: "",
    },

    department: {
      type: String,
      trim: true,
      default: "",
    },

    year: {
      type: String,
      trim: true,
      default: "",
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    googleId: {
      type: String,
      sparse: true, // Allows multiple null values but unique when set
      unique: true,
    },

    photo: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// ================== METHODS ==================
// Hide sensitive fields when converting to JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

// ================== MIDDLEWARE ==================
// Pre-save hook to ensure username is unique
userSchema.pre("save", async function (next) {
  // Only run if username is modified or new
  if (!this.isModified("username")) return next();

  try {
    const existingUser = await this.constructor.findOne({
      username: this.username,
      _id: { $ne: this._id },
    });

    if (existingUser) {
      const error = new Error("Username already taken");
      error.status = 400;
      return next(error);
    }

    next();
  } catch (err) {
    next(err);
  }
});

const User = mongoose.model("User", userSchema);

export default User;
