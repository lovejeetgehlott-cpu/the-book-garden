/** Simple centered loading spinner used by every page while fetching. */
export default function Spinner() {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
      <span>Loading…</span>
    </div>
  );
}
