import { useState } from "react";
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

  const fetchHistory = async (userId) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/twins/user/${userId}`
      );
      setHistory(res.data);
    } catch {
      console.log("Error fetching history");
    }
  };

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
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  };

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

  const chartData = history.map((item, index) => ({
    name: `Sim ${index + 1}`,
    score: item.riskScore
  }));

  // LOGIN / SIGNUP VIEW
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

              <p className="mt-4 text-sm">
                Already have an account?{" "}
                <button
                  className="text-blue-600"
                  onClick={() => setShowSignup(false)}
                >
                  Login
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // DASHBOARD
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg p-6">
        <h2 className="text-xl font-bold mb-6">Privacy Twin</h2>

        <nav className="space-y-3">
          <p className="font-medium text-gray-700">Dashboard</p>
          <p className="text-gray-500">History</p>
          <p className="text-gray-500">Settings</p>
        </nav>

        <button
          onClick={handleLogout}
          className="mt-10 bg-black text-white px-4 py-2 rounded w-full"
        >
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">
            Privacy Risk Dashboard
          </h1>
          <p className="text-gray-500">
            Monitor and simulate your privacy posture
          </p>
        </div>

        {/* Simulation Form Card */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-2 gap-4"
          >
            <input
              name="name"
              placeholder="Name"
              onChange={handleChange}
              className="border p-2 rounded"
              required
            />

            <input
              name="email"
              placeholder="Email"
              onChange={handleChange}
              className="border p-2 rounded"
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleChange}
              className="border p-2 rounded col-span-2"
              required
            />

            <label className="flex items-center gap-2">
              <input type="checkbox" name="publicProfile" onChange={handleChange} />
              Public Profile
            </label>

            <label className="flex items-center gap-2">
              <input type="checkbox" name="locationSharing" onChange={handleChange} />
              Location Sharing
            </label>

            <label className="flex items-center gap-2">
              <input type="checkbox" name="twoFactorAuth" onChange={handleChange} />
              Two-Factor Authentication
            </label>

            <label className="flex items-center gap-2">
              <input type="checkbox" name="publicWifiUsage" onChange={handleChange} />
              Public Wi-Fi Usage
            </label>

            <label className="flex items-center gap-2">
              <input type="checkbox" name="deviceEncrypted" onChange={handleChange} />
              Device Encrypted
            </label>

            <label className="flex items-center gap-2">
              <input type="checkbox" name="autoUpdates" onChange={handleChange} />
              Auto Updates Enabled
            </label>

            <input
              type="number"
              name="thirdPartyApps"
              placeholder="Number of third-party apps"
              onChange={handleChange}
              className="border p-2 rounded col-span-2"
            />

            <button className="bg-black text-white py-2 rounded col-span-2">
              Simulate Risk
            </button>
          </form>
        </div>

        {/* Result Cards */}
        {result && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow">
              <h4 className="text-gray-500">Risk Score</h4>
              <h2 className="text-4xl font-bold">
                {result.twin.riskScore}
              </h2>
              <p>{result.twin.riskLevel}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow">
              <h4 className="text-gray-500">AI Prediction</h4>
              <h2 className="text-4xl font-bold">
                {result.mlRiskLevel}
              </h2>
            </div>
          </div>
        )}

        {/* Suggestions Card */}
        {result && result.suggestions && (
          <div className="bg-white p-6 rounded-2xl shadow">
            <h4 className="text-lg font-semibold mb-3">
              Suggestions
            </h4>
            <ul className="space-y-2">
              {result.suggestions.map((s, i) => (
                <li key={i} className="bg-gray-100 p-2 rounded">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Graph Card */}
        {history.length > 1 && (
          <div className="bg-white p-6 rounded-2xl shadow">
            <h3 className="mb-4 font-semibold">Risk Trend</h3>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#ef4444" />
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
