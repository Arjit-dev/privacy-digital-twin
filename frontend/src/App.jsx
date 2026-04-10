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
import { Area } from "recharts";
import "./App.css";

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
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
  console.log("Theme changed:", theme);

  document.body.classList.remove("dark", "light");
  document.body.classList.add(theme);

  localStorage.setItem("theme", theme);
}, [theme]);

  const handleLogoClick = () => {
    setRotating(true);

    setTimeout(() => {
      setTheme(prev => (prev === "dark" ? "light" : "dark"));
      setRotating(false);
    }, 400); // match animation duration
  };

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
const clearHistory = async () => {
  if (!window.confirm("Are you sure you want to clear all history?")) return;

  const userId = getUserId();
  if (!userId) return;

  try {
    await axios.delete(`http://localhost:5000/api/twins/user/${userId}`);
    setHistory([]);
    alert("History cleared");
  } catch {
    alert("Failed to clear history");
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

  const isDark = theme === "dark";

  // 🔐 LOGIN UI
  if (!isLoggedIn) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#020617] relative overflow-hidden">

      {/* 🔥 Background Grid Effect */}
      <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:40px_40px]"></div>

      {/* 🔥 Subtle Glow Orbs */}
      <div className="absolute w-[300px] h-[300px] bg-cyan-500/10 blur-3xl rounded-full top-10 left-10"></div>
      <div className="absolute w-[250px] h-[250px] bg-blue-500/10 blur-3xl rounded-full bottom-10 right-10"></div>

      {/* 🔥 Card */}
      <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl w-80 text-white">

        {/* 🔐 Title */}
        <h2 className="text-xl font-semibold mb-6 text-center tracking-wider text-cyan-400">
          {showSignup ? "Create Profile" : "Login"}
        </h2>

        {/* 🔐 Form */}
        <form
          onSubmit={showSignup ? handleSignup : handleLogin}
          className="space-y-4"
        >

          {/* Name (Signup only) */}
          {showSignup && (
            <input
              className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
              placeholder="Full Name"
              onChange={(e) =>
                setSignupData({ ...signupData, name: e.target.value })
              }
              required
            />
          )}

          {/* Email */}
          <input
            className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
            placeholder="Email"
            onChange={(e) =>
              showSignup
                ? setSignupData({ ...signupData, email: e.target.value })
                : setLoginData({ ...loginData, email: e.target.value })
            }
            required
          />

          {/* Password */}
          <input
            type="password"
            className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
            placeholder="Password"
            onChange={(e) =>
              showSignup
                ? setSignupData({ ...signupData, password: e.target.value })
                : setLoginData({ ...loginData, password: e.target.value })
            }
            required
          />

          {/* Button */}
          <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 py-3 rounded-xl font-medium hover:scale-[1.02] transition transform shadow-lg shadow-cyan-500/20">
            {showSignup ? "Create Account" : "Login"}
          </button>
        </form>

        {/* 🔁 Toggle */}
        <p className="mt-5 text-sm text-center text-gray-400">
          {showSignup ? "Already have an account?" : "No account?"}{" "}
          <button
            className="text-cyan-400 hover:underline"
            onClick={() => setShowSignup(!showSignup)}
          >
            {showSignup ? "Login" : "Signup"}
          </button>
        </p>

      </div>
    </div>
  );
}

  // 🧠 MAIN DASHBOARD
  return (
  <div
  className={`flex min-h-screen ${
    theme === "dark"
      ? "bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#020617] text-white"
      : "bg-gradient-to-br from-white via-gray-100 to-gray-200 text-black"
  }`}
>
    {/* Sidebar */}
    <div className="w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 shadow-2xl p-6">
      <h2 className={`text-xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-black"} tracking-wide`}><div>
      <img
        src={theme === "dark" ? "/dark.png" : "/light.png"}
        alt="logo"
        onClick={handleLogoClick}
        className={`logo ${rotating ? "rotate" : ""}`}
      />
    </div>Privacy Twin</h2>
    {/* 🔥 Recent Activity */}
{/* 🔥 Recent Activity */}
<div className="mt-8">
  <h3 className="text-sm font-semibold mb-3 opacity-70">
    Recent Activity
  </h3>

  <div className="space-y-2">
    {history.slice(-5).reverse().map((item, i) => (
      <div
        key={i}
        className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
      >

        {/* LEFT */}
        <div className="flex items-center gap-2">
          <span className={
            item.riskLevel === "High" ? "text-red-400" :
            item.riskLevel === "Medium" ? "text-yellow-400" :
            "text-green-400"
          }>
            {item.riskLevel}
          </span>

          <span className="text-xs opacity-60">
            {item.riskScore}
          </span>
        </div>

        {/* RIGHT */}
        <span className="text-[10px] opacity-50">
          {new Date(item.createdAt).toLocaleTimeString()}
        </span>
      </div>
    ))}
  </div>
</div>
<button
  onClick={clearHistory}
  className="mt-10 bg-black text-white px-4 py-2 rounded-xl w-full transition-all duration-300
hover:shadow-[0_0_15px_rgba(239,68,68,0.6)]
hover:border hover:border-yellow-500"
>
  Clear History
</button>
      <button
        onClick={handleLogout}
        className="mt-10 bg-black text-white px-4 py-2 rounded-xl w-full transition-all duration-300
hover:shadow-[0_0_15px_rgba(239,68,68,0.6)]
hover:border hover:border-red-500"
      >
        Logout
      </button>
    </div>

    <div className="flex-1 p-8 space-y-6">

      {/* 🔥 HEADER */}
      <div className="bg-white/5 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/10 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Privacy Dashboard</h2>
          <p className="text-gray-500 text-sm">
            Monitor and improve your privacy posture
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-gray-400">Latest Risk</p>
          <p
  className={`font-semibold text-lg px-3 py-1 rounded-full inline-block
    ${
      result?.finalRiskLevel === "High"
        ? "text-red-400"
        : result?.finalRiskLevel === "Medium"
        ? "text-yellow-400"
        : "text-green-400"
    }
  `}
  style={{
    textShadow:
      result?.finalRiskLevel === "High"
        ? "0 0 10px rgba(239,68,68,0.8)"
        : result?.finalRiskLevel === "Medium"
        ? "0 0 10px rgba(250,204,21,0.8)"
        : "0 0 10px rgba(34,197,94,0.8)"
  }}
>
  {result?.finalRiskLevel || "N/A"}
</p>
        </div>
      </div>

      {/* FORM */}
      <div className="card-light bg-white/5 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/10 hover:shadow-2xl transition">
      
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">

          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            className={`bg-white/10 border border-white/20 ${theme === "dark" ? "text-white" : "text-black"} placeholder-gray-400 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
          />


          <p className="text-sm col-span-2">
            Strength: <b>{twinData.passwordStrength}</b>
          </p>

          <input
            type="text"
            name="websiteURL"
            placeholder="Website (example.com)"
            onChange={handleChange}
            className={`bg-white/10 border border-white/20 ${theme === "dark" ? "text-white" : "text-black"} placeholder-gray-400 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
          />
          <div className="col-span-2 grid grid-cols-2 gap-y-3 gap-x-10 mt-2">

  <label className="flex items-center gap-3 text-sm text-gray-450">
    <input type="checkbox" name="publicProfile" onChange={handleChange} className="accent-blue-500 w-4 h-4"/>
    Public Profile
  </label>

  <label className="flex items-center gap-3 text-sm text-gray-450">
    <input type="checkbox" name="locationSharing" onChange={handleChange} className="accent-blue-500 w-4 h-4"/>
    Location Sharing
  </label>

  <label className="flex items-center gap-3 text-sm text-gray-450">
    <input type="checkbox" name="twoFactorAuth" onChange={handleChange} className="accent-blue-500 w-4 h-4"/>
    2FA
  </label>

  <label className="flex items-center gap-3 text-sm text-gray-450">
    <input type="checkbox" name="publicWifiUsage" onChange={handleChange} className="accent-blue-500 w-4 h-4"/>
    Public WiFi
  </label>

  <label className="flex items-center gap-3 text-sm text-gray-450">
    <input type="checkbox" name="deviceEncrypted" onChange={handleChange} className="accent-blue-500 w-4 h-4"/>
    Device Encrypted
  </label>

  <label className="flex items-center gap-3 text-sm text-gray-450">
    <input type="checkbox" name="autoUpdates" onChange={handleChange} className="accent-blue-500 w-4 h-4"/>
    Auto Updates
  </label>

</div>

          <input
            type="number"
            name="thirdPartyApps"
            placeholder="Third-party apps"
            onChange={handleChange}
            className={`bg-white/10 border border-white/20 ${theme === "dark" ? "text-white" : "text-black"} placeholder-gray-400 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
          />

          <button
            type="button"
            onClick={saveProfile}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 rounded-xl col-span-2 hover:scale-105 transition transform shadow-lg"
          >
            Save Twin
          </button>

          <button className="bg-gradient-to-r from-purple-500 to-pink-600 text-white py-2 rounded-xl col-span-2 hover:scale-105 transition transform shadow-lg">
            Simulate Risk
          </button>
        </form>
      </div>

      {/* RESULT */}
      {result && (
  <div className="... hover:scale-[1.02] transition bg-white/5 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-white/10 flex flex-col items-center justify-center relative">

    {/* 🔥 Glow Background */}
    <div
      className={`absolute w-52 h-52 blur-3xl rounded-full ${
        result.finalRiskLevel === "High"
          ? "bg-red-500/20"
          : result.finalRiskLevel === "Medium"
          ? "bg-yellow-500/20"
          : "bg-green-500/20"
      }`}
    ></div>

    <h3 className={`${theme === "dark" ? "text-white" : "text-black"} mb-4 text-sm tracking-wide`}>
      Risk Score
    </h3>

    {/* 🔥 Circular Graph */}


<div style={{ width: 140, height: 140 }} className="relative z-10">
  <CircularProgressbar
    value={result.riskScore}
    maxValue={100}
    text={`${result.riskScore}`}
    styles={buildStyles({
      textSize: "18px",

      // 🔴 Risk color stays same (good UX)
      pathColor:
        result.finalRiskLevel === "High"
          ? "#ef4444"
          : result.finalRiskLevel === "Medium"
          ? "#facc15"
          : "#22c55e",

      // 🧠 Theme-based colors
      textColor: isDark ? "#ffffff" : "#0f172a",

      trailColor: isDark
        ? "rgba(255,255,255,0.1)"
        : "rgba(0,0,0,0.1)"
    })}
  />
</div>

    {/* 🔥 Risk Label */}
    <p
      className={`mt-5 text-xl font-semibold ${
        result.finalRiskLevel === "High"
          ? "text-red-400"
          : result.finalRiskLevel === "Medium"
          ? "text-yellow-400"
          : "text-green-400"
      }`}
      style={{
        textShadow:
          result.finalRiskLevel === "High"
            ? "0 0 12px rgba(239,68,68,0.9)"
            : result.finalRiskLevel === "Medium"
            ? "0 0 10px rgba(250,204,21,0.7)"
            : "0 0 8px rgba(34,197,94,0.6)"
      }}
    >
      {result.finalRiskLevel} Risk
    </p>

  </div>
)}

      {/* 🔥 Suggestions */}
      {suggestions.length > 0 && (
  <div className="bg-white/5 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/10">

    <h4 className={`text-lg font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-black"}`}>
      Suggestions
    </h4>

    <ul className="space-y-3">
      {suggestions.map((s, i) => {

        const getType = (text) => {
          if (text.toLowerCase().includes("password") || text.toLowerCase().includes("two-factor")) return "high";
          if (text.toLowerCase().includes("wifi") || text.toLowerCase().includes("apps")) return "medium";
          return "low";
        };

        const type = getType(s);

        const styles = {
          high: "border-red-500 bg-red-500/10 text-red-300",
          medium: "border-yellow-500 bg-yellow-500/10 text-yellow-300",
          low: "border-blue-500 bg-blue-500/10 text-blue-300"
        };

        return (
          <li
            key={i}
            className={`p-4 rounded-xl border-l-4 ${styles[type]} flex items-center gap-3 transition hover:scale-[1.01]`}
          >
            <span className="text-lg">
              {type === "high" ? "🚨" : type === "medium" ? "⚠️" : "ℹ️"}
            </span>

            <span className="text-sm leading-relaxed">
              {s}
            </span>
          </li>
        );
      })}
    </ul>

  </div>
)}

      {/* 🔥 GRAPH */}
{history.length > 0 && (

  <div
    className="card-light bg-white/5 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/10"
    onMouseMove={(e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
      e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
    }}
  >

    <h3 className={`mb-4 font-semibold text-lg ${theme === "dark" ? "text-white" : "text-black"}`}>
      Risk Trend
    </h3>

    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>

        <LineChart
          data={history.map((item, index) => ({
            name: `Sim ${index + 1}`,
            score: item.riskScore
          }))}
        >

          {/* 🔥 Gradient (subtle cyan area) */}
          <defs>
            <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
            </linearGradient>
          </defs>

          {/* Grid */}
          <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

          {/* Axes */}
          <XAxis
            dataKey="name"
            stroke="#64748b"
            tick={{ fill: "#94a3b8" }}
          />

          <YAxis
            stroke="#64748b"
            tick={{ fill: "#94a3b8" }}
          />

          {/* Tooltip */}
          <Tooltip
            contentStyle={{
              background: "rgba(15, 23, 42, 0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              color: "#fff"
            }}
            labelStyle={{ color: "#94a3b8" }}
          />

          {/* Area */}
          <Area
            type="monotone"
            dataKey="score"
            stroke="none"
            fill="url(#colorRisk)"
          />

          {/* 🔥 LINE (constant cyan) */}
          <Line
            type="monotone"
            dataKey="score"
            stroke="#38bdf8"
            strokeWidth={3}
            dot={(props) => {
              const { cx, cy, payload } = props;

              let color = "#22c55e"; // low
              if (payload.score > 70) color = "#ef4444"; // high
              else if (payload.score > 40) color = "#facc15"; // medium

              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={5}
                  fill={color}
                  style={{
                    filter: `drop-shadow(0 0 6px ${color})`
                  }}
                />
              );
            }}
            activeDot={(props) => {
              const { cx, cy, payload } = props;

              let color = "#22c55e";
              if (payload.score > 70) color = "#ef4444";
              else if (payload.score > 40) color = "#facc15";

              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={8}
                  fill={color}
                  style={{
                    filter: `drop-shadow(0 0 10px ${color})`
                  }}
                />
              );
            }}
            isAnimationActive={true}
            animationDuration={800}
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