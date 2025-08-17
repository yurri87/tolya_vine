import { useState, useEffect, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import AddBottleForm from './components/AddBottleForm';
import './App.css';

function App() {
  const [bottles, setBottles] = useState([]);
  const [editingBottle, setEditingBottle] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

  // --- API Communication ---

  const fetchBottles = useCallback(async () => {
    try {
      const response = await fetch('/api/bottles');
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      const data = await response.json();
      setBottles(data);
    } catch (error) {
      console.error('Failed to fetch bottles:', error);
    }
  }, []);

  useEffect(() => {
    fetchBottles();
  }, [fetchBottles]);

  const prepareBottleData = (bottleData) => {
    const { name, mass, description, startDate, id } = bottleData;
    
    const v = mass / 0.6;
    const z1 = v * 0.3;
    const y1 = v * 0.7;
    const a = v + z1 + y1;
    const z2 = v * 0.1;
    const y2 = v * 0.3;
    const a2 = a + z2 + y2;
    const z3 = v * 0.1;
    const finalVolume = a2 + z3;

    const start = new Date(startDate);

    return {
      id,
      name,
      mass, // Добавлено поле mass
      description, // Поле переименовано
      startDate,
      finalVolume,
      totalSugar: z1 + z2 + z3,
      totalWater: y1 + y2,
      steps: [
        {
          day: 1,
          title: 'Подготовка сусла',
          ingredients: `Сахар: ${z1.toFixed(2)} кг, Вода: ${y1.toFixed(2)} л`,
          isCompleted: false,
          date: start.toISOString(),
        },
        {
          day: 10,
          title: 'Первая добавка сахара',
          ingredients: `Сахар: ${z2.toFixed(2)} кг, Вода: ${y2.toFixed(2)} л`,
          isCompleted: false,
          date: new Date(new Date(start).setDate(start.getDate() + 9)).toISOString(),
        },
        {
          day: 13,
          title: 'Вторая добавка сахара',
          ingredients: `Сахар: ${z3.toFixed(2)} кг`,
          isCompleted: false,
          date: new Date(new Date(start).setDate(start.getDate() + 12)).toISOString(),
        },
      ],
      isArchived: false,
    };
  };

  const handleSaveBottle = async (bottleData) => {
    const isUpdating = !!bottleData.id;
    const bottleWithSteps = prepareBottleData(
      isUpdating ? bottleData : { ...bottleData, id: Date.now() }
    );

    try {
      const response = await fetch('/api/bottles', {
        method: isUpdating ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bottleWithSteps),
      });

      if (!response.ok) {
        throw new Error('Failed to save bottle');
      }
      
      await fetchBottles();
      setEditingBottle(null);
      setIsFormVisible(false); // <-- Вот это исправление

    } catch (error) {
      console.error('Error saving bottle:', error);
    }
  };

  const handleUpdateStep = async (bottleId, stepDay) => {
    const bottleToUpdate = bottles.find(b => b.id === bottleId);
    if (!bottleToUpdate) return;

    const updatedSteps = bottleToUpdate.steps.map(s => 
      s.day === stepDay ? { ...s, isCompleted: true } : s
    );
    
    const updatedBottle = { ...bottleToUpdate, steps: updatedSteps };

    try {
      await fetch('/api/bottles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBottle),
      });
      await fetchBottles();
    } catch (error) {
      console.error('Error updating step:', error);
    }
  };

  const handleDeleteBottle = async (bottleId) => {
    if (window.confirm('Вы уверены, что хотите удалить эту бутыль?')) {
      try {
        await fetch('/api/bottles', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: bottleId }),
        });
        await fetchBottles();
      } catch (error) {
        console.error('Error deleting bottle:', error);
      }
    }
  };

  const handleEditBottle = (bottle) => {
    setEditingBottle(bottle);
    setIsFormVisible(true);
  };

  const handleCancelForm = () => {
    setEditingBottle(null);
    setIsFormVisible(false);
  };

  return (
    <div className="App">

      <Dashboard 
        bottles={bottles.filter(b => !b.isArchived)}
        onUpdateStep={handleUpdateStep}
        onDeleteBottle={handleDeleteBottle}
        onEditBottle={handleEditBottle}
        onAddBottleClick={() => {
          setEditingBottle(null);
          setIsFormVisible(true);
        }} 
      />
      {isFormVisible && (
        <div className="modal-overlay">
          <AddBottleForm 
            bottleToEdit={editingBottle}
            onSave={handleSaveBottle}
            onCancel={handleCancelForm}
            onDelete={handleDeleteBottle}
          />
        </div>
      )}
    </div>
  );
}

export default App;
