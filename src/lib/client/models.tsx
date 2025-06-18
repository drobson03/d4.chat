import { Gemini } from "@ridemountainpig/svgl-react";
import type { ModelName } from "~/lib/server/models";

type ModelMetadata = {
  label: string;
  description: string;
  lab: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactNode;
};

export const modelMetadata: Record<ModelName, ModelMetadata> = {
  "gemini-2.5-flash-preview-05-20": {
    label: "Gemini 2.5 Flash Preview",
    description: "The latest and greatest Gemini Flash preview model",
    lab: "Google",
    icon: Gemini,
  },
  "gemini-2.5-pro-preview-06-05": {
    label: "Gemini 2.5 Pro Experimental",
    description: "The latest and greatest Gemini Pro experimental model",
    lab: "Google",
    icon: Gemini,
  },
};
