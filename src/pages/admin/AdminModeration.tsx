import { useParams, Navigate } from "react-router-dom";
import ModerationQueue, { type ModerationFilter } from "../../components/ModerationQueue";

const VALID_FILTERS: ModerationFilter[] = ["pending", "resolved", "dismissed"];

export default function AdminModerationPage() {
  const { filter } = useParams<{ filter: string }>();
  if (!filter || !VALID_FILTERS.includes(filter as ModerationFilter)) {
    return <Navigate to="/admin/moderation/pending" replace />;
  }
  return (
    <div style={{ maxWidth: "800px" }}>
      <ModerationQueue filter={filter as ModerationFilter} />
    </div>
  );
}
