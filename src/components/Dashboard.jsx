import React from 'react';
import BottleCard from './BottleCard';

const Dashboard = ({ bottles, onAddBottleClick, ...cardProps }) => {

  // --- Вспомогательная функция для расчета дней до следующего действия ---
  const getDaysUntilNextAction = (bottle) => {
    const nextStep = bottle.steps.find(s => !s.isCompleted);
    if (!nextStep) return Infinity; // Все шаги выполнены

    // --- ЗАЩИТА ОТ НЕВАЛИДНЫХ ДАННЫХ ---
    if (!nextStep.date || isNaN(new Date(nextStep.date).getTime())) {
      return 'invalid_date'; // Возвращаем специальный ключ для группировки
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0); // Сравниваем только даты, без времени
    const nextStepDate = new Date(nextStep.date);
    nextStepDate.setHours(0, 0, 0, 0);

    const diffTime = nextStepDate - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // --- Группировка бутылей по дням ---
  const groupedBottles = bottles.reduce((acc, bottle) => {
    if (bottle.isArchived) {
      acc.archived.push(bottle);
      return acc;
    }

    const days = getDaysUntilNextAction(bottle);

    if (days === Infinity) {
      acc.completed.push(bottle);
    } else if (days === 'invalid_date') {
      acc.error.push(bottle);
    } else if (days <= 0) { // --- ИСПРАВЛЕНИЕ: Группируем все просроченные и сегодняшние задачи вместе
      if (!acc.active.today) {
        acc.active.today = [];
      }
      acc.active.today.push(bottle);
    } else {
      if (!acc.active[days]) {
        acc.active[days] = [];
      }
      acc.active[days].push(bottle);
    }
    return acc;
  }, { active: {}, completed: [], archived: [], error: [] });

  // --- Функция для склонения слова "день" ---
  const getDayNounPluralForm = (number) => {
    const n = Math.abs(number);
    const lastDigit = n % 10;
    const lastTwoDigits = n % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
      return 'дней';
    }
    if (lastDigit === 1) {
      return 'день';
    }
    if ([2, 3, 4].includes(lastDigit)) {
      return 'дня';
    }
    return 'дней';
  };

  // --- Вспомогательная функция для заголовков групп ---
  const getGroupTitle = (daysKey) => {
    if (daysKey === 'today') return "Сегодня";
    const dayNum = parseInt(daysKey, 10);
    if (dayNum === 1) return "Завтра";
    return `Через ${dayNum} ${getDayNounPluralForm(dayNum)}`;
  };

  // --- Вспомогательный компонент для рендера группы ---
  const BottleGroup = ({ title, groupBottles, alwaysShow = false, isToday = false }) => {
    if (!alwaysShow && (!groupBottles || groupBottles.length === 0)) return null;
    return (
      <div className="bottle-group">
        <h2>{title} ({groupBottles ? groupBottles.length : 0})</h2>
        <div className="cards-container">
          {groupBottles && groupBottles.length > 0 ? (
            groupBottles.map(bottle => (
              <BottleCard key={bottle.id} bottle={bottle} {...cardProps} isToday={isToday} />
            ))
          ) : (
            <p className="empty-group-message">Нет задач на завтра.</p>
          )}
        </div>
      </div>
    );
  };

  const sortedActiveKeys = Object.keys(groupedBottles.active).sort((a, b) => a - b);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Панель винодела</h1>
        <button onClick={onAddBottleClick} className="add-bottle-btn">+ Добавить бутыль</button>
      </div>

      <div className="main-content">
        {sortedActiveKeys.length === 0 && groupedBottles.completed.length === 0 ? (
           <div className="empty-state">
            <p>У вас пока нет активных бутылей. Нажмите "Добавить", чтобы начать.</p>
          </div>
        ) : (
          <>
            {/* Группа "Сегодня" */}
            {groupedBottles.active.today && (
              <BottleGroup 
                title="Сегодня" 
                groupBottles={groupedBottles.active.today} 
                isToday={true}
              />
            )}

            {/* Группа "Завтра" - отображается всегда */}
            <BottleGroup 
              title="Завтра" 
              groupBottles={groupedBottles.active['1']} 
              alwaysShow={true} 
            />

            {/* Остальные будущие группы */}
            {sortedActiveKeys
              .filter(day => day !== 'today' && parseInt(day, 10) > 1)
              .map(day => (
                <BottleGroup 
                  key={day} 
                  title={getGroupTitle(day)} 
                  groupBottles={groupedBottles.active[day]} 
                />
              ))}
          </>
        )}
        
        <BottleGroup title="Завершенные" groupBottles={groupedBottles.completed} />
        <BottleGroup title="Ошибка данных (нет даты у шага)" groupBottles={groupedBottles.error} />
        <BottleGroup title="Архив" groupBottles={groupedBottles.archived} />
      </div>
    </div>
  );
};

export default Dashboard;
