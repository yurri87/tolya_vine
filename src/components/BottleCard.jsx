import React, { useState } from 'react';
import './BottleCard.css';
import { Button } from './ui/button';
import { Pencil } from 'lucide-react';

const BottleCard = ({ bottle, onUpdateStep, onEditBottle, isToday }) => {
  const [forceShowButton, setForceShowButton] = useState(false);
  const startDate = new Date(bottle.startDate);
  const formattedStartDate = startDate.toLocaleDateString('ru-RU');

  const nextStep = bottle.steps.find(s => !s.isCompleted);
  const allStepsCompleted = !nextStep;

  const getStatusClass = () => {
    if (allStepsCompleted) return 'status-completed';
    const nextStepDate = new Date(nextStep.date);
    if (nextStepDate <= new Date()) return 'status-action-required';
    return 'status-in-progress';
  };

  const today = new Date();
  const daysPassed = Math.max(0, Math.floor((today - startDate) / (1000 * 60 * 60 * 24)));
  const lastStepDay = bottle.steps.length > 0 ? Math.max(...bottle.steps.map(s => s.day)) : 1;

  let progress = 0;
  if (allStepsCompleted) {
    progress = 100;
  } else if (lastStepDay > 0) {
    progress = Math.min(100, (daysPassed / lastStepDay) * 100);
  }

  return (
    <div 
      className={`bottle-card ${getStatusClass()}`}
      onDoubleClick={() => setForceShowButton(true)}
    >
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
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
              <div className="step-title">{step.ingredients}</div>
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

        {bottle.notes && (
            <div className="bottle-notes">
                <p><strong>Примечания:</strong> {bottle.notes}</p>
            </div>
        )}

      </div>


    </div>
  );
};

export default BottleCard;
