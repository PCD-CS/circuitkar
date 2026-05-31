export default function AdminLoading() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-12 bg-[#161616] rounded-lg animate-pulse" />
      ))}
    </div>
  );
}
