import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

// 🔥 Decode JWT (SINGLE SOURCE OF TRUTH)
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
};

// 🔥 Password Strength
const checkPasswordStrength = (password) => {
  if (!password) return "weak";
  if (password.length < 6) return "weak";

  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);

  if (hasUpper && hasNumber && hasSpecial) return "strong";
  return "medium";
};
const generateSuggestions = (data) => {
  const suggestions = [];

  if (data.publicProfile) {
    suggestions.push("Consider making your profile private.");
  }

  if (data.locationSharing) {
    suggestions.push("Disable unnecessary location sharing.");
  }

  if (data.passwordStrength === "weak") {
    suggestions.push("Use a stronger password with numbers and symbols.");
  }

  if (!data.twoFactorAuth) {
    suggestions.push("Enable two-factor authentication for better security.");
  }

  if (data.publicWifiUsage) {
    suggestions.push("Avoid using public WiFi without a VPN.");
  }

  if (!data.deviceEncrypted) {
    suggestions.push("Encrypt your device to protect sensitive data.");
  }

  if (!data.autoUpdates) {
    suggestions.push("Enable automatic updates to stay protected.");
  }

  if (data.thirdPartyApps > 20) {
    suggestions.push("Reduce the number of third-party apps connected.");
  }

  return suggestions;
};

