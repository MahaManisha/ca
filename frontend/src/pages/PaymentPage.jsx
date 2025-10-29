import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { amount, cartItems, user } = location.state || {};

  useEffect(() => {
    if (!amount || !user) {
      alert("Payment information missing. Redirecting to cart.");
      navigate("/cart");
      return;
    }

    // Trigger Razorpay checkout immediately
    const initiatePayment = async () => {
      try {
        // 1️⃣ Create Razorpay order from backend
        const { data } = await axios.post("http://localhost:5000/api/payment/create-order", {
          amount,
        });

        if (!data.success || !data.order) {
          alert("Failed to create payment order");
          return;
        }

        const options = {
          key: data.key, // Comes from backend env (RAZORPAY_KEY_ID)
          amount: data.order.amount,
          currency: "INR",
          name: "Campus Aggregator",
          description: "Payment for rented/shared items",
          order_id: data.order.id,
          handler: async function (response) {
            try {
              // 3️⃣ Verify payment
              const verify = await axios.post("http://localhost:5000/api/payment/verify", response);
              if (verify.data.success) {
                alert("✅ Payment Successful!");
                // Optionally clear cart items on backend
                await axios.post("http://localhost:5000/api/cart/clear", { userId: user._id });
                navigate("/payment-success");
              } else {
                alert("❌ Payment verification failed!");
                navigate("/cart");
              }
            } catch (err) {
              console.error("Verification error:", err);
              alert("Payment verification failed!");
              navigate("/cart");
            }
          },
          prefill: {
            name: user.name,
            email: user.email,
            contact: user.contact || "9999999999",
          },
          notes: {
            user_id: user._id,
            purpose: "Campus Aggregator Payment",
          },
          theme: {
            color: "#0B5ED7",
          },
        };

        // 4️⃣ Open Razorpay Checkout
        const rzp = new window.Razorpay(options);
        rzp.open();
        rzp.on("payment.failed", function () {
          alert("Payment failed. Please try again.");
          navigate("/cart");
        });
      } catch (err) {
        console.error("Payment Error:", err);
        alert("Unable to initiate payment");
        navigate("/cart");
      }
    };

    initiatePayment();
  }, [amount, user, navigate]);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>💳 Online Payment</h2>
      <p style={styles.text}>Redirecting to Razorpay for payment of ₹{amount}</p>
      <p style={styles.text}>Please complete the payment in the popup window.</p>
    </div>
  );
}

// -------------------- Inline CSS Styles --------------------
const styles = {
  container: {
    maxWidth: "400px",
    margin: "100px auto",
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    textAlign: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: "600",
    marginBottom: "15px",
  },
  text: {
    fontSize: "1rem",
    color: "#555",
    marginBottom: "10px",
  },
};

export default PaymentPage;
