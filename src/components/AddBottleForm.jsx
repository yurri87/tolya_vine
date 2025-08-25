import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimeClock } from '@mui/x-date-pickers/TimeClock';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

const AddBottleForm = ({ bottleToEdit, onSave, onCancel, onDelete }) => {
  const [mass, setMass] = useState('');
  const [name, setName] = useState('без названия');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  });
  const [timeStr, setTimeStr] = useState('12:00');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const [timeView, setTimeView] = useState('hours'); // 'hours' | 'minutes'
  const [openedTimeStr, setOpenedTimeStr] = useState(null);
  const [clockValue, setClockValue] = useState(() => dayjs()); // временное значение для TimeClock

  useEffect(() => {
    if (bottleToEdit) {
      setMass(bottleToEdit.mass || '');
      setName(bottleToEdit.name || 'без названия');
      // Используем только description как каноничное поле
      setDescription(bottleToEdit.description || '');
      const dt = bottleToEdit.startDate ? new Date(bottleToEdit.startDate) : new Date();
      setStartDate(dt);
      setTimeStr(format(dt, 'HH:mm'));
    } else {
      // Reset form for new bottle
      setMass('');
      setName('без названия');
      setDescription('');
      const noon = new Date();
      noon.setHours(12, 0, 0, 0);
      setStartDate(noon);
      setTimeStr('12:00');
    }
  }, [bottleToEdit]);

  // Запоминаем базовое значение времени при открытии поповера (для потенциальных UX-улучшений)
  useEffect(() => {
    if (isTimeOpen) {
      setTimeView('hours');
      setOpenedTimeStr(timeStr);
      // инициализируем clockValue из текущего времени формы
      const [h, m] = (timeStr || '00:00').split(':').map((v) => parseInt(v, 10) || 0);
      const base = dayjs(startDate);
      setClockValue(base.hour(h).minute(m).second(0).millisecond(0));
    } else {
      setOpenedTimeStr(null);
    }
  }, [isTimeOpen]);

  // Вспомогательно: формируем подпись для кнопки времени
  const timeLabel = () => timeStr || '00:00';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!mass) {
      alert('Пожалуйста, укажите массу сырья.');
      return;
    }

    // Комбинируем выбранные дату и время в один Date
    const [hours, minutes] = (timeStr || '00:00').split(':').map((v) => parseInt(v, 10) || 0);
    const combined = new Date(startDate);
    combined.setHours(hours, minutes, 0, 0);

    const bottleData = {
      name: name || 'без названия',
      mass: parseFloat(mass),
      description,
      startDate: combined.toISOString(),
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
        <label>Дата и время начала</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'nowrap' }}>
          {/* Date picker */}
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant={"outline"}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, 'PPP', { locale: ru }) : <span>Выберите дату</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[1001]">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => {
                  if (!date) return;
                  // сохраняем только дату, время оставляем прежним
                  const [h, m] = (timeStr || '00:00').split(':').map((v) => parseInt(v, 10) || 0);
                  const d = new Date(date);
                  d.setHours(h, m, 0, 0);
                  setStartDate(d);
                  setIsCalendarOpen(false);
                }}
                initialFocus
                locale={ru}
                // Разрешим выбор любых дат; при необходимости можно ограничить
              />
            </PopoverContent>
          </Popover>

          {/* Time picker (24h, MUI Clock) */}
          <Popover open={isTimeOpen} onOpenChange={setIsTimeOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline">
                {timeLabel()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="z-[1001]" style={{ padding: 8 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <TimeClock
                    value={clockValue}
                    views={["hours", "minutes"]}
                    view={timeView}
                    onViewChange={(v) => setTimeView(v)}
                    sx={{ width: 272, height: 272 }}
                    onChange={(newValue, context) => {
                      if (!newValue) return;
                      // newValue - Dayjs; синхронизируем локальное время
                      const h = String(newValue.hour()).padStart(2, '0');
                      const m = String(newValue.minute()).padStart(2, '0');
                      setClockValue(newValue);
                      setTimeStr(`${h}:${m}`);
                      // Надёжная логика финализации выбора
                      if (context && context.selectionState === 'finish') {
                        if (timeView === 'hours') {
                          // После выбора часа — переходим к минутам
                          setTimeView('minutes');
                        } else if (timeView === 'minutes') {
                          // После выбора минут — фиксируем в startDate и закрываем
                          const finalH = newValue.hour();
                          const finalM = newValue.minute();
                          const d = new Date(startDate);
                          d.setHours(finalH, finalM, 0, 0);
                          setStartDate(d);
                          setIsTimeOpen(false);
                          setTimeView('hours');
                        }
                      }
                    }}
                    ampm={false}
                  />
                </div>
              </LocalizationProvider>
            </PopoverContent>
          </Popover>
        </div>
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
