import { useParams, Navigate } from "react-router-dom";
import ValidationsQueue, { type ValidationTab } from "../../components/ValidationsQueue";

const VALID_TABS: ValidationTab[] = ["artists", "profile", "tracks", "events"];

export default function AdminValidationsPage() {
  const { tab } = useParams<{ tab: string }>();
  if (!tab || !VALID_TABS.includes(tab as ValidationTab)) {
    return <Navigate to="/admin/validations/artists" replace />;
  }
  return (
    <div style={{ maxWidth: "900px" }}>
      <ValidationsQueue tab={tab as ValidationTab} />
    </div>
  );
}
