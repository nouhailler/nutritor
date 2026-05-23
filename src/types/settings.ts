export type AIProvider = 'ollama' | 'openrouter' | 'anthropic' | 'openai';

export interface OllamaSettings {
  baseUrl: string;
  model: string;
}

export interface OpenRouterModel {
  id: string;
  name: string;
}

export interface OpenRouterSettings {
  apiKey: string;
  model: string;
  models: OpenRouterModel[];
}

export interface AnthropicSettings {
  apiKey: string;
  model: string;
}

export interface OpenAISettings {
  apiKey: string;
  model: string;
}

export interface StaticModel {
  id: string;
  name: string;
}

export const ANTHROPIC_MODELS: StaticModel[] = [
  { id: 'claude-opus-4-7',            name: 'Claude Opus 4.7' },
  { id: 'claude-sonnet-4-6',          name: 'Claude Sonnet 4.6' },
  { id: 'claude-haiku-4-5-20251001',  name: 'Claude Haiku 4.5' },
];

export const OPENAI_MODELS: StaticModel[] = [
  { id: 'gpt-4o',      name: 'GPT-4o' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'o1',          name: 'o1' },
  { id: 'o1-mini',     name: 'o1 Mini' },
];

export interface AppSettings {
  aiProvider: AIProvider;
  ollama: OllamaSettings;
  openrouter: OpenRouterSettings;
  anthropic: AnthropicSettings;
  openai: OpenAISettings;
}

export const DEFAULT_SETTINGS: AppSettings = {
  aiProvider: 'openrouter',
  ollama: {
    baseUrl: 'http://localhost:11434',
    model: '',
  },
  openrouter: {
    apiKey: '',
    model: '',
    models: [],
  },
  anthropic: {
    apiKey: '',
    model: 'claude-sonnet-4-6',
  },
  openai: {
    apiKey: '',
    model: 'gpt-4o',
  },
};
