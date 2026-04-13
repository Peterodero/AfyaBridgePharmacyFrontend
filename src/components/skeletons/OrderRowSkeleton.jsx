// components/Skeletons/OrderRowSkeleton.jsx
export default function OrderRowSkeleton({ rows = 5 }) {
  return (
    <>
      {[...Array(rows)].map((_, i) => (
        <tr key={i}>
          <td>
            <div style={{ height: 16, background: "#f3f4f6", borderRadius: 4, width: 80 }}>&nbsp;</div>
          </td>
          <td>
            <div style={{ height: 14, background: "#f3f4f6", borderRadius: 4, width: 120, marginBottom: 6 }}>&nbsp;</div>
            <div style={{ height: 11, background: "#f3f4f6", borderRadius: 4, width: 90 }}>&nbsp;</div>
          </td>
          <td>
            <div style={{ height: 14, background: "#f3f4f6", borderRadius: 4, width: 100 }}>&nbsp;</div>
          </td>
          <td>
            <div style={{ height: 16, background: "#f3f4f6", borderRadius: 4, width: 70 }}>&nbsp;</div>
          </td>
          <td>
            <div style={{ height: 22, background: "#f3f4f6", borderRadius: 4, width: 60 }}>&nbsp;</div>
          </td>
          <td>
            <div style={{ height: 32, background: "#f3f4f6", borderRadius: 6, width: 60 }}>&nbsp;</div>
          </td>
        </tr>
      ))}
    </>
  );
}