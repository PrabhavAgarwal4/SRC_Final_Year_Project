import { PresetScenario } from './presetScenarios';

const STORAGE_KEY = 'src_visualizer_custom_scenarios';

export function loadSavedScenarios(): PresetScenario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load scenarios from localStorage', e);
    return [];
  }
}

export function saveScenario(scenario: PresetScenario): void {
  try {
    const current = loadSavedScenarios();
    const existingIndex = current.findIndex(s => s.id === scenario.id);
    if (existingIndex >= 0) {
      current[existingIndex] = scenario;
    } else {
      current.push(scenario);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save scenario to localStorage', e);
  }
}

export function deleteSavedScenario(id: string): void {
  try {
    const current = loadSavedScenarios();
    const updated = current.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete scenario from localStorage', e);
  }
}
