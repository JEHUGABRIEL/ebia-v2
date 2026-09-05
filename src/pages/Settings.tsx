import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Bell,
  Globe,
  Lock,
  Trash2,
  Loader2,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  getUserSettings,
  updateUserSettings,
  changePassword,
  deleteAccount,
  type UserSettings,
} from "../lib/api";

export default function Settings() {
  const navigate = useNavigate();

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "preferences" | "security">("profile");

  // Profile form
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  // Preferences
  const [language, setLanguage] = useState("fr");
  const [theme, setTheme] = useState("dark");

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Delete account
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getUserSettings();
      setSettings(data);
      setDisplayName(data.displayName || "");
      setPhone(data.phone || "");
      setEmailNotifications(data.emailNotifications);
      setPushNotifications(data.pushNotifications);
      setWeeklyDigest(data.weeklyDigest);
      setLanguage(data.language || "fr");
      setTheme(data.theme || "dark");
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const updated = await updateUserSettings({
        displayName: displayName.trim(),
        phone: phone.trim(),
      });
      setSettings(updated);
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setSaving(true);
      const updated = await updateUserSettings({
        emailNotifications,
        pushNotifications,
        weeklyDigest,
      });
      setSettings(updated);
    } catch (err) {
      console.error("Failed to save notifications:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      const updated = await updateUserSettings({ language, theme });
      setSettings(updated);
    } catch (err) {
      console.error("Failed to save preferences:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    try {
      setSaving(true);
      await changePassword({ currentPassword, newPassword });
      setPasswordSuccess("Mot de passe modifié avec succès");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.message || "Erreur lors de la modification du mot de passe");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount(deletePassword);
      localStorage.clear();
      navigate("/");
    } catch (err: any) {
      console.error("Failed to delete account:", err);
    }
  };

  const tabs = [
    { id: "profile" as const, label: "Profil", icon: User },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "preferences" as const, label: "Préférences", icon: Globe },
    { id: "security" as const, label: "Sécurité", icon: Lock },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={32} style={{ color: "var(--amber)", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: "120px" }}>
      {/* Header */}
      <section style={{ padding: "120px 24px 40px", maxWidth: "1360px", margin: "0 auto" }}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 className="bebas" style={{
            fontSize: "clamp(48px, 8vw, 96px)", color: "var(--text)",
            lineHeight: 0.92, marginBottom: "16px",
          }}>
            Mon Compte
          </h1>
        </div>
      </section>

      <div style={{ maxWidth: "1360px", margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "32px" }}>
          {/* Sidebar Tabs */}
          <div>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  width: "100%", padding: "12px 16px", borderRadius: "10px",
                  border: "none", cursor: "pointer", marginBottom: "4px",
                  background: activeTab === tab.id ? "rgba(232,96,26,0.1)" : "transparent",
                  color: activeTab === tab.id ? "var(--amber)" : "var(--muted)",
                  fontSize: "14px", fontWeight: 600, textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{
            background: "rgba(240,235,227,0.02)", border: "1px solid rgba(240,235,227,0.06)",
            borderRadius: "16px", padding: "32px",
          }}>
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text)", marginBottom: "24px" }}>
                  Informations du profil
                </h2>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: "6px" }}>
                    Nom d'affichage
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    style={{
                      width: "100%", padding: "12px 16px", borderRadius: "12px",
                      border: "1px solid rgba(240,235,227,0.1)", background: "rgba(240,235,227,0.03)",
                      color: "var(--text)", fontSize: "14px", outline: "none",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: "6px" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={settings?.email || ""}
                    disabled
                    style={{
                      width: "100%", padding: "12px 16px", borderRadius: "12px",
                      border: "1px solid rgba(240,235,227,0.1)", background: "rgba(240,235,227,0.05)",
                      color: "var(--muted)", fontSize: "14px", outline: "none", cursor: "not-allowed",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: "6px" }}>
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+242 XXX XXX XXX"
                    style={{
                      width: "100%", padding: "12px 16px", borderRadius: "12px",
                      border: "1px solid rgba(240,235,227,0.1)", background: "rgba(240,235,227,0.03)",
                      color: "var(--text)", fontSize: "14px", outline: "none",
                    }}
                  />
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    padding: "12px 24px", borderRadius: "99px",
                    background: "var(--amber)", color: "#fff",
                    border: "none", fontWeight: 700, fontSize: "13px",
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={14} />}
                  Enregistrer
                </button>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text)", marginBottom: "24px" }}>
                  Préférences de notification
                </h2>

                {[
                  { label: "Notifications par email", desc: "Recevez des notifications par email pour les activités importantes", value: emailNotifications, setter: setEmailNotifications },
                  { label: "Notifications push", desc: "Recevez des notifications push sur votre appareil", value: pushNotifications, setter: setPushNotifications },
                  { label: "Résumé hebdomadaire", desc: "Recevez un résumé de votre activité chaque semaine", value: weeklyDigest, setter: setWeeklyDigest },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "16px 0", borderBottom: i < 2 ? "1px solid rgba(240,235,227,0.06)" : "none",
                    }}
                  >
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", marginBottom: "2px" }}>
                        {item.label}
                      </p>
                      <p style={{ fontSize: "12px", color: "var(--muted)" }}>{item.desc}</p>
                    </div>
                    <label style={{ position: "relative", display: "inline-block", width: "44px", height: "24px" }}>
                      <input
                        type="checkbox"
                        checked={item.value}
                        onChange={(e) => item.setter(e.target.checked)}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span
                        style={{
                          position: "absolute", cursor: "pointer", inset: 0,
                          background: item.value ? "var(--amber)" : "rgba(240,235,227,0.1)",
                          borderRadius: "99px", transition: "0.3s",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute", content: '""', height: "18px", width: "18px",
                            left: item.value ? "22px" : "3px", bottom: "3px",
                            background: "#fff", borderRadius: "50%", transition: "0.3s",
                          }}
                        />
                      </span>
                    </label>
                  </div>
                ))}

                <button
                  onClick={handleSaveNotifications}
                  disabled={saving}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    padding: "12px 24px", borderRadius: "99px", marginTop: "24px",
                    background: "var(--amber)", color: "#fff",
                    border: "none", fontWeight: 700, fontSize: "13px",
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={14} />}
                  Enregistrer
                </button>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === "preferences" && (
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text)", marginBottom: "24px" }}>
                  Préférences
                </h2>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: "6px" }}>
                    Langue
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    style={{
                      width: "100%", padding: "12px 16px", borderRadius: "12px",
                      border: "1px solid rgba(240,235,227,0.1)", background: "rgba(240,235,227,0.03)",
                      color: "var(--text)", fontSize: "14px", outline: "none",
                    }}
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="ln">Lingála</option>
                  </select>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: "6px" }}>
                    Thème
                  </label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    style={{
                      width: "100%", padding: "12px 16px", borderRadius: "12px",
                      border: "1px solid rgba(240,235,227,0.1)", background: "rgba(240,235,227,0.03)",
                      color: "var(--text)", fontSize: "14px", outline: "none",
                    }}
                  >
                    <option value="dark">Sombre</option>
                    <option value="light">Clair</option>
                    <option value="system">Système</option>
                  </select>
                </div>

                <button
                  onClick={handleSavePreferences}
                  disabled={saving}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    padding: "12px 24px", borderRadius: "99px",
                    background: "var(--amber)", color: "#fff",
                    border: "none", fontWeight: 700, fontSize: "13px",
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={14} />}
                  Enregistrer
                </button>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text)", marginBottom: "24px" }}>
                  Sécurité
                </h2>

                {/* Change Password */}
                <div style={{ marginBottom: "40px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", marginBottom: "16px" }}>
                    Changer le mot de passe
                  </h3>

                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: "6px" }}>
                      Mot de passe actuel
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        style={{
                          width: "100%", padding: "12px 40px 12px 16px", borderRadius: "12px",
                          border: "1px solid rgba(240,235,227,0.1)", background: "rgba(240,235,227,0.03)",
                          color: "var(--text)", fontSize: "14px", outline: "none",
                        }}
                      />
                      <button
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        style={{
                          position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                          background: "none", border: "none", color: "var(--muted)", cursor: "pointer",
                        }}
                      >
                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: "6px" }}>
                      Nouveau mot de passe
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        style={{
                          width: "100%", padding: "12px 40px 12px 16px", borderRadius: "12px",
                          border: "1px solid rgba(240,235,227,0.1)", background: "rgba(240,235,227,0.03)",
                          color: "var(--text)", fontSize: "14px", outline: "none",
                        }}
                      />
                      <button
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{
                          position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                          background: "none", border: "none", color: "var(--muted)", cursor: "pointer",
                        }}
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: "6px" }}>
                      Confirmer le mot de passe
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{
                        width: "100%", padding: "12px 16px", borderRadius: "12px",
                        border: "1px solid rgba(240,235,227,0.1)", background: "rgba(240,235,227,0.03)",
                        color: "var(--text)", fontSize: "14px", outline: "none",
                      }}
                    />
                  </div>

                  {passwordError && (
                    <p style={{ fontSize: "12px", color: "#EF4444", marginBottom: "12px" }}>{passwordError}</p>
                  )}
                  {passwordSuccess && (
                    <p style={{ fontSize: "12px", color: "#10B981", marginBottom: "12px" }}>{passwordSuccess}</p>
                  )}

                  <button
                    onClick={handleChangePassword}
                    disabled={!currentPassword || !newPassword || !confirmPassword || saving}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "8px",
                      padding: "12px 24px", borderRadius: "99px",
                      background: currentPassword && newPassword && confirmPassword ? "var(--amber)" : "rgba(240,235,227,0.1)",
                      color: currentPassword && newPassword && confirmPassword ? "#fff" : "var(--muted)",
                      border: "none", fontWeight: 700, fontSize: "13px",
                      cursor: currentPassword && newPassword && confirmPassword ? "pointer" : "not-allowed",
                    }}
                  >
                    <Lock size={14} />
                    Changer le mot de passe
                  </button>
                </div>

                {/* Delete Account */}
                <div style={{
                  padding: "24px", borderRadius: "16px",
                  background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)",
                }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#EF4444", marginBottom: "8px" }}>
                    Zone dangereuse
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "16px" }}>
                    La suppression de votre compte est irréversible. Toutes vos données seront effacées.
                  </p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "8px",
                      padding: "12px 24px", borderRadius: "99px",
                      background: "rgba(239,68,68,0.1)", color: "#EF4444",
                      border: "1px solid rgba(239,68,68,0.3)",
                      fontWeight: 700, fontSize: "13px", cursor: "pointer",
                    }}
                  >
                    <Trash2 size={14} />
                    Supprimer mon compte
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: "24px",
          }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)", borderRadius: "20px", padding: "32px",
              width: "100%", maxWidth: "440px", border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#EF4444", marginBottom: "12px" }}>
              Supprimer le compte
            </h2>
            <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "24px", lineHeight: 1.6 }}>
              Cette action est irréversible. Entrez votre mot de passe pour confirmer.
            </p>

            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Mot de passe"
              style={{
                width: "100%", padding: "12px 16px", borderRadius: "12px",
                border: "1px solid rgba(239,68,68,0.3)", background: "rgba(240,235,227,0.03)",
                color: "var(--text)", fontSize: "14px", outline: "none", marginBottom: "24px",
              }}
            />

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => { setShowDeleteModal(false); setDeletePassword(""); }}
                style={{
                  padding: "12px 20px", borderRadius: "99px",
                  border: "1px solid rgba(240,235,227,0.1)", background: "none",
                  color: "var(--muted)", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={!deletePassword}
                style={{
                  padding: "12px 24px", borderRadius: "99px",
                  background: deletePassword ? "#EF4444" : "rgba(240,235,227,0.1)",
                  color: deletePassword ? "#fff" : "var(--muted)",
                  border: "none", fontWeight: 700, fontSize: "13px",
                  cursor: deletePassword ? "pointer" : "not-allowed",
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
