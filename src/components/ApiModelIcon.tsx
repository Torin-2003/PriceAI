import { Layers3 } from "lucide-react";
import Image from "next/image";

const iconByFamily: Record<string, string> = {
  DeepSeek: "/brand-icons/deepseek.png",
  Qwen: "/brand-icons/qwen.png",
  Kimi: "/brand-icons/kimi.png",
  GLM: "/brand-icons/glm.png",
  MiniMax: "/brand-icons/minimax.png",
  MiMo: "/brand-icons/mimo.png",
  StepFun: "/brand-icons/stepfun.png",
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
