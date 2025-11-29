export default function RecentTable({ rows }) {
  return (
    <div className="card-surface overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between border-b">
        <div className="font-semibold tracking-tight text-gray-800">Recent Articles</div>
        <div className="text-[11px] text-gray-500">Last 24h</div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs">
            <tr className="">
              <th className="text-left px-4 py-2 font-medium">Title</th>
              <th className="text-left px-4 py-2 font-medium">Author</th>
              <th className="text-left px-4 py-2 font-medium">Category</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-right px-4 py-2 font-medium">Views</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={idx} className="border-t hover:bg-gray-50/60 transition-colors">
                <td className="px-4 py-2 font-medium text-gray-800 max-w-[280px] truncate" title={r.title}>{r.title}</td>
                <td className="px-4 py-2 text-gray-600">{r.author}</td>
                <td className="px-4 py-2 text-gray-600">{r.category}</td>
                <td className="px-4 py-2">
                  <span className={`pill-badge ${r.status === 'Published' ? '!bg-green-50 !border-green-200 !text-green-700' : r.status==='Draft' ? '!bg-gray-100 !text-gray-700' : '!bg-yellow-50 !border-yellow-200 !text-yellow-700'}`}>{r.status}</span>
                </td>
                <td className="px-4 py-2 text-right text-gray-700">{r.views.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
