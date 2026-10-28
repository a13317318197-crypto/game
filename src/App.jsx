import React, { useEffect, useRef, useState } from 'react';
import { profile, projects, categories, strengths } from './content';
import RotatingPortrait from './RotatingPortrait';
import LifeGallery from './LifeGallery';
import HeroShards from './HeroShards';

function Arrow({ diagonal = false, className = '' }) {
  return <svg className={'arrow ' + className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d={diagonal ? 'M5 19 19 5M5 5h14v14' : 'M4 12h15m-6-6 6 6-6 6'} stroke="currentColor" strokeWidth="1.35" />
  </svg>;
}

function Seal({ className = '' }) {
  return <span className={'seal ' + className} aria-hidden="true">浩<br />轩</span>;
}

function CapabilityIcon({ type }) {
  return <svg className={'capability-icon icon-' + type} viewBox="0 0 100 100" fill="none" aria-hidden="true">
    {type === 'visual' && <><circle cx="50" cy="50" r="33" stroke="currentColor" /><ellipse cx="50" cy="50" rx="18" ry="33" stroke="currentColor" /><path d="M17 50h66M50 17v66" stroke="currentColor" strokeOpacity=".45" /></>}
    {type === 'ai' && <>{[0, 45, 90, 135].map(r => <ellipse key={r} cx="50" cy="50" rx="15" ry="36" stroke="currentColor" transform={'rotate(' + r + ' 50 50)'} />)}<circle cx="50" cy="50" r="4" fill="currentColor" /></>}
    {type === 'strength' && <><path d="M16 62 35 22l15 28 15-28 19 40-34 20Z" stroke="currentColor" /><path d="M16 62h68M35 22v40l15 20 15-20V22" stroke="currentColor" strokeOpacity=".5" /></>}
    {type === 'connect' && <><circle cx="36" cy="50" r="25" stroke="currentColor" /><circle cx="64" cy="50" r="25" stroke="currentColor" /><path d="M10 50h80M50 12v76" stroke="currentColor" strokeOpacity=".4" /></>}
  </svg>;
}

function FeaturedProject({ project, index, total, onOpen }) {
  const position = String(index + 1).padStart(2, '0');
  const projectId = 'project-' + project.id;
  const panelId = projectId + '-content';
  const [expanded, setExpanded] = useState(() => window.location.hash === '#' + projectId);
  const toggleRef = useRef(null);

  useEffect(() => {
    function expandLinkedProject() {
      if (window.location.hash === '#' + projectId) setExpanded(true);
    }
    window.addEventListener('hashchange', expandLinkedProject);
    return () => window.removeEventListener('hashchange', expandLinkedProject);
  }, [projectId]);

  function collapseProject() {
    setExpanded(false);
    requestAnimationFrame(() => toggleRef.current?.focus());
  }

  return <article className={'featured-project' + (expanded ? ' is-expanded' : '')} id={projectId} data-reveal>
    <button ref={toggleRef} type="button" className="featured-summary" aria-expanded={expanded} aria-controls={panelId}
      aria-label={(expanded ? '收起' : '展开') + project.name + '作品'} onClick={() => setExpanded(value => !value)}>
      <img className="featured-summary-thumbnail" src={project.thumbnail || project.image} alt="" loading="lazy" width="256" height="256" />
      <span className="featured-summary-copy">
        <span className="featured-summary-meta">{position} / {String(total).padStart(2, '0')}<i />{project.badge}</span>
        <span className="featured-summary-title">{project.name}</span>
        <span className="featured-summary-subtitle">{project.subtitle}</span>
      </span>
      <span className="featured-summary-action"><span>{expanded ? '收起作品' : '展开作品'}</span><span className="featured-summary-icon" aria-hidden="true">+</span></span>
    </button>
    <div className="featured-content" id={panelId} hidden={!expanded} role="region" aria-label={project.name + '作品内容'}>
      <button className="featured-image-button" onClick={event => onOpen(project, event)} aria-label={'查看' + project.name + '项目详情'}>
        <img src={project.image} alt={project.imageAlt} loading="lazy" width="2048" height="2048" />
        <span className="image-corner image-corner-top">{project.badge}<span>{position} / {String(total).padStart(2, '0')}</span></span>
        <span className="image-view"><Arrow diagonal />查看完整画面</span>
      </button>
      <div className="featured-copy">
        <span className="eyebrow">{position} — A PERSONAL EXPLORATION</span>
        <div className="featured-title"><h3>{project.name}</h3><span>{project.englishName}</span></div>
        <p className="featured-quote">“{project.quote[0]}<br />{project.quote[1]}”</p>
        <p className="featured-description">{project.description}</p>
        <dl className="project-facts">{project.facts.map(fact => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
        <button className="text-link" onClick={event => onOpen(project, event)}>{project.detailsLabel || '查看创作思路'} <Arrow diagonal /></button>
        <div className="featured-bottom"><span>IMAGINATION, WITH INTENTION.</span><button type="button" className="featured-collapse" onClick={collapseProject}>收起作品 ↑</button><Seal /></div>
      </div>
    </div>
  </article>;
}

function ExperimentCard({ project, onOpen }) {
  return <article className="experiment-card" data-reveal>
    <button className="project-open" onClick={event => onOpen(project, event)} aria-label={'查看' + project.name + '项目详情'}>
      <div className="project-visual"><img src={project.image} alt={project.imageAlt} loading="lazy" /><span className="concept-badge">{project.badge}</span><span className="project-hover-arrow"><Arrow diagonal /></span></div>
      <div className="project-meta"><div><span className="eyebrow">{project.discipline}</span><h3>{project.name}</h3><p>{project.subtitle}</p></div><Arrow diagonal /></div>
      <div className="project-foot"><span>{project.type}</span><span>{project.year}</span></div>
    </button>
  </article>;
}

export default function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState('精选作品');
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const [paused, setPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [reduceMotion, setReduceMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const progressRef = useRef(null);
  const visibleProjects = projects.filter(project => project.category === filter);

  useEffect(() => {
    // Vite renders after the browser first resolves the URL fragment.
    const section = document.getElementById(window.location.hash.slice(1));
    if (!section) return;
    const frame = requestAnimationFrame(() => section.scrollIntoView({ behavior: 'instant', block: 'start' }));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    function updateMotion(event) {
      setReduceMotion(event.matches);
      if (event.matches) setPaused(true);
    }
    motion.addEventListener('change', updateMotion);
    let frame = 0;
    function updateScroll() {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 50);
        const max = document.documentElement.scrollHeight - innerHeight;
        if (progressRef.current) progressRef.current.style.width = (max > 0 ? window.scrollY / max * 100 : 0) + '%';
        frame = 0;
      });
    }
    window.addEventListener('scroll', updateScroll, { passive: true });
    updateScroll();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) setActiveSection(entry.target.id); });
    }, { rootMargin: '-12% 0px -60% 0px' });
    document.querySelectorAll('main > section[id]').forEach(section => observer.observe(section));
    return () => {
      observer.disconnect();
      motion.removeEventListener('change', updateMotion);
      window.removeEventListener('scroll', updateScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05 });
    document.querySelectorAll('[data-reveal]').forEach(element => {
      element.classList.add('will-reveal');
      observer.observe(element);
    });
    return () => observer.disconnect();
  }, [filter, reduceMotion]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (modal && !dialog.open) dialog.showModal();
    if (!modal && dialog.open) dialog.close();
    document.body.style.overflow = modal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modal]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  function openProject(project, event) {
    openerRef.current = event.currentTarget;
    setModal({ type: 'project', project });
  }

  function openContact(event) {
    if (event?.currentTarget) openerRef.current = event.currentTarget;
    setModal({ type: 'contact' });
  }

  function closeModal() {
    dialogRef.current?.close();
    setModal(null);
  }

  function onDialogClose() {
    setModal(null);
    requestAnimationFrame(() => openerRef.current?.focus({ preventScroll: true }));
  }

  async function copyContact(value, label) {
    const activeElement = document.activeElement;
    const field = document.createElement('textarea');
    field.value = value;
    field.setAttribute('readonly', '');
    field.setAttribute('aria-label', '待复制的联系号码');
    field.style.cssText = 'position:fixed;left:-9999px;top:0;font-size:16px;';
    const host = dialogRef.current?.open ? dialogRef.current : document.body;
    host.appendChild(field);
    field.select();
    field.setSelectionRange(0, value.length);
    let copied = false;
    try { copied = document.execCommand('copy'); } catch { /* Use the clipboard API below. */ }
    field.remove();
    activeElement?.focus({ preventScroll: true });
    if (copied) {
      setToast(label + '已复制');
      return;
    }
    try {
      await Promise.race([
        navigator.clipboard.writeText(value),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Clipboard timeout')), 1500)),
      ]);
      setToast(label + '已复制');
    } catch {
      setToast('请长按或选中号码，手动复制');
    }
  }

  function toggleMotion() { setPaused(value => !value); }

  function navigate() { setMenuOpen(false); }

  const navItems = [
    { id: 'work', name: '视觉作品', number: '01' },
    { id: 'about', name: '关于我', number: '02' },
    { id: 'expertise', name: '我的侧面', number: '03' },
  ];

  return <>
    <a className="skip-link" href="#work">跳转到主要内容</a>
    <div className="reading-progress" ref={progressRef} aria-hidden="true" />
    <header className={'site-header ' + (scrolled || menuOpen ? 'is-scrolled' : '')}>
      <div className="container nav-inner">
        <a className="wordmark" href="#home" aria-label="丁浩轩，返回首页" onClick={navigate}>DHX<span className="wordmark-dot" /><span className="wordmark-name">丁浩轩</span></a>
        <nav className={'main-nav ' + (menuOpen ? 'is-open' : '')} aria-label="主导航">
          {navItems.map(item => <a key={item.id} className={activeSection === item.id ? 'active' : ''} href={'#' + item.id} aria-current={activeSection === item.id ? 'location' : undefined} onClick={navigate}><span>{item.number}</span>{item.name}</a>)}
          <a className="mobile-contact" href="#contact" onClick={navigate}><span>04</span>联系我</a>
        </nav>
        <a className="nav-contact" href="#contact" onClick={navigate}>联系我 <Arrow diagonal /></a>
        <button className={'menu-toggle ' + (menuOpen ? 'is-open' : '')} aria-label={menuOpen ? '关闭导航' : '打开导航'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><span /><span /></button>
      </div>
    </header>

    <main>
      <section className="hero" id="home" aria-labelledby="hero-title">
        <HeroShards paused={paused} reduceMotion={reduceMotion} />
        <div className="hero-portrait" aria-hidden="true"><img src={profile.portrait} alt="" fetchPriority="high" width="1600" height="2400" /><span className="portrait-caption">PORTRAIT / DING HAOXUAN</span></div>
        <div className="hero-grain" aria-hidden="true" />
        <div className="container hero-inner">
          <div className="hero-edition"><span className="status-dot" />PERSONAL PORTFOLIO<span className="hero-edition-year">VOL. 01 — 2026</span></div>
          <div className="hero-title-block"><span className="hero-name-cn">丁浩轩 / 视觉、力量与表达</span><h1 id="hero-title">DING<span>HAOXUAN<span className="hero-name-period">.</span></span></h1><span className="hero-title-note">A FACE. A VISION. A DIFFERENT SIDE.</span></div>
          <div className="hero-copy"><div><p>形于外，<span>韧于心。</span></p><span className="hero-description">在东方意境里寻找表达，在每一次练习中靠近自己。</span></div><a className="round-link" href="#work" aria-label="探索我的作品"><Arrow diagonal /></a></div>
          <div className="hero-bottom"><a className="scroll-link" href="#work"><span>↓</span>SCROLL TO DISCOVER</a><div className="hero-disciplines">AI VISUALS <i /> MARTIAL ARTS <i /> PERSONAL EXPRESSION</div><button className="video-toggle" onClick={toggleMotion} disabled={reduceMotion} aria-label={paused ? '播放背景动画' : '暂停背景动画'}><span className={paused ? 'play-symbol' : 'pause-symbol'} />{paused ? 'PLAY' : 'PAUSE'} MOTION</button></div>
        </div>
        <div className="hero-vertical-label" aria-hidden="true">QUIET OUTSIDE. RESILIENT WITHIN.</div>
      </section>

      <div className="identity-strip"><div className="container"><span>以自己的方式，<em>被看见。</em></span><span>VISUALS · STRENGTH · EXPRESSION <span className="strip-asterisk">✳</span></span></div></div>

      <section className="work section" id="work" aria-labelledby="work-title">
        <div className="container">
          <div className="section-top" data-reveal><span className="section-kicker"><span>01 /</span> SELECTED VISIONS</span><span className="section-aside">想象有形，情绪有声。</span></div>
          <div className="section-heading work-heading" data-reveal><h2 id="work-title">在天地之间，<br /><span className="heading-soft">留下自己的表达。</span></h2><div><p>古风的优雅，山水的辽阔。<br />还有一个渺小、却始终向前的人。</p><span className="eyebrow">PERSONAL VISION / ONGOING EXPLORATION</span></div></div>
          <div className="filter-bar" data-reveal><div className="filter-buttons" aria-label="作品分类">{categories.map(category => <button key={category} className={'filter-button ' + (filter === category ? 'is-active' : '')} onClick={() => setFilter(category)} aria-pressed={filter === category}>{category}<sup>{String(projects.filter(project => project.category === category).length).padStart(2, '0')}</sup></button>)}</div><span className="filter-description" aria-live="polite">{filter === '精选作品' ? '个人作品 · 从想法到画面' : '概念提案 · 图形、品牌与空间'}</span></div>
          <div className={filter === '精选作品' ? 'featured-gallery' : 'experiment-grid'}>{visibleProjects.map((project, index) => filter === '精选作品' ? <FeaturedProject key={project.id} project={project} index={index} total={visibleProjects.length} onOpen={openProject} /> : <ExperimentCard key={project.id} project={project} onOpen={openProject} />)}</div>
          <div className="work-end" data-reveal><span>“天地很大，仍向前。”</span><a className="text-link" href="#about">画面之后，认识我 <Arrow diagonal /></a></div>
        </div>
      </section>

      <section className="about section" id="about" aria-labelledby="about-title">
        <div className="container">
          <div className="section-top" data-reveal><span className="section-kicker"><span>02 /</span> MORE THAN A FIRST IMPRESSION</span><span className="section-aside">每一面，都有自己的故事。</span></div>
          <div className="about-grid">
            <RotatingPortrait src={profile.portrait} reduceMotion={reduceMotion} />
            <div className="about-content" data-reveal><span className="eyebrow">HELLO, I'M DING HAOXUAN.</span><h2 id="about-title">安静的外表，<br /><span className="heading-soft">不止一种可能。</span></h2><div className="role-tags">{profile.roles.map(role => <span key={role}>{role}</span>)}</div><p className="about-bio">{profile.bio}</p><p className="about-note">在创作里感受，在训练里积累。<br />也愿意让每一段经历，成为认识自己的另一种方式。</p><div className="about-links"><a className="text-link" href="#expertise">看看我的不同侧面 <Arrow diagonal /></a><button className="text-link" onClick={openContact}>与我聊聊 <Arrow diagonal /></button></div><div className="about-stats">{profile.stats.map(stat => <div key={stat.label}><strong>{stat.value}<small>{stat.unit}</small></strong><span>{stat.label}</span></div>)}</div></div>
          </div>


          <div className="experience-block" data-reveal><div className="experience-heading"><span className="eyebrow">THOUGHTS INTO WORDS</span><h3>写下思考，<br />走进真实的生活。</h3><div className="publication-note"><span>发表与研究</span>{profile.publications.map(publication => <p key={publication}><i />{publication}</p>)}<div className="research-tags">{profile.researchTopics.map(topic => <span key={topic}>{topic}</span>)}</div></div></div><div className="experience-list">{profile.experiences.map(experience => <article className="experience-row" key={experience.category}><span className="eyebrow">{experience.category}</span><div><h4>{experience.title}</h4><p>{experience.detail}</p></div><span className="experience-date">{experience.date}</span></article>)}</div></div>
          <LifeGallery reduceMotion={reduceMotion} />
        </div>
      </section>

      <section className="expertise section" id="expertise" aria-labelledby="expertise-title"><div className="container"><div className="section-top" data-reveal><span className="section-kicker"><span>03 /</span> DIFFERENT SIDES, ONE PERSON</span><span className="section-aside">慢慢了解，慢慢发现。</span></div><div className="section-heading expertise-heading" data-reveal><h2 id="expertise-title">让每一面，<br /><span className="heading-soft">都有自己的分量。</span></h2><p>审美、想象、身体与表达。<br />不同的经历，慢慢组成今天的我。</p></div><div className="strength-grid">{strengths.map(strength => <article className="strength-card" key={strength.number} data-reveal><div className="strength-top"><span>{strength.number} /</span><Arrow diagonal /></div><CapabilityIcon type={strength.icon} /><span className="strength-english">{strength.english}</span><h3>{strength.title}</h3><p>{strength.description}</p><div className="strength-tags">{strength.tags.map(tag => <span key={tag}>{tag}</span>)}</div></article>)}</div><div className="design-principle" data-reveal><Seal /><p>保持感受，也保持行动。</p><span>ALWAYS BECOMING.</span></div></div></section>

      <section className="contact" id="contact" aria-labelledby="contact-title"><div className="container contact-inner"><div className="section-top" data-reveal><span className="section-kicker"><span>04 /</span> THE NEXT CONVERSATION</span><span className="contact-availability"><span className="status-dot" />OPEN TO NEW CONNECTIONS</span></div><div className="contact-main" data-reveal><span className="contact-intro">相识，从一句「你好」开始。</span><div className="contact-title-row"><h2 id="contact-title">LET'S<br /><em>CONNECT.</em></h2><button className="contact-circle" onClick={openContact} aria-label="查看联系方式"><Arrow diagonal /></button></div><div className="contact-description"><p>关于一张画、一个想法，或下一次合作，<br />期待与你聊聊。</p><div className="contact-direct"><a href={'tel:+86' + profile.phone} aria-label={'拨打电话' + profile.phone}>{profile.phoneDisplay}<Arrow diagonal /></a><button onClick={() => copyContact(profile.wechat, '微信搜索号码')}>微信搜索同号 <span>复制号码</span></button></div></div></div><footer className="footer"><a className="wordmark" href="#home" aria-label="丁浩轩，返回首页">DHX<span className="wordmark-dot" /></a><span>© {new Date().getFullYear()} 丁浩轩 / DING HAOXUAN</span><a href="#home" className="back-to-top">BACK TO TOP <span>↑</span></a></footer></div><span className="contact-watermark" aria-hidden="true">HAOXUAN</span></section>
    </main>

    <dialog className={'site-dialog ' + (modal?.type === 'project' ? 'project-dialog' : 'contact-dialog')} ref={dialogRef} onClose={onDialogClose} onClick={event => { if (event.target === event.currentTarget) closeModal(); }} aria-labelledby="dialog-title">
      {modal?.type === 'project' && <div className="project-dialog-inner">
        <div className="dialog-topbar"><span>{modal.project.discipline}</span><button className="dialog-close" onClick={closeModal} aria-label="关闭项目详情">×</button></div>
        <img className="dialog-project-image" src={modal.project.fullImage || modal.project.image} alt={modal.project.imageAlt} />
        <div className="dialog-project-copy">
          <span className="eyebrow">{modal.project.badge} / {modal.project.year}</span><h2 id="dialog-title">{modal.project.name}</h2><p className="dialog-subtitle">{modal.project.subtitle}</p>
          <div className="dialog-description-grid"><div><h3>{modal.project.descriptionTitle || '想表达的'}</h3><p>{modal.project.description}</p></div><div><h3>{modal.project.approachTitle || '创作过程'}</h3><p>{modal.project.approach}</p></div></div>
          <div className="dialog-deliverables">{modal.project.deliverables.map(item => <span key={item}>{item}</span>)}</div>
          <button className="dialog-contact-link" onClick={() => setModal({ type: 'contact' })}>聊聊下一次创作 <Arrow diagonal /></button>
        </div>
      </div>}
      {modal?.type === 'contact' && <div className="contact-dialog-inner"><div className="dialog-topbar"><span>A NEW CONVERSATION.</span><button className="dialog-close" onClick={closeModal} aria-label="关闭联系方式">×</button></div><Seal className="contact-dialog-seal" /><h2 id="dialog-title">很高兴，<br />在这里认识你。</h2><p className="contact-dialog-name">{profile.name} / AI 视觉创作 · 武术专业在读</p><div className="contact-method"><span>PHONE / 电话</span><div><a href={'tel:+86' + profile.phone}>{profile.phoneDisplay}</a><button onClick={() => copyContact(profile.phone, '电话号码')} aria-label="复制电话号码">复制<Arrow diagonal /></button></div></div><div className="contact-method"><span>WECHAT / 微信</span><div><p>{profile.wechat}</p><button onClick={() => copyContact(profile.wechat, '微信搜索号码')} aria-label="复制微信搜索号码">复制<Arrow diagonal /></button></div><small>在微信中搜索此手机号，即可找到我。</small></div><p className="contact-copy-status" role="status">{toast}</p><p className="contact-dialog-note">视觉创作交流 / 内容合作 / 更多可能</p></div>}
    </dialog>
    {!modal && <div className={'toast ' + (toast ? 'visible' : '')} role="status">{toast}</div>}
  </>;
}

