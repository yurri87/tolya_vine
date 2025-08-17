import React, { useState, useEffect } from 'react';

import { DatePicker } from './ui/date-picker';

import { Button } from './ui/button';
import { Input } from './ui/input';

const AddBottleForm = ({ bottleToEdit, onSave, onCancel }) => {
  const [bottle, setBottle] = useState({
    name: '',
    mass: '',
    startDate: new Date(),
  });

  useEffect(() => {
    if (bottleToEdit && bottleToEdit.id) {
      setBottle({
        ...bottleToEdit,
        startDate: new Date(bottleToEdit.startDate),
      });
    } else {
      setBottle({
        name: '',
        mass: '',
        startDate: new Date(),
      });
    }
  }, [bottleToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBottle({ ...bottle, [name]: value });
  };

  const handleDateChange = (date) => {
    setBottle(prev => ({ ...prev, startDate: date }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!bottle.mass) {
      alert('Пожалуйста, заполните массу ягод.');
      return;
    }
    const bottleToSave = {
      ...bottle,
      startDate: bottle.startDate.toISOString().split('T')[0],
    };
    onSave(bottleToSave);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-card text-card-foreground p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-lg font-semibold text-center mb-4">
          {bottleToEdit && bottleToEdit.id ? 'Редактировать бутыль' : 'Добавить новую бутыль'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block mb-2 text-sm font-medium">Название (например, "Партия 1")</label>
            <Input
              id="name"
              type="text"
              name="name"
              value={bottle.name}
              onChange={handleChange}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="mass" className="block mb-2 text-sm font-medium">Масса ягод (кг)</label>
            <Input
              id="mass"
              type="number"
              name="mass"
              value={bottle.mass}
              onChange={handleChange}
              required
              step="0.1"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium">Дата начала</label>
            <DatePicker date={bottle.startDate} onDateChange={handleDateChange} />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="secondary" onClick={onCancel}>
              Отмена
            </Button>
            <Button type="submit">
              Сохранить
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBottleForm;
