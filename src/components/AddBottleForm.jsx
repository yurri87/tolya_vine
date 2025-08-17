import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const AddBottleForm = ({ bottleToEdit, onSave, onCancel, onDelete }) => {
  const [mass, setMass] = useState('');
  const [name, setName] = useState('без названия');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    if (bottleToEdit) {
      setMass(bottleToEdit.mass || '');
      setName(bottleToEdit.name || 'без названия');
      setDescription(bottleToEdit.description || '');
      setStartDate(bottleToEdit.startDate ? new Date(bottleToEdit.startDate) : new Date());
    } else {
      // Reset form for new bottle
      setMass('');
      setName('без названия');
      setDescription('');
      setStartDate(new Date());
    }
  }, [bottleToEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!mass) {
      alert('Пожалуйста, укажите массу сырья.');
      return;
    }

    const bottleData = {
      name: name || 'без названия',
      mass: parseFloat(mass),
      description,
      startDate: format(startDate, 'yyyy-MM-dd'),
    };

    onSave({ ...bottleData, id: bottleToEdit?.id });
  };

  return (
    <form onSubmit={handleSubmit} className="add-bottle-form">
      <h2>{bottleToEdit ? 'Редактировать бутыль' : 'Добавить новую бутыль'}</h2>
      <div className="form-group">
        <label>Масса ягод, кг</label>
        <Input 
          type="number" 
          value={mass}
          onChange={(e) => setMass(e.target.value)}
          placeholder="Например, 5.5"
          required 
          step="0.1"
        />
      </div>
      <div className="form-group">
        <label>Название</label>
        <Input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="То же что на бутылке"
        />
      </div>
      <div className="form-group">
        <label>Примечания</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Любые заметки..."
          className="notes-textarea"
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
        <div className="form-actions-left">
          {bottleToEdit && (
            <Button 
              type="button" 
              variant="destructive" 
              onClick={() => onDelete(bottleToEdit.id)}
            >
              Удалить
            </Button>
          )}
        </div>
        <div className="form-actions-right">
          <Button type="button" variant="ghost" onClick={onCancel}>Отмена</Button>
          <Button type="submit">{bottleToEdit ? 'Сохранить' : 'Добавить'}</Button>
        </div>
      </div>
    </form>
  );
};

export default AddBottleForm;
