export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
      <div className="skeleton h-40 rounded-2xl" />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="skeleton h-32 rounded-xl" />
        <div className="skeleton h-32 rounded-xl" />
        <div className="skeleton h-32 rounded-xl" />
      </div>
    </div>
  );
}
