import { useSettings } from "../os/settings";

export function Avatar({ size }: { size: number }) {
  const avatar = useSettings((s) => s.avatar);
  const userName = useSettings((s) => s.userName);
  if (avatar)
    return <img src={avatar} alt="" className="rounded-full object-cover" style={{ width: size, height: size }} />;
  return (
    <div
      className="grid place-items-center rounded-full bg-gradient-to-b from-zinc-400 to-zinc-600 font-medium text-white"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {userName.slice(0, 1).toUpperCase()}
    </div>
  );
}
