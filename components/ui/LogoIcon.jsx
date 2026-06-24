import Image from "next/image";
export default function LogoIcon() {
  return (
    <Image
      src="/logos/logo-header.png"
      alt="Logo"
      width={75}
      height={75}
      sizes="75px"
      className="object-contain"
    />
  );
}
