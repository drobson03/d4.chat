import { useQuery } from "@tanstack/react-query";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { SVGProps, useMemo, useState } from "react";
import { getOpenRouterModelsQueryOptions } from "~/lib/models";
import { cn } from "~/lib/utils";
import DeepSeek from "./logos/deepseek";
import Microsoft from "./logos/microsoft";
import { Button } from "./ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import Meta from "./logos/meta";
import Gemini from "./logos/gemini";
import MistralAI from "./logos/mistral";
import Qwen from "./logos/qwen";

const providerMeta: Record<
  string,
  {
    name: string;
    icon: React.ComponentType<SVGProps<SVGSVGElement>>;
  }
> = {
  deepseek: {
    name: "DeepSeek",
    icon: DeepSeek,
  },
  microsoft: {
    name: "Microsoft",
    icon: Microsoft,
  },
  "meta-llama": {
    name: "Meta Llama",
    icon: Meta,
  },
  google: {
    name: "Google Gemini",
    icon: Gemini,
  },
  gemini: {
    name: "Google Gemini",
    icon: Gemini,
  },
  mistralai: {
    name: "Mistral AI",
    icon: MistralAI,
  },
  qwen: {
    name: "Qwen",
    icon: Qwen,
  },
};

export function ModelSelector({
  model: modelId,
  setModel,
}: {
  model: string;
  setModel: (model: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const { data } = useQuery(getOpenRouterModelsQueryOptions);

  const models = data?.models;
  const modelsByProvider = data?.modelsByProvider;

  const currentProviderMeta = useMemo(() => {
    if (!modelId) {
      return null;
    }

    const provider = modelId.split("/")[0];

    if (!provider) {
      return null;
    }

    return providerMeta[provider];
  }, [modelId]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-auto justify-between gap-0.5"
        >
          {modelId ? (
            <>
              {currentProviderMeta ? (
                <currentProviderMeta.icon className="mr-1 size-4 -mb-0.5" />
              ) : null}
              {models?.find((model) => model.id === modelId)?.name}
            </>
          ) : (
            "Select model..."
          )}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Command>
          <CommandInput placeholder="Search models..." />
          <CommandList>
            <CommandEmpty>No models found.</CommandEmpty>
            {Object.entries(modelsByProvider ?? {}).map(
              ([provider, models]) => {
                const currentProviderMeta = providerMeta[provider];

                return (
                  <>
                    <CommandGroup
                      key={provider}
                      className="[&_[cmdk-group-heading]]:flex [&_[cmdk-group-heading]]:items-center [&_[cmdk-group-heading]]:gap-0.5 [&_[cmdk-group-heading]]:flex-row"
                      heading={
                        <>
                          {currentProviderMeta ? (
                            <currentProviderMeta.icon className="mr-1 size-4 -mb-0.5" />
                          ) : null}
                          <p className="text-sm font-small capitalize">
                            {currentProviderMeta?.name ?? provider}
                          </p>
                        </>
                      }
                    >
                      {models?.map((model) => (
                        <CommandItem
                          key={model.id}
                          value={model.id}
                          onSelect={(currentValue) => {
                            setModel(
                              currentValue === modelId ? "" : currentValue,
                            );
                            setOpen(false);
                          }}
                        >
                          {model.name.includes(":")
                            ? model.name.split(":")[1]
                            : model.name}
                          <CheckIcon
                            className={cn(
                              "ml-1 size-4",
                              modelId === model.id
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <CommandSeparator className="last:hidden" />
                  </>
                );
              },
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

  // return (
  //   <Select value={model} onValueChange={(value) => setModel(value)}>
  //     <SelectTrigger className="max-w-min">
  //       <SelectValue placeholder="Model" />
  //     </SelectTrigger>
  //     <SelectContent>
  //       {models?.map((model) => (
  //         <SelectItem key={model.id} value={model.id}>
  //           {model.name}
  //         </SelectItem>
  //       ))}
  //     </SelectContent>
  //   </Select>
  // );
}
