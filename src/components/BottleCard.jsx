import React from 'react';
import { Button } from './ui/button';
import { Pencil } from 'lucide-react';

const BottleCard = ({ bottle, onUpdateStep, onEditBottle }) => {
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

  return (
    <div className={`bottle-card ${getStatusClass()}`}>
      <div className="card-main-content">
        <div className="bottle-card-header">
          <h3 className="bottle-title">
            {bottle.name || 'Без названия'}
            {bottle.finalVolume && <span className="bottle-volume">({bottle.finalVolume.toFixed(1)} л)</span>}
          </h3>
          <p className="start-date">{formattedStartDate}</p>
        </div>

        <div className="bottle-steps">
          {bottle.steps.map((step) => (
            <div key={step.day} className={`step ${step.isCompleted ? 'completed' : ''}`}>
              <span><strong>День {step.day}:</strong> {step.title}</span>
              {!step.isCompleted && nextStep && step.day === nextStep.day && (
                 <Button 
                    size="sm"
                    onClick={() => onUpdateStep(bottle.id, step.day)} 
                    className="btn-complete-step"
                  >
                    Выполнено
                  </Button>
              )}
            </div>
          ))}
        </div>

        {bottle.notes && (
            <div className="bottle-notes">
                <p><strong>Примечания:</strong> {bottle.notes}</p>
            </div>
        )}

      </div>

      <div className="card-actions">
        <Button variant="ghost" size="icon" onClick={() => onEditBottle(bottle)}>
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default BottleCard;
