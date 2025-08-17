import React, { useState, useEffect } from 'react';

// Helper functions for date calculations
const daysBetween = (date1, date2) => {
  const oneDay = 1000 * 60 * 60 * 24;
  const diff = date1.getTime() - date2.getTime();
  return Math.floor(diff / oneDay);
};

const isPastOrToday = (someDate) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  return new Date(someDate) <= today;
};

const formatCountdown = (ms) => {
  if (ms < 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

const BottleCard = ({ bottle, onUpdateStep, onDeleteBottle, onEditBottle }) => {
  // Determine the card's border class based on the status logic
  const getStatusClass = () => {
    const nextStep = bottle.steps.find(s => !s.isCompleted);
    if (!nextStep) return 'status-completed';
    
    if (isPastOrToday(nextStep.date)) return 'status-action-required';
    
    return 'status-in-progress'; // Default status
  };

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const startDate = new Date(bottle.startDate);
  const elapsedDays = daysBetween(now, startDate);
  const currentProcessDay = elapsedDays + 1;

  const nextStep = bottle.steps.find(s => !s.isCompleted);
  const allStepsCompleted = !nextStep;

  const getStatus = () => {
    if (allStepsCompleted) return { text: 'Готово к архивации', class: 'status-completed' };
    if (isPastOrToday(nextStep.date)) return { text: 'ТРЕБУЕТСЯ ДЕЙСТВИЕ', class: 'status-action-required' };
    return { text: 'В процессе', class: 'status-in-progress' };
  };

  const status = getStatus();

  // --- Progress Bar Logic ---
  const totalDays = bottle.steps.length > 0 ? bottle.steps[bottle.steps.length - 1].day : 0;
  const progressPercentage = totalDays > 0 ? Math.min((currentProcessDay / totalDays) * 100, 100) : 0;

  const renderNextAction = () => {
    if (allStepsCompleted) {
      return <p>Все шаги выполнены. Готово к архивации!</p>;
    }

    const nextStepDate = new Date(nextStep.date);
    const daysUntil = Math.ceil((nextStepDate - now) / (1000 * 60 * 60 * 24));
    const countdown = formatCountdown(nextStepDate - now);
    const isUrgent = isPastOrToday(nextStep.date);

    const actionButton = (
      <button 
        onClick={() => onUpdateStep(bottle.id, nextStep.day)} 
        className={`btn-complete-step ${isUrgent ? 'urgent' : ''}`}>
        {nextStep.day === 1 ? 'Сусло подготовлено' : 'Я добавил'}
      </button>
    );

    return (
      <>
        {isUrgent ? (
          <div className="next-action-urgent">
            <p><strong>Следующее действие:</strong> {nextStep.title}</p>
            {actionButton}
          </div>
        ) : (
          <p>
            <strong>Следующее действие:</strong> {nextStep.title} (через {daysUntil} {daysUntil === 1 ? 'день' : 'дня'}, {countdown})
          </p>
        )}
      </>
    );
  };

  return (
    <div className={`bottle-card ${getStatusClass()}`}>
       <div className="card-actions">
        <button onClick={() => onEditBottle(bottle)} className="btn-icon">✏️</button>
        <button onClick={() => onDeleteBottle(bottle.id)} className="btn-icon">🗑️</button>
      </div>
      <div className="bottle-card-header">
        <h3>{bottle.name || 'Без названия'} {bottle.finalVolume && <span className="bottle-volume">({bottle.finalVolume.toFixed(1)} л)</span>}</h3>
      </div>
      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${progressPercentage}%` }}></div>
        <div className="progress-text">День {currentProcessDay} из {totalDays}</div>
      </div>
      <div className={`bottle-status ${status.class}`}>{status.text}</div>
      <div className="bottle-card-body">
        {renderNextAction()}
        <div className="steps-overview">
          {bottle.steps.map(step => (
            <div key={step.day} className={`step ${step.isCompleted ? 'completed' : ''}`}>
              <div className="step-details">
                <span className="step-day"><strong>День {step.day}:</strong> {step.title}</span>
                <span className="step-ingredients">{step.ingredients}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bottle-card-footer">
        <div className="total-ingredients">Начало: {startDate.toLocaleDateString('ru-RU')}</div>
      </div>
    </div>
  );
};

export default BottleCard;
