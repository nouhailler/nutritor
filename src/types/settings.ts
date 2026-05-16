export type AIProvider = 'ollama' | 'openrouter';

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

export interface AppSettings {
  aiProvider: AIProvider;
  ollama: OllamaSettings;
  openrouter: OpenRouterSettings;
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
};
