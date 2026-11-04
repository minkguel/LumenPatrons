import Image from "next/image";

type LogoProps = {
  width: number;
  height: number;
};

// Renders both logos; CSS in globals.css shows the one matching the theme.
// Doing it in CSS means the right logo is there on first paint, with no flash.
export function Logo({ width, height }: LogoProps) {
  return (
    <>
      <Image
        src="/brand/lumenpatrons-logo-horizontal.svg"
        alt="LumenPatrons"
        width={width}
        height={height}
        className="logo--light object-contain"
        priority
      />
      <Image
        src="/brand/lumenpatrons-logo-horizontal-dark.svg"
        alt="LumenPatrons"
        width={width}
        height={height}
        className="logo--dark object-contain"
        priority
      />
    </>
  );
}
