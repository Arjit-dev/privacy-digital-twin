import { useState } from "react";
import axios from "axios";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("userId")
  );
  const [showSignup, setShowSignup] = useState(false);

  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });

  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    publicProfile: false,
    locationSharing: false,
    thirdPartyApps: 0,
    twoFactorAuth: true,
    publicWifiUsage: false,
    deviceEncrypted: true,
    autoUpdates: true
  });

  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  // Fetch history
  const fetchHistory = async (userId) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/twins/user/${userId}`
      );
      setHistory(res.data);
    } catch (err) {
      console.log("Error fetching history");
    }
  };

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        loginData
      );

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.userId);

      setIsLoggedIn(true);
      fetchHistory(res.data.userId);
    } catch {
      alert("Login failed");
    }
  };

  // Signup
  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "http://localhost:5000/api/auth/signup",
        signupData
      );
      alert("Signup successful. Please login.");
      setShowSignup(false);
    } catch {
      alert("Signup failed");
    }
  };

  // Form input
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  };

  // Submit twin
  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem("userId");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/twins/create",
        { ...formData, userId }
      );
      setResult(res.data);
      fetchHistory(userId);
    } catch {
      alert("Error submitting data");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
  };

  // LOGIN / SIGNUP VIEW
  if (!isLoggedIn) {
    return (
      <div style={{ padding: "20px", fontFamily: "Arial" }}>
        {!showSignup ? (
          <>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
              <input
                placeholder="Email"
                onChange={(e) =>
                  setLoginData({ ...loginData, email: e.target.value })
                }
                required
              />
              <br /><br />

              <input
                type="password"
                placeholder="Password"
                onChange={(e) =>
                  setLoginData({ ...loginData, password: e.target.value })
                }
                required
              />
              <br /><br />

              <button type="submit">Login</button>
            </form>

            <p>
              No account?{" "}
              <button onClick={() => setShowSignup(true)}>
                Signup
              </button>
            </p>
          </>
        ) : (
          <>
            <h2>Signup</h2>
            <form onSubmit={handleSignup}>
              <input
                placeholder="Name"
                onChange={(e) =>
                  setSignupData({ ...signupData, name: e.target.value })
                }
                required
              />
              <br /><br />

              <input
                placeholder="Email"
                onChange={(e) =>
                  setSignupData({ ...signupData, email: e.target.value })
                }
                required
              />
              <br /><br />

              <input
                type="password"
                placeholder="Password"
                onChange={(e) =>
                  setSignupData({ ...signupData, password: e.target.value })
                }
                required
              />
              <br /><br />

              <button type="submit">Signup</button>
            </form>

            <p>
              Already have an account?{" "}
              <button onClick={() => setShowSignup(false)}>
                Login
              </button>
            </p>
          </>
        )}
      </div>
    );
  }

  // DASHBOARD VIEW
  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Privacy Digital Twin Dashboard</h1>
      <button onClick={handleLogout}>Logout</button>

      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Name"
          onChange={handleChange}
          required
        />
        <br /><br />

        <input
          name="email"
          placeholder="Email"
          onChange={handleChange}
          required
        />
        <br /><br />

        <input
          type="password"
          name="password"
          placeholder="Enter password"
          onChange={handleChange}
          required
        />
        <br /><br />

        <label>
          Public Profile:
          <input type="checkbox" name="publicProfile" onChange={handleChange} />
        </label>
        <br />

        <label>
          Location Sharing:
          <input type="checkbox" name="locationSharing" onChange={handleChange} />
        </label>
        <br />

        <label>
          Third-party Apps:
          <input type="number" name="thirdPartyApps" onChange={handleChange} />
        </label>
        <br /><br />

        <button type="submit">Simulate Privacy Risk</button>
      </form>

      {result && (
        <div style={{ marginTop: "30px" }}>
          <h2>Risk Score: {result.twin.riskScore}</h2>
          <h3>Risk Level: {result.twin.riskLevel}</h3>
          <h3>AI Predicted Risk: {result.mlRiskLevel}</h3>

          <h4>Suggestions:</h4>
          <ul>
            {result.suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {history.length > 0 && (
        <div style={{ marginTop: "30px" }}>
          <h3>Previous Simulations</h3>
          <ul>
            {history.map((item, index) => (
              <li key={index}>
                Score: {item.riskScore} – Level: {item.riskLevel}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
