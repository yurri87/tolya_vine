import React from 'react';
import BottleCard from './BottleCard';

const Dashboard = ({ bottles, onAddBottleClick, ...cardProps }) => {

  // --- Группировка и сортировка --- 
  const activeBottles = bottles.filter(b => !b.isArchived);
  const archivedBottles = bottles.filter(b => b.isArchived);

  // --- Вспомогательный компонент для рендера группы ---
  const BottleGroup = ({ title, groupBottles }) => {
    if (groupBottles.length === 0) return null;
    return (
      <div className="bottle-group">
        <h2>{title}</h2>
        <div className="cards-container">
          {groupBottles.map(bottle => (
            <BottleCard 
              key={bottle.id} 
              bottle={bottle} 
              {...cardProps} // Передаем все остальные пропсы (onUpdateStep, onDeleteBottle и т.д.)
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Панель винодела</h1>
        <button onClick={onAddBottleClick} className="add-bottle-btn">+ Добавить бутыль</button>
      </div>

      <div className="main-content">
        {activeBottles.length > 0 ? (
          <BottleGroup title="Активные" groupBottles={activeBottles} />
        ) : (
          <div className="empty-state">
            <p>У вас пока нет активных бутылей. Нажмите "Добавить", чтобы начать.</p>
          </div>
        )}

        <BottleGroup title="Архив" groupBottles={archivedBottles} />
      </div>
    </div>
  );
};

export default Dashboard;
