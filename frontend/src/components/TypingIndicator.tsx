const TypingIndicator = () => {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="bg-gradient-to-br from-card to-secondary rounded-bubble rounded-bl-md px-4 py-3 shadow-bubble border border-border/30">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-primary/60 rounded-full typing-dot" />
          <span className="w-2 h-2 bg-primary/60 rounded-full typing-dot" />
          <span className="w-2 h-2 bg-primary/60 rounded-full typing-dot" />
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
