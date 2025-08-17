import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const AddBottleForm = ({ bottleToEdit, onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [mass, setMass] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    if (bottleToEdit) {
      setName(bottleToEdit.name || '');
      setMass(bottleToEdit.mass || '');
      setStartDate(bottleToEdit.startDate ? new Date(bottleToEdit.startDate) : new Date());
    } else {
      setName('');
      setMass('');
      setStartDate(new Date());
    }
  }, [bottleToEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !mass) {
      alert('Пожалуйста, заполните все поля.');
      return;
    }

    const bottleData = {
      name,
      mass: parseFloat(mass),
      startDate: format(startDate, 'yyyy-MM-dd'),
    };

    if (bottleToEdit && bottleToEdit.id) {
      bottleData.id = bottleToEdit.id;
    }

    onSave(bottleData);
  };

  return (
    // Я убрал оборачивающий div, который ломал позиционирование
    <form onSubmit={handleSubmit} className="add-bottle-form bg-white p-6 rounded-lg shadow-lg z-20">
      <h2>{bottleToEdit ? 'Редактировать бутыль' : 'Добавить новую бутыль'}</h2>
      <div className="form-group">
        <label>Название</label>
        <Input 
          type="text" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="Например, Изабелла 2025"
        />
      </div>
      <div className="form-group">
        <label>Масса ягод (кг)</label>
        <Input 
          type="number" 
          value={mass} 
          onChange={(e) => setMass(e.target.value)} 
          placeholder="Например, 5.5"
        />
      </div>
      <div className="form-group">
        <label>Дата начала</label>
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant={"outline"}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "PPP", { locale: ru }) : <span>Выберите дату</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-[1001]">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={(date) => {
                  setStartDate(date);
                  setIsCalendarOpen(false);
                }}
              initialFocus
              locale={ru}
              disabled={(date) => date > new Date()}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="form-actions">
        <Button type="submit">{bottleToEdit ? 'Сохранить' : 'Добавить'}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Отмена</Button>
      </div>
    </form>
  );
};

export default AddBottleForm;
