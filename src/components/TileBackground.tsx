const TileBackground = () => {
  return (
    <div 
      className="fixed inset-0 tile-pattern opacity-30 z-0" 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.3,
        zIndex: 0,
        backgroundColor: '#fafafa',
        backgroundImage: 'linear-gradient(to right, #d6e8ed 1px, transparent 1px), linear-gradient(to bottom, #d6e8ed 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }}
    />
  );
};

export default TileBackground;
