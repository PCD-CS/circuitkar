import type { Specifications } from "@/types";

export function SpecsTable({ specs }: { specs: Specifications | null }) {
  const entries = specs ? Object.entries(specs) : [];
  if (entries.length === 0) {
    return (
      <p className="text-sm text-[#525252]">No specifications listed.</p>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg border border-[#262626]">
      <table className="w-full text-sm">
        <tbody>
          {entries.map(([key, value], i) => (
            <tr
              key={key}
              className={i % 2 === 0 ? "bg-[#161616]" : "bg-[#111111]"}
            >
              <th className="w-2/5 border-b border-[#262626] px-4 py-2.5 text-left font-medium text-[#A3A3A3]">
                {key}
              </th>
              <td className="border-b border-[#262626] px-4 py-2.5 font-mono text-[#F5F5F5]">
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
