export default function AccountPlaceholderPage({ title, phase }) {
  return (
    <div className="py-8 text-center">
      <h1 className="font-heading text-xl font-bold text-[#082F63]">{title}</h1>
      <p className="mt-2 text-sm text-gray-500">{phase}</p>
    </div>
  );
}
