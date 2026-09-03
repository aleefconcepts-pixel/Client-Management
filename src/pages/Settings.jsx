/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { sanitizeTextInput } from "../utils/security";

export default function Settings() {
  const { state, dispatch, showToast } = useApp();
  const { settings } = state;

  // Form states - Agency Profile
  const [agencyName, setAgencyName] = useState(
    settings.agencyName || "Aleef Concepts",
  );
  const [currentMonth, setCurrentMonth] = useState(
    settings.currentMonth || new Date().toISOString().substring(0, 7),
  );

  // Form states - Admin Passcode Change
  const [currentPasscode, setCurrentPasscode] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [showCurrentPasscode, setShowCurrentPasscode] = useState(false);
  const [showNewPasscode, setShowNewPasscode] = useState(false);
  const [showConfirmPasscode, setShowConfirmPasscode] = useState(false);

  useEffect(() => {
    document.title = `${settings.agencyName || "Aleef Concepts"} — Settings`;
    if (settings.agencyName) setAgencyName(settings.agencyName);
    if (settings.currentMonth) setCurrentMonth(settings.currentMonth);
  }, [settings]);

  // Handle saving configurations
  const handleSaveSettings = (e) => {
    e.preventDefault();
    const sanitizedAgency = sanitizeTextInput(agencyName);
    if (!sanitizedAgency) {
      showToast("Agency Name cannot be blank", "error");
      return;
    }
    dispatch({
      type: "UPDATE_SETTINGS",
      payload: { agencyName: sanitizedAgency, currentMonth },
    });
    showToast("Settings saved ✓", "success");
  };

  // Handle changing admin passcode
  const handleChangePasscode = (e) => {
    e.preventDefault();

    const activePasscode = (settings.adminPasscode || "admin123").trim();

    if (!currentPasscode.trim()) {
      showToast("Please enter your current admin passcode", "error");
      return;
    }

    if (currentPasscode.trim() !== activePasscode) {
      showToast("Current passcode is incorrect", "error");
      return;
    }

    if (!newPasscode.trim()) {
      showToast("New passcode cannot be empty", "error");
      return;
    }

    if (newPasscode.trim().length < 4) {
      showToast("New passcode should be at least 4 characters", "error");
      return;
    }

    if (newPasscode.trim() !== confirmPasscode.trim()) {
      showToast("New passcode and confirmation do not match", "error");
      return;
    }

    // Save updated passcode to global settings
    dispatch({
      type: "UPDATE_SETTINGS",
      payload: { adminPasscode: newPasscode.trim() },
    });

    // Reset password form fields
    setCurrentPasscode("");
    setNewPasscode("");
    setConfirmPasscode("");

    showToast("Admin passcode updated successfully ✓", "success");
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
        Configure dashboard defaults, admin security, and agency preferences
      </p>

      <div className="settings-section">
        {/* SECTION 1 - AGENCY INFO FORM */}
        <div className="card" style={{ maxWidth: "600px", width: "100%" }}>
          <h2
            style={{
              fontSize: "1.2rem",
              marginBottom: "1.25rem",
              fontFamily: "Space Grotesk",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>🏢</span> Agency Profile
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

        {/* SECTION 2 - ADMIN PASSCODE / SECURITY */}
        <div className="card" style={{ maxWidth: "600px", width: "100%" }}>
          <h2
            style={{
              fontSize: "1.2rem",
              marginBottom: "0.5rem",
              fontFamily: "Space Grotesk",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>🛡️</span> Admin Security & Passcode
          </h2>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.85rem",
              marginBottom: "1.25rem",
            }}
          >
            Update the master passcode used to unlock the Administrator Portal.
          </p>

          <form onSubmit={handleChangePasscode}>
            {/* CURRENT PASSCODE */}
            <div className="form-group">
              <label htmlFor="current-passcode">Current Admin Passcode</label>
              <div className="password-input-wrapper">
                <input
                  id="current-passcode"
                  type={showCurrentPasscode ? "text" : "password"}
                  className="form-input"
                  value={currentPasscode}
                  onChange={(e) => setCurrentPasscode(e.target.value)}
                  placeholder="Enter current passcode"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowCurrentPasscode(!showCurrentPasscode)}
                  title={showCurrentPasscode ? "Hide passcode" : "Show passcode"}
                  aria-label={showCurrentPasscode ? "Hide passcode" : "Show passcode"}
                >
                  {showCurrentPasscode ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* NEW PASSCODE */}
            <div className="form-group">
              <label htmlFor="new-passcode">New Admin Passcode</label>
              <div className="password-input-wrapper">
                <input
                  id="new-passcode"
                  type={showNewPasscode ? "text" : "password"}
                  className="form-input"
                  value={newPasscode}
                  onChange={(e) => setNewPasscode(e.target.value)}
                  placeholder="Enter new passcode (min. 4 characters)"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowNewPasscode(!showNewPasscode)}
                  title={showNewPasscode ? "Hide passcode" : "Show passcode"}
                  aria-label={showNewPasscode ? "Hide passcode" : "Show passcode"}
                >
                  {showNewPasscode ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* CONFIRM NEW PASSCODE */}
            <div className="form-group">
              <label htmlFor="confirm-passcode">Confirm New Passcode</label>
              <div className="password-input-wrapper">
                <input
                  id="confirm-passcode"
                  type={showConfirmPasscode ? "text" : "password"}
                  className="form-input"
                  value={confirmPasscode}
                  onChange={(e) => setConfirmPasscode(e.target.value)}
                  placeholder="Re-enter new passcode"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPasscode(!showConfirmPasscode)}
                  title={showConfirmPasscode ? "Hide passcode" : "Show passcode"}
                  aria-label={showConfirmPasscode ? "Hide passcode" : "Show passcode"}
                >
                  {showConfirmPasscode ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                marginTop: "0.5rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span>🔒 Update Passcode</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