// 🔥 Same as extension
function calculateSiteRisk(url) {
  if (!url.startsWith("http")) return "Unknown";

  let score = 0;
  if (url.startsWith("http://")) score += 50;
  if (url.includes("login") || url.includes("verify")) score += 25;
  if (url.length > 120) score += 15;

  if (score >= 60) return "High";
  if (score >= 30) return "Medium";
  return "Low";
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token")
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

  const [twinData, setTwinData] = useState({
    publicProfile: false,
    locationSharing: false,
    thirdPartyApps: 0,
    password: "",
    passwordStrength: "weak",
    twoFactorAuth: true,
    publicWifiUsage: false,
    deviceEncrypted: true,
    autoUpdates: true,
    websiteURL: ""
  });

  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  // 🔥 Get userId from token
  const getUserId = () => {
    const token = localStorage.getItem("token");
    const decoded = parseJwt(token);
    return decoded?.userId;
  };

  const fetchHistory = async () => {
    const userId = getUserId();
    if (!userId) return;

    try {
      const res = await axios.get(
        `http://localhost:5000/api/twins/user/${userId}`
      );
      setHistory(res.data);
      console.log("Fetched history:", res.data);
    } catch {
      console.log("Error fetching history");
    }
  };

  // 🔥 Load profile (Digital Twin)
  useEffect(() => {
    const userId = getUserId();

    if (userId) {
      fetchHistory();

      axios
        .get(`http://127.0.0.1:5000/api/profile/${userId}`)
        .then((res) => {
          if (res.data) {
            setTwinData({
              ...res.data,
              password: "",
              websiteURL: ""
            });
          }
        })
        .catch(() => console.log("No profile yet"));
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        loginData
      );

      // 🔥 Store token ONLY
      localStorage.setItem("token", res.data.token);

      // 🔥 Sync token with extension
      if (window.chrome && chrome.storage) {
        chrome.storage.local.set({
          token: res.data.token
        });
      }

      setIsLoggedIn(true);
      fetchHistory();
    } catch {
      alert("Login failed");
    }
  };

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    let updated = {
      ...twinData,
      [name]: type === "checkbox" ? checked : value
    };

    if (name === "password") {
      updated.passwordStrength = checkPasswordStrength(value);
    }

    setTwinData(updated);
  };

  // 🔥 SAVE TWIN
  const saveProfile = async () => {
    const userId = getUserId();

    const payload = {
      userId,
      publicProfile: twinData.publicProfile,
      locationSharing: twinData.locationSharing,
      thirdPartyApps: Number(twinData.thirdPartyApps),
      passwordStrength: twinData.passwordStrength,
      twoFactorAuth: twinData.twoFactorAuth,
      publicWifiUsage: twinData.publicWifiUsage,
      deviceEncrypted: twinData.deviceEncrypted,
      autoUpdates: twinData.autoUpdates
    };

    try {
      await axios.post("http://127.0.0.1:5000/api/profile/save", payload);
      alert("Twin updated successfully");
    } catch {
      alert("Error saving twin");
    }
  };

  // 🔥 SIMULATE
  const handleSubmit = async (e) => {
    e.preventDefault();

    const userId = getUserId();

    try {
      const profileRes = await axios.get(
        `http://127.0.0.1:5000/api/profile/${userId}`
      );

      const profile = profileRes.data;

      if (!profile) {
        alert("Please save your twin first");
        return;
      }

      let url = twinData.websiteURL;
      if (!url.startsWith("http")) {
        url = "https://" + url;
      }

      const payload = {
        userId,

        publicProfile: profile.publicProfile,
        locationSharing: profile.locationSharing,
        thirdPartyApps: Number(profile.thirdPartyApps),

        passwordStrength: profile.passwordStrength,
        twoFactorAuth: profile.twoFactorAuth,

        publicWifiUsage: profile.publicWifiUsage,
        deviceEncrypted: profile.deviceEncrypted,
        autoUpdates: profile.autoUpdates,

        url,
        siteRisk: calculateSiteRisk(url)
      };

      console.log("📤 Sending:", payload);

      const res = await axios.post(
        "http://127.0.0.1:8000/predict",
        payload
      );

      setResult(res.data);
      fetchHistory();
      setSuggestions(generateSuggestions(profile));

    } catch (err) {
      console.log(err);
      alert("Error processing request");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
  };

  const chartData = history.map((item, index) => ({
    name: `Sim ${index + 1}`,
    score: item.riskScore
  }));

  // 🔐 LOGIN UI
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-80">
          {!showSignup ? (
            <>
              <h2 className="text-xl font-semibold mb-4">Login</h2>
              <form onSubmit={handleLogin} className="space-y-3">
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Email"
                  onChange={(e) =>
                    setLoginData({ ...loginData, email: e.target.value })
                  }
                  required
                />
                <input
                  className="w-full border p-2 rounded"
                  type="password"
                  placeholder="Password"
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                  required
                />
                <button className="w-full bg-black text-white py-2 rounded">
                  Login
                </button>
              </form>

              <p className="mt-4 text-sm">
                No account?{" "}
                <button
                  className="text-blue-600"
                  onClick={() => setShowSignup(true)}
                >
                  Signup
                </button>
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-4">Signup</h2>
              <form onSubmit={handleSignup} className="space-y-3">
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Name"
                  onChange={(e) =>
                    setSignupData({ ...signupData, name: e.target.value })
                  }
                  required
                />
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Email"
                  onChange={(e) =>
                    setSignupData({ ...signupData, email: e.target.value })
                  }
                  required
                />
                <input
                  className="w-full border p-2 rounded"
                  type="password"
                  placeholder="Password"
                  onChange={(e) =>
                    setSignupData({ ...signupData, password: e.target.value })
                  }
                  required
                />
                <button className="w-full bg-black text-white py-2 rounded">
                  Signup
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

  // 🧠 MAIN DASHBOARD
  return (
  <div className="flex min-h-screen bg-gray-100">
    
    {/* Sidebar */}
    <div className="w-64 bg-white shadow-lg p-6">
      <h2 className="text-xl font-bold mb-6">Privacy Twin</h2>

      <button
        onClick={handleLogout}
        className="mt-10 bg-black text-white px-4 py-2 rounded w-full hover:bg-gray-800 transition"
      >
        Logout
      </button>
    </div>

    <div className="flex-1 p-8 space-y-6">

      {/* 🔥 HEADER */}
      <div className="bg-white p-6 rounded-2xl shadow-md flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Privacy Dashboard</h2>
          <p className="text-gray-500 text-sm">
            Monitor and improve your privacy posture
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-gray-400">Latest Risk</p>
          <p className="font-semibold text-lg">
            {result?.finalRiskLevel || "N/A"}
          </p>
        </div>
      </div>

      {/* FORM */}
      <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">

          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            className="border p-2 rounded col-span-2"
          />

          <p className="text-sm col-span-2">
            Strength: <b>{twinData.passwordStrength}</b>
          </p>

          <input
            type="text"
            name="websiteURL"
            placeholder="Website (example.com)"
            onChange={handleChange}
            className="border p-2 rounded col-span-2"
          />

          <label><input type="checkbox" name="publicProfile" onChange={handleChange}/> Public Profile</label>
          <label><input type="checkbox" name="locationSharing" onChange={handleChange}/> Location Sharing</label>
          <label><input type="checkbox" name="twoFactorAuth" onChange={handleChange}/> 2FA</label>
          <label><input type="checkbox" name="publicWifiUsage" onChange={handleChange}/> Public WiFi</label>
          <label><input type="checkbox" name="deviceEncrypted" onChange={handleChange}/> Device Encrypted</label>
          <label><input type="checkbox" name="autoUpdates" onChange={handleChange}/> Auto Updates</label>

          <input
            type="number"
            name="thirdPartyApps"
            placeholder="Third-party apps"
            onChange={handleChange}
            className="border p-2 rounded col-span-2"
          />

          <button
            type="button"
            onClick={saveProfile}
            className="bg-blue-600 text-white py-2 rounded col-span-2 hover:bg-blue-700 transition"
          >
            Save Twin
          </button>

          <button className="bg-black text-white py-2 rounded col-span-2 hover:bg-gray-800 transition">
            Simulate Risk
          </button>
        </form>
      </div>

      {/* RESULT */}
      {result && (
        <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition flex flex-col items-center">
          <h4 className="text-gray-500 mb-4">Risk Score</h4>

          <div style={{ width: 120, height: 120 }}>
            <CircularProgressbar
              value={result.riskScore}
              maxValue={100}
              text={`${result.riskScore}`}
              styles={buildStyles({
                textSize: "16px",
                pathColor:
                  result.finalRiskLevel === "High"
                    ? "#ef4444"
                    : result.finalRiskLevel === "Medium"
                    ? "#eab308"
                    : "#22c55e",
                textColor: "#111",
                trailColor: "#eee"
              })}
            />
          </div>

          <p className={`mt-4 font-semibold text-lg ${
            result.finalRiskLevel === "High"
              ? "text-red-600"
              : result.finalRiskLevel === "Medium"
              ? "text-yellow-500"
              : "text-green-600"
          }`}>
            {result.finalRiskLevel} Risk
          </p>
        </div>
      )}

      {/* 🔥 Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
          <h4 className="text-lg font-semibold mb-3">
            Suggestions
          </h4>

          <ul className="space-y-2">
            {suggestions.map((s, i) => (
              <li
                key={i}
                className="p-3 rounded-lg bg-yellow-50 border-l-4 border-yellow-400 text-sm"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 🔥 GRAPH */}
      {history.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
          <h3 className="mb-4 font-semibold">Risk Trend</h3>

          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={history.map((item, index) => ({
                name: `Sim ${index + 1}`,
                score: item.riskScore
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  </div>
);
}

export default App;