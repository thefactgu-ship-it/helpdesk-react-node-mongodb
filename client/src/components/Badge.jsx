function Badge({ text }) {
  return (
    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
      {text}
    </span>
  );
}

export default Badge;