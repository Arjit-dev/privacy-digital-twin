import { useState } from "react";
import axios from "axios";

function App() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    publicProfile: false,
    locationSharing: false,
    thirdPartyApps: 0,
    passwordStrength: "strong",
    twoFactorAuth: true,
    publicWifiUsage: false,
    deviceEncrypted: true,
    autoUpdates: true,
  });

  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://localhost:5000/api/twins/create",
        formData
      );
      setResult(res.data);
    } catch (err) {
      console.error(err);
      alert("Error connecting to backend");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Privacy Digital Twin Dashboard</h1>

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

        <label>
          Public Profile:
          <input
            type="checkbox"
            name="publicProfile"
            onChange={handleChange}
          />
        </label>
        <br />

        <label>
          Location Sharing:
          <input
            type="checkbox"
            name="locationSharing"
            onChange={handleChange}
          />
        </label>
        <br />

        <label>
          Third-party Apps:
          <input
            type="number"
            name="thirdPartyApps"
            onChange={handleChange}
          />
        </label>
        <br />

        <label>
          Password Strength:
          <input
            type="password"
            name="password"
            placeholder="Enter password"
            onChange={handleChange}
          />

        </label>
        <br />

        <label>
          Two-Factor Auth:
          <input
            type="checkbox"
            name="twoFactorAuth"
            defaultChecked
            onChange={handleChange}
          />
        </label>
        <br />

        <label>
          Public Wi-Fi Usage:
          <input
            type="checkbox"
            name="publicWifiUsage"
            onChange={handleChange}
          />
        </label>
        <br />

        <label>
          Device Encrypted:
          <input
            type="checkbox"
            name="deviceEncrypted"
            defaultChecked
            onChange={handleChange}
          />
        </label>
        <br />

        <label>
          Auto Updates:
          <input
            type="checkbox"
            name="autoUpdates"
            defaultChecked
            onChange={handleChange}
          />
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
    </div>
  );
}

export default App;
