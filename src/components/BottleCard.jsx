import React, { useEffect, useState } from 'react';
import './BottleCard.css';
import { Button } from './ui/button';
import { Pencil } from 'lucide-react';

const BottleCard = ({ bottle, highlightId, onUpdateStep, onEditBottle, isToday }) => {
  const [forceShowButton, setForceShowButton] = useState(false);
  const [completing, setCompleting] = useState(false);
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
    if (isPast) {
      // Для просроченных: показываем только дни и часы, без минут. Единицы пишем вплотную к числам.
      if (days > 0) parts.push(`${days}д`);
      parts.push(`${hours}ч`); // часы показываем всегда, даже если 0
      const text = `Просрочено на ${parts.join(' ')}`;
      return { text, isPast };
    }

    // Для будущих: как и для просроченных — только дни и часы, без минут. Единицы вплотную.
    if (days > 0) parts.push(`${days}д`);
    parts.push(`${hours}ч`);
    const text = `Через ${parts.join(' ')}`;
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
  // Часы/миллисекунды: вычисляем длительность строго по времени, если есть даты шагов
  const startTs = startDate.getTime();
  const stepDates = (bottle.steps || [])
    .map(s => ({ s, ts: s.date ? new Date(s.date).getTime() : NaN }))
    .filter(x => !isNaN(x.ts));
  const lastStepTs = stepDates.length ? Math.max(...stepDates.map(x => x.ts)) : NaN;
  const totalMsByDates = !isNaN(lastStepTs) ? Math.max(1, lastStepTs - startTs) : NaN;
  const fallbackTotalMs = Math.max(1, lastStepDay * 24 * 60 * 60 * 1000);
  const totalMs = !isNaN(totalMsByDates) ? totalMsByDates : fallbackTotalMs;

  // Прогресс считаем по минутам от старта к текущему времени, ограничиваем 0..total
  const minutesPassed = Math.max(0, Math.floor((today.getTime() - startTs) / (1000 * 60)));
  const totalMinutes = Math.max(1, Math.floor(totalMs / (1000 * 60)));

  let progress = 0;
  if (allStepsCompleted) {
    progress = 100;
  } else if (lastStepDay > 0) {
    progress = Math.min(100, (minutesPassed / totalMinutes) * 100);
  }

  // Позиции майлстоунов по шагам (в процентах) считаем по времени, если даты есть; иначе по дням
  const stepsList = (bottle.steps || []).filter(s => Number.isFinite(s.day) && s.day > 0);
  const stepDays = stepsList.map(s => s.day);
  const minDay = stepDays.length ? Math.min(...stepDays) : 1;
  const completedDays = new Set(stepsList.filter(s => s.isCompleted).map(s => s.day));
  const milestones = stepsList.map((s) => {
    const ts = s.date ? new Date(s.date).getTime() : NaN;
    const leftByTime = !isNaN(ts) ? Math.max(0, Math.min(100, ((ts - startTs) / totalMs) * 100)) : null;
    const left = leftByTime == null ? (lastStepDay > 0 ? (s.day / lastStepDay) * 100 : 0) : leftByTime;
    return { day: s.day, left, isStart: s.day === minDay };
  })
  // Заменяем позицию стартового маркера на 0%
  .map(m => m.isStart ? { ...m, left: 0 } : m)
  // Убираем возможные дубликаты по дню, оставляем первый (порядок исходных шагов сохраняется)
  .filter((m, idx, arr) => arr.findIndex(x => x.day === m.day) === idx);

  return (
    <div 
      className={`bottle-card ${getStatusClass()} ${highlightId && highlightId === bottle.id ? 'blink-highlight' : ''}`}
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
                  const baseStyle = { fontSize: 12, fontWeight: 700 };
                  // Будущее — черный жирный; просрочено — красный жирный. Всегда с новой строки.
                  const style = {
                    ...baseStyle,
                    color: info.isPast ? '#ef4444' : '#111827',
                    display: 'block',
                    marginTop: 4,
                  };
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
                    onClick={async () => {
                      try {
                        setCompleting(true);
                        await onUpdateStep(bottle.id, step.day);
                      } finally {
                        setCompleting(false);
                      }
                    }}
                    className="btn-complete-step"
                    disabled={completing}
                  >
                    {completing && <span className="btn-spinner" aria-hidden="true"></span>}
                    {completing ? 'Сохранение…' : 'Выполнено'}
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
