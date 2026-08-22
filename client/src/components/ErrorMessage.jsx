/** Red error banner. Renders nothing when there is no message. */
export default function ErrorMessage({ message }) {
  if (!message) return null;
  return <div className="alert alert-error">{message}</div>;
}
