// frontend/src/pages/AuthSuccess.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function AuthSuccess({ setUser }) {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userParam = params.get("user");

    if (token && userParam) {
      const user = JSON.parse(decodeURIComponent(userParam));
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user); // update App.jsx user state
      navigate("/home", { replace: true }); // personalized home
    } else {
      navigate("/login", { replace: true });
    }
  }, [navigate, setUser]);

  return <p>Redirecting...</p>;
}

export default AuthSuccess;
