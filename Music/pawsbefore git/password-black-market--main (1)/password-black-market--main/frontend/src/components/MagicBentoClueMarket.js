import { useEffect, useRef } from "react";
import gsap from "gsap";
import "./MagicBentoClueMarket.css";

function MagicBentoCard({ account, onBuy, buyingClues }) {
  const cardRef = useRef(null);
  const clueList = Array.isArray(account?.clues) ? account.clues : [];

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return undefined;

    const rotateXTo = gsap.quickTo(card, "rotationX", { duration: 0.25, ease: "power2.out" });
    const rotateYTo = gsap.quickTo(card, "rotationY", { duration: 0.25, ease: "power2.out" });
    const bgXTo = gsap.quickTo(card, "--mx", { duration: 0.2, ease: "power2.out" });
    const bgYTo = gsap.quickTo(card, "--my", { duration: 0.2, ease: "power2.out" });

    const onMove = (event) => {
      const bounds = card.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      const px = x / bounds.width;
      const py = y / bounds.height;

      const rotateY = (px - 0.5) * 10;
      const rotateX = (0.5 - py) * 10;

      rotateXTo(rotateX);
      rotateYTo(rotateY);
      bgXTo(x);
      bgYTo(y);
    };

    const onLeave = () => {
      rotateXTo(0);
      rotateYTo(0);
    };

    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerleave", onLeave);

    return () => {
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <article ref={cardRef} className="magic-bento-card">
      <header className="magic-bento-header">
        <h3>{account.username}</h3>
        <span className="magic-bento-difficulty">{String(account.difficulty || "easy").toUpperCase()}</span>
      </header>

      <div className="magic-bento-clues">
        {clueList.map((clue, index) => {
          const isFree = clue.cost === 0;
          const loadingKey = `${account.accountId}:${clue.clueId}`;
          const isLoading = Boolean(buyingClues[loadingKey]);

          return (
            <div key={clue.clueId} className="magic-bento-clue-item">
              <div className="magic-bento-clue-top">
                <span className={`magic-bento-chip ${isFree ? "free" : "paid"}`}>
                  Clue {index + 1}{isFree ? " • FREE" : ""}
                </span>

                {!clue.unlocked ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => onBuy(account, clue.clueId)}
                    disabled={isLoading}
                  >
                    {isLoading ? "Processing..." : isFree ? "View" : `Buy (${clue.cost})`}
                  </button>
                ) : (
                  <span className="magic-bento-state">{clue.fake ? "Injected" : "Unlocked"}</span>
                )}
              </div>

              <p>{clue.unlocked ? clue.text : "Hidden until purchased"}</p>
            </div>
          );
        })}
      </div>
    </article>
  );
}

export default function MagicBentoClueMarket({ accounts, onBuy, buyingClues }) {
  return (
    <section className="magic-bento-grid">
      {accounts.map((account) => (
        <MagicBentoCard
          key={account.accountId}
          account={account}
          onBuy={onBuy}
          buyingClues={buyingClues}
        />
      ))}
    </section>
  );
}
