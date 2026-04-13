// components/Skeletons/TableSkeleton.jsx
export default function TableSkeleton({ rows = 5, columns = 6 }) {
  return (
    <>
      {[...Array(rows)].map((_, i) => (
        <tr key={i}>
          {[...Array(columns)].map((_, j) => (
            <td key={j}>
              <div style={{ height: 16, background: "#f3f4f6", borderRadius: 4, width: j === 1 ? 120 : j === 4 ? 60 : 80 }}>
                &nbsp;
              </div>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}