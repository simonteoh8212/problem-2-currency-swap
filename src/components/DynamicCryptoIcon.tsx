export default function DynamicCryptoIcon({
  code,
  ...props
}: { code: string } & React.HTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src={`/tokens/${code}.svg`}
      alt={code}
      width={24}
      height={24}
      style={{ verticalAlign: "middle" }}
      onError={(e) => {
        (e.target as HTMLImageElement).src = "/tokens/default.svg"; // fallback if missing
      }}
      {...props}
    />
  );
}