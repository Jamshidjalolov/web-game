function QuizBattleBackdrop() {
  return (
    <div className="quizbattle-backdrop pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="quizbattle-backdrop-mesh" />
      <div className="quizbattle-backdrop-beam quizbattle-backdrop-beam-a" />
      <div className="quizbattle-backdrop-beam quizbattle-backdrop-beam-b" />
      <div className="quizbattle-backdrop-ribbon quizbattle-backdrop-ribbon-a" />
      <div className="quizbattle-backdrop-ribbon quizbattle-backdrop-ribbon-b" />
      <div className="quizbattle-backdrop-orb quizbattle-backdrop-orb-a" />
      <div className="quizbattle-backdrop-orb quizbattle-backdrop-orb-b" />
      <div className="quizbattle-backdrop-orb quizbattle-backdrop-orb-c" />
      <div className="quizbattle-backdrop-ring quizbattle-backdrop-ring-a" />
      <div className="quizbattle-backdrop-ring quizbattle-backdrop-ring-b" />
      <div className="quizbattle-backdrop-floor" />
      {Array.from({ length: 10 }).map((_, index) => (
        <span
          key={`quizbattle-spark-${index}`}
          className={`quizbattle-backdrop-spark quizbattle-backdrop-spark-${index + 1}`}
        />
      ))}
    </div>
  )
}

export default QuizBattleBackdrop
