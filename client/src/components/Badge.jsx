function Badge({ text }) {
  return (
    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
      {text}
    </span>
  );
}

export default Badge;