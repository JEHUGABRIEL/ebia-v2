import { useEffect, useState } from "react";
import {
  getCollaborators,
  inviteCollaborator,
  removeCollaborator,
  updateCollaboratorRole,
  type PlaylistCollaborator,
} from "../lib/api";
import { UserPlus, X, Shield, Eye, Trash2, Loader2, Search } from "lucide-react";

type Props = {
  playlistId: string;
  isOwner: boolean;
  onClose: () => void;
};

export default function CollaboratorsPanel({ playlistId, isOwner, onClose }: Props) {
  const [collaborators, setCollaborators] = useState<PlaylistCollaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [inviteError, setInviteError] = useState("");

  useEffect(() => {
    loadCollaborators();
  }, [playlistId]);

  const loadCollaborators = async () => {
    try {
      const data = await getCollaborators(playlistId);
      setCollaborators(data);
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!emailInput.trim()) return;
    setInviteError("");
    try {
      await inviteCollaborator(playlistId, emailInput.trim(), "editor");
      await loadCollaborators();
      setEmailInput("");
    } catch (e) {
      setInviteError(e instanceof Error ? e.message : "Erreur lors de l'invitation");
    }
  };

  const handleRemove = async (collaboratorId: string) => {
    try {
      await removeCollaborator(playlistId, collaboratorId);
      await loadCollaborators();
    } catch (e) {
      setInviteError(e instanceof Error ? e.message : "Erreur lors de la suppression");
    }
  };

  const handleRoleChange = async (collaboratorId: string, newRole: string) => {
    try {
      await updateCollaboratorRole(playlistId, collaboratorId, newRole);
      await loadCollaborators();
    } catch (e) {
      setInviteError(e instanceof Error ? e.message : "Erreur lors de la modification du rôle");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[var(--bg2)] rounded-2xl border border-[var(--border)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-amber-500" />
            <h2 className="text-white font-semibold">Collaborateurs</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {inviteError && (
            <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
              {inviteError}
            </div>
          )}

          {/* Invite by ID */}
          {isOwner && (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  placeholder="ID utilisateur à inviter..."
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-white/5 border border-[var(--border)] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <button
                onClick={handleInvite}
                disabled={!emailInput.trim()}
                className="px-4 py-2.5 rounded-lg bg-amber-500 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-600 transition"
              >
                Inviter
              </button>
            </div>
          )}

          {/* Collaborators list */}
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={20} className="text-amber-500 animate-spin" />
            </div>
          ) : collaborators.length === 0 ? (
            <div className="text-center py-6 text-white/40 text-sm">
              Aucun collaborateur pour le moment
            </div>
          ) : (
            <div className="space-y-2">
              {collaborators.map((collab) => (
                <div
                  key={collab.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5"
                >
                  <img
                    src={collab.userAvatar || "/images/default-avatar.png"}
                    alt={collab.userName || "User"}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      {collab.userName || "Utilisateur"}
                    </p>
                    <p className="text-xs text-white/40 capitalize">{collab.role}</p>
                  </div>

                  {isOwner && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          handleRoleChange(
                            collab.id,
                            collab.role === "editor" ? "viewer" : "editor"
                          )
                        }
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-amber-400 transition"
                        title={collab.role === "editor" ? "Passer en viewer" : "Passer en éditeur"}
                      >
                        {collab.role === "editor" ? <Shield size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={() => handleRemove(collab.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition"
                        title="Retirer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
