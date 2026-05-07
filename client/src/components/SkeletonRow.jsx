function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b dark:border-slate-700">
      <td className="py-4">
        <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
      </td>
      <td>
        <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-700" />
      </td>
      <td>
        <div className="h-6 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
      </td>
      <td>
        <div className="h-8 w-28 rounded-lg bg-slate-200 dark:bg-slate-700" />
      </td>
      <td>
        <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
      </td>
      <td>
        <div className="h-8 w-20 rounded-lg bg-slate-200 dark:bg-slate-700" />
      </td>
    </tr>
  );
}

export default SkeletonRow;