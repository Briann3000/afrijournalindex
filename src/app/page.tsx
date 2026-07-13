"use client";

import React, { useState, useEffect } from "react";

// Types for translations
type LocalesType = {
  [key: string]: {
    nav: { home: string; browse: string; submit: string; pricing: string; about: string; get_started: string };
    hero: { pre_badge: string; title: string; subtitle: string; cta_submit: string; cta_explore: string; card_title: string; card_if: string; card_grade: string };
    stats: { journals: string; free_indexing: string; languages: string; metrics: string };
    valprop: { title: string; desc: string; indexing_title: string; indexing_text: string; if_title: string; if_text: string; eval_title: string; eval_text: string };
    showcase: { title: string; desc: string };
    cta: { title: string; desc: string; btn: string };
    footer: { desc: string; links_head: string; resources_head: string; methodology: string; contact: string };
  };
};

import { useLang } from "./LangContext";
import Header from "./Header";
import Footer from "./Footer";

export default function Home() {
  const { lang, setLang, t } = useLang();

  return (
    <div className="theme-dark">
      {/* Navigation Bar */}
      <Header activePage="home" />

      <main>
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-bg-patterns"></div>
          <div className="container hero-container">
            <div className="hero-content">
              <div className="badge-featured">{t.hero.pre_badge}</div>
              <h1 className="hero-title">{t.hero.title}</h1>
              <p className="hero-subtitle">{t.hero.subtitle}</p>
              <div className="hero-cta-group">
                <a href="/submit" className="btn btn-primary">{t.hero.cta_submit}</a>
                <a href="/browse" className="btn btn-secondary">{t.hero.cta_explore}</a>
              </div>
            </div>
            
            <div className="hero-visual">
              <div className="glass-card visual-card main-visual-card">
                <div className="visual-header">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
                <div className="visual-body">
                  <div className="metric-highlight">
                    <span className="metric-label">{t.hero.card_title}</span>
                    <div className="metric-row">
                      <div className="metric-item">
                        <div className="metric-value">0.84</div>
                        <div className="metric-name">{t.hero.card_if}</div>
                      </div>
                      <div className="metric-item">
                        <div className="metric-value">A</div>
                        <div className="metric-name">{t.hero.card_grade}</div>
                      </div>
                    </div>
                  </div>
                  <div className="chart-mock">
                    <div className="bar-chart">
                      <div className="bar" style={{ height: "40%" }}></div>
                      <div className="bar" style={{ height: "55%" }}></div>
                      <div className="bar" style={{ height: "75%" }}></div>
                      <div className="bar active" style={{ height: "90%" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Counter Section */}
        <section className="stats-section">
          <div className="container stats-grid">
            <div className="stat-card">
              <div className="stat-num">5</div>
              <div className="stat-label">{t.stats.journals}</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">100%</div>
              <div className="stat-label">{t.stats.free_indexing}</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">5+</div>
              <div className="stat-label">{t.stats.languages}</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">AJIF</div>
              <div className="stat-label">{t.stats.metrics}</div>
            </div>
          </div>
        </section>

        {/* Value Proposition Section */}
        <section className="valprop-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">{t.valprop.title}</h2>
              <p className="section-desc">{t.valprop.desc}</p>
            </div>
            <div className="valprop-grid">
              <div className="glass-card valprop-card">
                <div className="card-icon"><i className="fa-solid fa-folder-open"></i></div>
                <h3 className="card-title">{t.valprop.indexing_title}</h3>
                <p className="card-text">{t.valprop.indexing_text}</p>
              </div>
              <div className="glass-card valprop-card">
                <div className="card-icon"><i className="fa-solid fa-chart-line"></i></div>
                <h3 className="card-title">{t.valprop.if_title}</h3>
                <p className="card-text">{t.valprop.if_text}</p>
              </div>
              <div className="glass-card valprop-card">
                <div className="card-icon"><i className="fa-solid fa-shield-halved"></i></div>
                <h3 className="card-title">{t.valprop.eval_title}</h3>
                <p className="card-text">{t.valprop.eval_text}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Seed Journals Section (KENPRO Showcase) */}
        <section className="journals-showcase-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">{t.showcase.title}</h2>
              <p className="section-desc">{t.showcase.desc}</p>
            </div>
            <div className="journals-grid">
              {/* Journal 1 */}
              <div className="journal-card">
                <div className="journal-meta">
                  <span className="journal-tag">Education</span>
                  <span className="journal-tag">Social Sciences</span>
                </div>
                <h3 className="journal-name">African Research Journal of Education and Social Sciences (ARJESS)</h3>
                <div className="journal-details">
                  <p><strong>ISSN:</strong> 2312-0134</p>
                  <p><strong>Publisher:</strong> Kenya Projects Organization</p>
                  <p><strong>Frequency:</strong> Quarterly</p>
                </div>
                <div className="journal-footer">
                  <a href="https://arjess.org" target="_blank" rel="noopener noreferrer" className="journal-link">
                    arjess.org <i className="fa-solid fa-up-right-from-square"></i>
                  </a>
                  <span className="journal-badge badge-indexed"><i className="fa-solid fa-check-double"></i> Indexed</span>
                </div>
              </div>
              {/* Journal 2 */}
              <div className="journal-card">
                <div className="journal-meta">
                  <span className="journal-tag">Management</span>
                  <span className="journal-tag">Business</span>
                </div>
                <h3 className="journal-name">Journal of Management and Business Administration (JMBA)</h3>
                <div className="journal-details">
                  <p><strong>ISSN:</strong> 2519-0016</p>
                  <p><strong>Publisher:</strong> Kenya Projects Organization</p>
                  <p><strong>Frequency:</strong> Quarterly</p>
                </div>
                <div className="journal-footer">
                  <span className="journal-link-placeholder">kenpro.org</span>
                  <span className="journal-badge badge-indexed"><i className="fa-solid fa-check-double"></i> Indexed</span>
                </div>
              </div>
              {/* Journal 3 */}
              <div className="journal-card">
                <div className="journal-meta">
                  <span className="journal-tag">Environment</span>
                  <span className="journal-tag">Health Sciences</span>
                </div>
                <h3 className="journal-name">International Journal of Environmental and Health Sciences (IJEHS)</h3>
                <div className="journal-details">
                  <p><strong>ISSN:</strong> Pending</p>
                  <p><strong>Publisher:</strong> Kenya Projects Organization</p>
                  <p><strong>Frequency:</strong> Semi-Annually</p>
                </div>
                <div className="journal-footer">
                  <span className="journal-link-placeholder">kenpro.org</span>
                  <span className="journal-badge badge-indexed"><i className="fa-solid fa-check-double"></i> Indexed</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="cta-section">
          <div className="cta-bg-shapes"></div>
          <div className="container cta-container">
            <h2 className="cta-title">{t.cta.title}</h2>
            <p className="cta-text">{t.cta.desc}</p>
            <a href="/submit" className="btn btn-primary btn-lg">{t.cta.btn}</a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
