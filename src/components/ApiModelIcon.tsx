import { Layers3 } from "lucide-react";
import Image from "next/image";

const iconByFamily: Record<string, string> = {
  DeepSeek: "/brand-icons/deepseek.svg",
  Qwen: "/brand-icons/qwen.svg",
  Kimi: "/brand-icons/kimi.svg",
  GLM: "/brand-icons/glm.svg",
  MiniMax: "/brand-icons/minimax.svg",
};

export function ApiModelIcon({
  family,
  className = "h-6 w-6",
}: {
  family: string;
  className?: string;
}) {
  const src = iconByFamily[family];

  if (src) {
    return (
      <Image
        src={src}
        alt=""
        aria-hidden="true"
        width={32}
        height={32}
        className={`${className} shrink-0 object-contain`}
      />
    );
  }

  return <Layers3 className={`${className} shrink-0 text-[#5a6061]`} />;
}
