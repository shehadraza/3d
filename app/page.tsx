
"use client";

import { useEffect, useState } from "react";
import MuseumSection from "@/components/MuseumSection";

type Memory = {
  id: string;
  title: string;
  date?: string;
  description?: string;
  image: string;
  thumbnail?: string;
};

export default function HomePage() {
  const [memories, setMemories] = useState<Memory[]>([]);

  useEffect(() => {
    fetch("/memories.json")
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load memories");
        return response.json();
      })
      .then((data: unknown) => {
        if (Array.isArray(data)) setMemories(data as Memory[]);
      })
      .catch(() => setMemories([]));
  }, []);

  return (
    <main className="site-shell">
      <header className="site-header">
        <a className="brand" href="#home">
          <span className="brand-mark">♥</span>
          <span>Our Little Story</span>
        </a>

        <nav className="nav-links" aria-label="Main navigation">
          <a href="#museum">3D Museum</a>
          <a href="#memories">Memories</a>
          <a href="#letter">A Little Letter</a>
          <a className="nav-cta" href="#museum">Enter our world ↗</a>
        </nav>
      </header>

      <section className="hero" id="home">
        <div className="hero-copy">
          <p className="eyebrow">A LITTLE PLACE MADE OF US</p>
          <h1>Every love story<br />has its <em>own universe.</em></h1>
          <p className="hero-description">
            A tiny world for the moments, the smiles, the silly little things,
            and all the memories that make our story ours.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#museum">Step inside the museum ↗</a>
            <a className="secondary-button" href="#memories">Explore our memories</a>
          </div>
        </div>

        <div className="hero-art">
          <span className="floating-heart heart-one">♥</span>
          <span className="floating-heart heart-two">♥</span>
          <span className="sparkle">✦</span>
          <div className="hero-photo-card">
            <div className="hero-photo-placeholder"><span>♡</span></div>
            <div className="hero-card-caption">little moments, endless love</div>
          </div>
        </div>
      </section>

      <section className="section museum-section" id="museum">
        <div className="section-heading">
          <p className="eyebrow">STEP INTO OUR WORLD</p>
          <h2>Our Little <em>3D Museum</em></h2>
          <p>
            Explore a room filled with memories. Use W, A, S, D or the arrow
            keys to move, then select a photo frame to open it.
          </p>
        </div>
        <MuseumSection />
      </section>

      <section className="section" id="memories">
        <div className="section-heading">
          <p className="eyebrow">THE MOMENTS WE KEEP</p>
          <h2>A collection of <em>little forever moments</em></h2>
          <p>Every picture holds a feeling, and every feeling is part of our story.</p>
        </div>

        {memories.length > 0 ? (
          <div className="memory-grid">
            {memories.map((memory) => (
              <article className="memory-card" key={memory.id}>
                <div className="memory-card-visual">
                  {memory.thumbnail || memory.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={memory.thumbnail || memory.image}
                      alt={memory.title}
                      loading="lazy"
                    />
                  ) : "♡"}
                </div>
                <div className="memory-card-content">
                  <small>{memory.date || "A special memory"}</small>
                  <h3>{memory.title}</h3>
                  <p>{memory.description || "A moment we will always keep close."}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-memories">
            <strong>Your memories will appear here.</strong><br />
            Add photos and captions to <code>public/memories.json</code>.
          </div>
        )}
      </section>

      <section className="section love-note" id="letter">
        <div className="note-card">
          <div className="note-heart">♥</div>
          <p className="eyebrow">A LITTLE NOTE FOR YOU</p>
          <h2>In every version of my story,<br /><em>there is you.</em></h2>
          <p>
            It is the little things that mean the most: the conversations that
            last longer than planned, the smiles we remember later, and the
            hope we keep for all the days still waiting for us. This little
            museum is a reminder that our moments matter.
          </p>
        </div>
      </section>

      <footer className="site-footer">
        <span>Made with love, one memory at a time. ♥</span>
        <span>Our Little Story · A tiny universe of memories</span>
      </footer>
    </main>
  );
}
