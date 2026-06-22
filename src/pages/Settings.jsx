/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";

export default function Settings() {
  const { state, dispatch, showToast } = useApp();
  const { settings } = state;

  // Form states
  const [agencyName, setAgencyName] = useState(
    settings.agencyName || "Aleef Concepts",
  );
  const [currentMonth, setCurrentMonth] = useState(
    settings.currentMonth || new Date().toISOString().substring(0, 7),
  );

  useEffect(() => {
    document.title = `${settings.agencyName || "Aleef Concepts"} — Settings`;
    if (settings.agencyName) setAgencyName(settings.agencyName);
    if (settings.currentMonth) setCurrentMonth(settings.currentMonth);
  }, [settings]);

  // Handle saving configurations
  const handleSaveSettings = (e) => {
    e.preventDefault();
    if (!agencyName.trim()) {
      showToast("Agency Name cannot be blank", "error");
      return;
    }
    dispatch({
      type: "UPDATE_SETTINGS",
      payload: { agencyName: agencyName.trim(), currentMonth },
    });
    showToast("Settings saved ✓", "success");
  };

  // Clear all data (empty state)
  const handleClearAllData = () => {
    if (window.confirm("Delete everything? This cannot be undone.")) {
      dispatch({ type: "CLEAR_DATA" });
    }
  };

  return (
    <div className="page-container">
      <h1 className="title-large">Settings</h1>
      <p className="subtitle">
        Configure dashboard defaults and manage local datasets
      </p>

      <div className="settings-section">
        {/* SECTION 1 - AGENCY INFO FORM */}
        <div className="card" style={{ maxWidth: "600px", width: "100%" }}>
          <h2
            style={{
              fontSize: "1.2rem",
              marginBottom: "1.25rem",
              fontFamily: "Space Grotesk",
            }}
          >
            Agency Profile
          </h2>
          <form onSubmit={handleSaveSettings}>
            <div className="form-group">
              <label htmlFor="agency-name">Agency Name</label>
              <input
                id="agency-name"
                type="text"
                className="form-input"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="e.g. Aleef Concepts"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="agency-current-month">Current active month</label>
              <input
                id="agency-current-month"
                type="month"
                className="form-input"
                value={currentMonth}
                onChange={(e) => setCurrentMonth(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: "0.5rem" }}
            >
              Save Settings
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
