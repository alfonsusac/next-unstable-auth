export function PlusSymbol(p: { className: string, small?: boolean }) {

  if (p.small) {
    return (
      <div className={"w-0 h-0 absolute " + p.className}>
        <div className="absolute left-0 w-1 h-px bg-zinc-500" />
        <div className="absolute left-0 w-px h-1 bg-zinc-500" />
        <div className="absolute -left-1 w-1 h-px bg-zinc-500" />
        <div className="absolute left-0 -top-1 w-px h-1 bg-zinc-500" />
      </div>
    )
  }


  return (
    <div className={"w-0 h-0 absolute " + p.className}>
      <div className="absolute left-0 w-2 h-px bg-zinc-500" />
      <div className="absolute left-0 w-px h-2 bg-zinc-500" />
      <div className="absolute -left-2 w-2 h-px bg-zinc-500" />
      <div className="absolute left-0 -top-2 w-px h-2 bg-zinc-500" />
    </div>
  )
}