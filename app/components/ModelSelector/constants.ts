import type { ChatMode, SelectedModel } from "@/types/chat";
import { isAgentMode } from "@/lib/utils/mode-helpers";

export interface ModelOption {
  id: SelectedModel;
  label: string;
  /** Short tagline shown in the hover popup (e.g. "Maximum intelligence for complex work") */
  description?: string;
  /** "Powered by …" line shown beneath the description in the hover popup */
  poweredBy?: string;
  thinking?: boolean;
}

export const ASK_MODEL_OPTIONS: ModelOption[] = [
  {
    id: "hackerai-standard",
    label: "HackerAI Standard",
    description: "Reliable performance for everyday tasks",
    poweredBy: "Top Tools AI · GLM 5.3 Flash",
  },
  {
    id: "hackerai-pro",
    label: "HackerAI Pro",
    description: "Superior performance for most assignments",
    poweredBy: "Top Tools AI · GLM 5.3",
  },
  {
    id: "hackerai-max",
    label: "HackerAI Max",
    description: "Maximum intelligence for complex work",
    poweredBy: "Top Tools AI · GLM 5.3",
  },
  {
    id: "zai-glm-5.2",
    label: "GLM 5.2",
    description:
      "Uses HackerAI’s shared Top Tools connection; no API key setup needed",
    poweredBy: "Top Tools AI · GLM 5.2",
    thinking: true,
  },
  {
    id: "zai-glm-5.3",
    label: "GLM 5.3",
    description:
      "Uses HackerAI’s shared Top Tools connection; no API key setup needed",
    poweredBy: "Top Tools AI · GLM 5.3",
    thinking: true,
  },
  {
    id: "zai-glm-5.3-flash",
    label: "GLM 5.3 Flash",
    description: "Fast shared model access; no API key setup needed",
    poweredBy: "Top Tools AI · GLM 5.3 Flash",
    thinking: true,
  },
];

export const AGENT_MODEL_OPTIONS: ModelOption[] = [
  {
    id: "hackerai-standard",
    label: "HackerAI Standard",
    description: "Reliable agent for everyday automation",
    poweredBy: "Top Tools AI · GLM 5.3 Flash",
    thinking: true,
  },
  {
    id: "hackerai-pro",
    label: "HackerAI Pro",
    description: "Superior performance for most assignments",
    poweredBy: "Top Tools AI · GLM 5.3 Flash",
    thinking: true,
  },
  {
    id: "hackerai-max",
    label: "HackerAI Max",
    description: "Maximum intelligence for complex work",
    poweredBy: "Top Tools AI · GLM 5.3",
    thinking: true,
  },
  {
    id: "zai-glm-5.2",
    label: "GLM 5.2",
    description:
      "Uses HackerAI’s shared Top Tools connection; no API key setup needed",
    poweredBy: "Top Tools AI · GLM 5.2",
    thinking: true,
  },
  {
    id: "zai-glm-5.3",
    label: "GLM 5.3",
    description:
      "Uses HackerAI’s shared Top Tools connection; no API key setup needed",
    poweredBy: "Top Tools AI · GLM 5.3",
    thinking: true,
  },
  {
    id: "zai-glm-5.3-flash",
    label: "GLM 5.3 Flash",
    description: "Fast shared model access; no API key setup needed",
    poweredBy: "Top Tools AI · GLM 5.3 Flash",
    thinking: true,
  },
];

export const getDefaultModelForMode = (mode: ChatMode): SelectedModel => {
  const options = isAgentMode(mode) ? AGENT_MODEL_OPTIONS : ASK_MODEL_OPTIONS;
  return options[0].id;
};
