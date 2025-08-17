import React from 'react';
import BottleCard from './BottleCard';

const Dashboard = ({ bottles, onAddBottleClick, ...cardProps }) => {

  // Helper function to calculate days until the next action for a bottle
  const getDaysUntilNextAction = (bottle) => {
    const nextStep = bottle.steps.find(s => !s.isCompleted);
    if (!nextStep) return Infinity; // All steps completed, send to the end

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const nextStepDate = new Date(nextStep.date);
    nextStepDate.setHours(0, 0, 0, 0);

    const diffTime = nextStepDate - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Group bottles by days until next action
  const groupedBottles = bottles.reduce((acc, bottle) => {
    const days = getDaysUntilNextAction(bottle);
    if (days === Infinity) return acc; // Don't show completed bottles in the main list

    if (!acc[days]) {
      acc[days] = [];
    }
    acc[days].push(bottle);
    return acc;
  }, {});

  const todaysBottles = groupedBottles[0] || [];

  // Generate dynamic title for today's tasks
  const getTodaySummaryTitle = () => {
    if (todaysBottles.length === 0) return "Сегодня дел нет";

    const tasks = todaysBottles.map(b => b.steps.find(s => !s.isCompleted));
    const prepCount = tasks.filter(t => t.day === 1).length;
    const addCount = tasks.length - prepCount;

    let summary = "Сегодня: ";
    const parts = [];
    if (prepCount > 0) parts.push(`${prepCount} подготовки сусла`);
    if (addCount > 0) parts.push(`${addCount} добавление`);
    summary += parts.join(', ');

    return summary;
  };

  // Generate title for future groups
  const getFutureGroupTitle = (days) => {
    if (days === 1) return "Завтра";
    return `Через ${days} дней`;
  };

  // Calculate total sugar needed for today
  const sugarSummary = todaysBottles.reduce((acc, bottle) => {
    const todayStep = bottle.steps.find(s => getDaysUntilNextAction(bottle) === 0 && !s.isCompleted);
    if (todayStep) {
      const sugarMatch = todayStep.ingredients.match(/(\d*\.?\d+)\s*г\s*сахара/);
      if (sugarMatch) {
        acc.сахар = (acc.сахар || 0) + parseFloat(sugarMatch[1]);
      }
    }
    return acc;
  }, { сахар: 0 });

  // Helper component to render a group of bottles
  const renderBottleGroup = (groupBottles, title) => {
    if (groupBottles.length === 0) return null;
    return (
        <div className="bottle-group">
            <h2>{title}</h2>
            {groupBottles.map(bottle => <BottleCard key={bottle.id} bottle={bottle} {...cardProps} />)}
        </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Панель винодела</h1>
        <button onClick={onAddBottleClick} className="btn-primary">+ Добавить бутыль</button>
      </div>

      <div className="main-content">
        <div className="bottles-list">
          {/* Render Today's group first */}
          {renderBottleGroup(todaysBottles, getTodaySummaryTitle())}
          
          {/* Render future groups, sorted by day */}
          {Object.keys(groupedBottles).sort((a, b) => a - b).map(day => {
            const dayNum = parseInt(day, 10);
            if (dayNum <= 0) return null; // Skip today and past, as they are handled above
            // Add a unique key for each group
            return <div key={day}>{renderBottleGroup(groupedBottles[dayNum], getFutureGroupTitle(dayNum))}</div>;
          })}

          {bottles.length === 0 && <p className="no-tasks-message">У вас пока нет активных бутылей. Нажмите "Добавить", чтобы начать.</p>}
        </div>

        {sugarSummary.сахар > 0 && (
          <div className="summary-section">
            <h3>Еще потребуется сахара</h3>
            <ul>
              <li>{sugarSummary.сахар.toFixed(0)} г</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;