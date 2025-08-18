import { create } from 'zustand';

const API_URL = '/api/bottles';

// Функция для подготовки данных бутыли согласно ЗАДАНИЮ.md
const prepareBottleData = (bottleData) => {
  const { name, mass } = bottleData;
  
  // Расчеты по формулам
  const m = parseFloat(mass);
  const v = m / 0.6;
  const z1 = v * 0.3;
  const y1 = v * 0.7;
  const a1 = v + z1 + y1;

  const z2 = v * 0.1;
  const y2 = v * 0.3;
  const a2 = a1 + z2 + y2;

  const z3 = v * 0.1;
  const finalVolume = a2 + z3;

  // Создание предопределенных шагов
  const steps = [
    {
      day: 1,
      name: 'Начальный расклад',
      ingredients: `Сахар: ${z1.toFixed(2)} кг, Вода: ${y1.toFixed(2)} л`,
      isCompleted: true, // Первый шаг выполнен при создании
    },
    {
      day: 10,
      name: 'Добавление сахара и воды',
      ingredients: `Сахар: ${z2.toFixed(2)} кг, Вода: ${y2.toFixed(2)} л`,
      isCompleted: false,
    },
    {
      day: 13,
      name: 'Финальное добавление сахара',
      ingredients: `Сахар: ${z3.toFixed(2)} кг`,
      isCompleted: false,
    },
  ];

  return {
    ...bottleData, // name, mass
    id: bottleData.id || Date.now().toString(),
    startDate: bottleData.startDate || new Date().toISOString(),
    isArchived: bottleData.isArchived || false,
    calculations: {
      v: v.toFixed(2),
      z1: z1.toFixed(2),
      y1: y1.toFixed(2),
      z2: z2.toFixed(2),
      y2: y2.toFixed(2),
      z3: z3.toFixed(2),
      finalVolume: finalVolume.toFixed(2),
    },
    steps: steps.sort((a, b) => a.day - b.day),
  };
};

export const useStore = create((set, get) => ({
  bottles: [],
  isLoading: true,
  error: null,

  fetchBottles: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Failed to fetch');
      const bottles = await response.json();
      set({ bottles, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  addBottle: async (bottleData) => {
    const newBottle = prepareBottleData(bottleData);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBottle),
      });
      if (!response.ok) throw new Error('Failed to add bottle');
      set(state => ({ bottles: [...state.bottles, newBottle] }));
    } catch (error) {
      set({ error: error.message });
    }
  },

  updateBottle: async (bottleToUpdate) => {
    // При обновлении пересчитываем все данные, если масса изменилась
    const originalBottle = get().bottles.find(b => b.id === bottleToUpdate.id);
    const finalBottle = (originalBottle && originalBottle.mass !== parseFloat(bottleToUpdate.mass)) 
      ? prepareBottleData(bottleToUpdate)
      : bottleToUpdate;

    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalBottle),
      });
      if (!response.ok) throw new Error('Failed to update bottle');
      set(state => ({
        bottles: state.bottles.map(b => b.id === finalBottle.id ? finalBottle : b),
      }));
    } catch (error) {
      set({ error: error.message });
    }
  },

  deleteBottle: async (bottleId) => {
    try {
      const response = await fetch(API_URL, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bottleId }),
      });
      if (!response.ok) throw new Error('Failed to delete bottle');
      set(state => ({ bottles: state.bottles.filter(b => b.id !== bottleId) }));
    } catch (error) {
      set({ error: error.message });
    }
  },

  updateStep: async (bottleId, stepDay) => {
    const bottle = get().bottles.find(b => b.id === bottleId);
    if (!bottle) return;

    const updatedSteps = bottle.steps.map(step =>
      step.day === stepDay ? { ...step, isCompleted: true } : step
    );

    const updatedBottle = { ...bottle, steps: updatedSteps };
    get().updateBottle(updatedBottle);
  },
}));
