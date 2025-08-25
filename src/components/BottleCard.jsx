import React, { useEffect, useState } from 'react';
import './BottleCard.css';
import { Button } from './ui/button';
import { Pencil } from 'lucide-react';

const BottleCard = ({ bottle, onUpdateStep, onEditBottle, isToday }) => {
  const [forceShowButton, setForceShowButton] = useState(false);
  const startDate = new Date(bottle.startDate);
  const formattedStartDate = startDate.toLocaleDateString('ru-RU');

  const nextStep = bottle.steps.find(s => !s.isCompleted);
  const allStepsCompleted = !nextStep;

  // Точное время до следующего шага (часы/минуты, с днями при необходимости)
  const getTimeRemainingInfo = () => {
    if (!nextStep || !nextStep.date) return { text: '', isPast: false };
    const next = new Date(nextStep.date);
    if (isNaN(next.getTime())) return { text: '', isPast: false };
    const now = new Date();
    let diffMs = next.getTime() - now.getTime();
    const isPast = diffMs <= 0;
    diffMs = Math.abs(diffMs);

    const dayMs = 24 * 60 * 60 * 1000;
    const hourMs = 60 * 60 * 1000;
    const minuteMs = 60 * 1000;

    const days = Math.floor(diffMs / dayMs);
    diffMs %= dayMs;
    const hours = Math.floor(diffMs / hourMs);
    diffMs %= hourMs;
    const minutes = Math.floor(diffMs / minuteMs);

    const parts = [];
    if (days > 0) parts.push(`${days} д`);
    if (hours > 0 || days > 0) parts.push(`${hours} ч`);
    parts.push(`${minutes} мин`);

    const text = isPast ? `Просрочено на ${parts.join(' ')}` : `Через ${parts.join(' ')}`;
    return { text, isPast };
  };

  const getStatusClass = () => {
    if (allStepsCompleted) return 'status-completed';
    const nextStepDate = new Date(nextStep.date);
    if (nextStepDate <= new Date()) return 'status-action-required';
    return 'status-in-progress';
  };

  // Таймер для автообновления метки оставшегося времени
  useEffect(() => {
    const id = setInterval(() => {
      // обновляем состояние, чтобы реактивно пересчитать лейбл
      setForceShowButton((v) => v);
    }, 30 * 1000);
    return () => clearInterval(id);
  }, []);

  const today = new Date();
  const lastStepDay = bottle.steps.length > 0 ? Math.max(...bottle.steps.map(s => s.day)) : 1;
  // Прогресс считаем по минутам (более точный и плавный, чем по дням)
  const minutesPassed = Math.max(0, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60)));
  const totalMinutes = Math.max(1, lastStepDay * 24 * 60);

  let progress = 0;
  if (allStepsCompleted) {
    progress = 100;
  } else if (lastStepDay > 0) {
    progress = Math.min(100, (minutesPassed / totalMinutes) * 100);
  }

  // Позиции майлстоунов по шагам (в процентах ширины бара)
  // Заменяем первый маркер шага стартовым (0%), чтобы количество рисок не увеличивалось
  const stepDays = (bottle.steps || [])
    .filter(s => Number.isFinite(s.day) && s.day > 0)
    .map(s => s.day);
  const minDay = stepDays.length ? Math.min(...stepDays) : 1;
  const completedDays = new Set((bottle.steps || []).filter(s => s.isCompleted).map(s => s.day));
  const stepMilestones = stepDays
    .filter(d => d !== minDay)
    .map(d => ({ day: d, left: lastStepDay > 0 ? (d / lastStepDay) * 100 : 0 }));
  const milestones = [
    { day: minDay, left: 0, isStart: true },
    ...stepMilestones,
  ];

  return (
    <div 
      className={`bottle-card ${getStatusClass()}`}
      onDoubleClick={() => setForceShowButton(true)}
    >
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        <div className="progress-milestones">
          {milestones.map((m) => {
            const isNext = !!nextStep && (nextStep.day === m.day || (m.isStart && nextStep.day === minDay));
            const isDone = m.isStart ? completedDays.has(minDay) : completedDays.has(m.day);
            const style = m.left === 0 ? { left: 0 } : { left: `calc(${m.left}% - 1px)` };
            const title = m.isStart ? 'Старт' : `День ${m.day}`;
            return (
              <span
                key={`${m.isStart ? 'start' : m.day}`}
                className={`milestone ${isDone ? 'milestone-done' : ''} ${isNext ? 'milestone-next' : ''} ${m.isStart ? 'milestone-start' : ''}`}
                style={style}
                title={title}
              />
            );
          })}
        </div>
      </div>
      <div className="card-main-content">
        <div className="bottle-card-header">
          <div className="bottle-title">
            {bottle.name || 'Без названия'}
            {bottle.mass && <span className="bottle-volume">({bottle.mass} кг)</span>}
          </div>
          <div className="header-right-controls">
            <p className="start-date">{formattedStartDate}</p>
            <Button variant="ghost" size="icon" onClick={() => onEditBottle(bottle)} className="btn-edit-card">
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="bottle-steps">
          {bottle.steps.map((step) => (
            <div key={step.day} className={`step-row ${step.isCompleted ? 'completed' : ''}`}>
              <div className="step-day">
                <strong>День {step.day}</strong>
              </div>
              <div className="step-title">
                {step.ingredients}
                {!step.isCompleted && nextStep && step.day === nextStep.day && (() => {
                  const info = getTimeRemainingInfo();
                  if (!info.text) return null;
                  const baseStyle = { color: '#64748b', fontSize: 12 };
                  // Просрочено — новая строка; иначе оставляем в той же строке
                  const style = info.isPast
                    ? { ...baseStyle, display: 'block', marginTop: 4 }
                    : { ...baseStyle, marginLeft: 8 };
                  return (
                    <span className="step-time-remaining" style={style}>
                      {info.text}
                    </span>
                  );
                })()}
              </div>
              <div className="step-action">
                {!step.isCompleted && nextStep && step.day === nextStep.day && (isToday || forceShowButton) && (
                  <Button 
                      size="sm"
                      onClick={() => onUpdateStep(bottle.id, step.day)} 
                      className="btn-complete-step"
                    >
                      Выполнено
                    </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {bottle.description && (
            <div className="bottle-notes">
                <p><strong>Примечания:</strong> {bottle.description}</p>
            </div>
        )}

      </div>


    </div>
  );
};

export default BottleCard;
