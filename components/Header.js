export default function Header({ title }) {
  return (
    <header className="py-4 border-b mb-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
    </header>
  )
}
