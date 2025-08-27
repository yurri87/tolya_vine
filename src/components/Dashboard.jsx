import React, { useEffect, useState } from 'react';
import BottleCard from './BottleCard';

const Dashboard = ({ bottles, highlightId, onAddBottleClick, ...cardProps }) => {

  // --- Вспомогательная функция: точный расчет до следующего действия ---
  // Возвращает:
  //  - 'invalid_date' для битых дат
  //  - Infinity если все шаги выполнены
  //  - целое количество дней (0 = сегодня, 1 = завтра, 2+ = будущее)
  const getDaysUntilNextAction = (bottle) => {
    const nextStep = bottle.steps.find(s => !s.isCompleted);
    if (!nextStep) return Infinity; // Все шаги выполнены

    if (!nextStep.date) return 'invalid_date';
    const nextTs = new Date(nextStep.date).getTime();
    if (isNaN(nextTs)) return 'invalid_date';

    const nowTs = Date.now();
    const diffMs = nextTs - nowTs;
    if (diffMs <= 0) return 0; // Просрочено или сегодня — считаем как "сегодня"

    const dayMs = 24 * 60 * 60 * 1000;
    return Math.floor(diffMs / dayMs);
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

  // --- Таймер для обновления счетчиков раз в 30 сек ---
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 30 * 1000);
    return () => clearInterval(id);
  }, []);

  // --- Форматирование разницы как HH:MM ---
  const formatHm = (diffMs) => {
    if (diffMs == null) return '';
    const totalMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${String(minutes).padStart(2, '0')}`;
  };

  // --- Расчет ближайшего события в группе ---
  const getGroupCountdownLabel = (groupBottles) => {
    if (!groupBottles || groupBottles.length === 0) return '';
    let nearestTs = null;
    const now = Date.now();
    for (const b of groupBottles) {
      const step = b.steps.find(s => !s.isCompleted);
      if (!step || !step.date) continue;
      const ts = new Date(step.date).getTime();
      if (!isNaN(ts)) {
        if (nearestTs === null || ts < nearestTs) nearestTs = ts;
      }
    }
    if (nearestTs == null) return '';
    const diffMs = nearestTs - now;
    // Если просрочено, показываем 0:00
    return formatHm(diffMs);
  };

  // --- Вспомогательный компонент для рендера группы ---
  const BottleGroup = ({ title, groupBottles, alwaysShow = false, isToday = false }) => {
    if (!alwaysShow && (!groupBottles || groupBottles.length === 0)) return null;
    return (
      <div className="bottle-group">
        <h2>
          {title} ({groupBottles ? groupBottles.length : 0})
        </h2>
        <div className="cards-container">
          {groupBottles && groupBottles.length > 0 ? (
            groupBottles.map(bottle => (
              <BottleCard key={bottle.id} bottle={bottle} highlightId={highlightId} {...cardProps} isToday={isToday} />
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
